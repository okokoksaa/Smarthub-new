import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, LessThan, MoreThan } from 'typeorm';
import {
  WdcMeeting,
  MeetingStatus,
  MeetingType,
} from './entities/meeting.entity';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  RecordAttendanceDto,
  CompleteMeetingDto,
} from './dto/create-meeting.dto';

/**
 * Meetings Service
 * Handles WDC meeting business logic
 */
@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    @InjectRepository(WdcMeeting)
    private readonly meetingRepository: Repository<WdcMeeting>,
  ) {}

  /**
   * Create a new WDC meeting
   */
  async create(
    createMeetingDto: CreateMeetingDto,
    createdBy: string,
  ): Promise<WdcMeeting> {
    try {
      // Get geographic data based on wardId
      const geographicData = await this.getGeographicData(createMeetingDto.wardId);

      // Validate meeting date is in the future
      const meetingDate = new Date(createMeetingDto.meetingDate);
      if (meetingDate <= new Date()) {
        throw new BadRequestException('Meeting date must be in the future');
      }

      // Check for conflicting meetings
      await this.checkMeetingConflicts(createMeetingDto.wardId, meetingDate);

      const meeting = this.meetingRepository.create({
        ...createMeetingDto,
        ...geographicData,
        meetingDate,
        nextMeetingDate: createMeetingDto.nextMeetingDate ? new Date(createMeetingDto.nextMeetingDate) : undefined,
        createdBy,
      });

      const savedMeeting = await this.meetingRepository.save(meeting);
      
      this.logger.log(`Created meeting ${savedMeeting.meetingNumber} by user ${createdBy}`);
      
      return savedMeeting;
    } catch (error) {
      this.logger.error(`Failed to create meeting: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create meeting');
    }
  }

  /**
   * Get all meetings with filtering and pagination
   */
  async findAll(
    wardId?: string,
    status?: MeetingStatus,
    type?: MeetingType,
    fromDate?: string,
    toDate?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    meetings: WdcMeeting[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = { isActive: true };

    // Apply ward filtering
    if (wardId) {
      where.wardId = wardId;
    }

    // Apply status filtering
    if (status) {
      where.status = status;
    }

    // Apply meeting type filtering
    if (type) {
      where.meetingType = type;
    }

    // Apply date range filtering
    if (fromDate) {
      where.meetingDate = MoreThan(new Date(fromDate));
    }
    if (toDate) {
      if (where.meetingDate) {
        // Need to use complex where clause for date range
        delete where.meetingDate;
      }
    }

    const options: FindManyOptions<WdcMeeting> = {
      where,
      order: { meetingDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    // Add date range filtering if both dates provided
    if (fromDate && toDate) {
      options.where = {
        ...where,
        meetingDate: LessThan(new Date(toDate)),
      };
    }

    const [meetings, total] = await this.meetingRepository.findAndCount(options);

    return {
      meetings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get meeting by ID
   */
  async findOne(id: string): Promise<WdcMeeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id, isActive: true },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return meeting;
  }

  /**
   * Update meeting (only scheduled meetings)
   */
  async update(
    id: string,
    updateMeetingDto: UpdateMeetingDto,
    userId: string,
  ): Promise<WdcMeeting> {
    const meeting = await this.findOne(id);

    // Only allow updates on scheduled meetings
    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Can only update scheduled meetings');
    }

    // Validate new meeting date if provided
    if (updateMeetingDto.meetingDate) {
      const newMeetingDate = new Date(updateMeetingDto.meetingDate);
      if (newMeetingDate <= new Date()) {
        throw new BadRequestException('Meeting date must be in the future');
      }

      // Check for conflicts with the new date
      await this.checkMeetingConflicts(meeting.wardId, newMeetingDate, meeting.id);
      Object.assign(meeting, { meetingDate: newMeetingDate });
    }

    // Update other fields
    if (updateMeetingDto.location) meeting.location = updateMeetingDto.location;
    if (updateMeetingDto.agenda) meeting.agenda = updateMeetingDto.agenda;
    if (updateMeetingDto.expectedAttendees) meeting.expectedAttendees = updateMeetingDto.expectedAttendees;
    if (updateMeetingDto.nextMeetingDate) {
      meeting.nextMeetingDate = new Date(updateMeetingDto.nextMeetingDate);
    }

    meeting.updatedBy = userId;

    const savedMeeting = await this.meetingRepository.save(meeting);
    
    this.logger.log(`Updated meeting ${savedMeeting.meetingNumber} by user ${userId}`);
    
    return savedMeeting;
  }

  /**
   * Record attendance for a meeting
   */
  async recordAttendance(
    id: string,
    attendanceDto: RecordAttendanceDto,
    userId: string,
  ): Promise<WdcMeeting> {
    const meeting = await this.findOne(id);

    // Can only record attendance for scheduled or in-progress meetings
    if (![MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS].includes(meeting.status)) {
      throw new BadRequestException('Can only record attendance for scheduled or in-progress meetings');
    }

    // Update attendance information
    meeting.attendeesPresent = attendanceDto.attendeesPresent;
    meeting.actualAttendees = attendanceDto.attendeesPresent.length;
    meeting.status = MeetingStatus.IN_PROGRESS;
    meeting.updatedBy = userId;

    const savedMeeting = await this.meetingRepository.save(meeting);
    
    this.logger.log(`Recorded attendance for meeting ${savedMeeting.meetingNumber}: ${meeting.actualAttendees} attendees`);
    
    return savedMeeting;
  }

  /**
   * Complete a meeting
   */
  async complete(
    id: string,
    completeMeetingDto: CompleteMeetingDto,
    userId: string,
  ): Promise<WdcMeeting> {
    const meeting = await this.findOne(id);

    // Can only complete scheduled or in-progress meetings
    if (![MeetingStatus.SCHEDULED, MeetingStatus.IN_PROGRESS].includes(meeting.status)) {
      throw new BadRequestException('Can only complete scheduled or in-progress meetings');
    }

    // Update final meeting information
    meeting.attendeesPresent = completeMeetingDto.attendeesPresent;
    meeting.actualAttendees = completeMeetingDto.attendeesPresent.length;
    meeting.decisionsMade = completeMeetingDto.decisionsMade;
    meeting.actionsAssigned = completeMeetingDto.actionsAssigned;
    meeting.status = MeetingStatus.COMPLETED;
    meeting.completedBy = userId;
    meeting.completedAt = new Date();
    meeting.updatedBy = userId;

    if (completeMeetingDto.nextMeetingDate) {
      meeting.nextMeetingDate = new Date(completeMeetingDto.nextMeetingDate);
    }

    const savedMeeting = await this.meetingRepository.save(meeting);
    
    this.logger.log(`Completed meeting ${savedMeeting.meetingNumber} with quorum: ${meeting.quorumMet}`);
    
    return savedMeeting;
  }

  /**
   * Cancel a meeting
   */
  async cancel(id: string, reason: string, userId: string): Promise<WdcMeeting> {
    const meeting = await this.findOne(id);

    // Can only cancel scheduled meetings
    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Can only cancel scheduled meetings');
    }

    meeting.status = MeetingStatus.CANCELLED;
    meeting.decisionsMade = `Meeting cancelled. Reason: ${reason}`;
    meeting.updatedBy = userId;

    const savedMeeting = await this.meetingRepository.save(meeting);
    
    this.logger.log(`Cancelled meeting ${savedMeeting.meetingNumber}: ${reason}`);
    
    return savedMeeting;
  }

  /**
   * Get upcoming meetings for a ward
   */
  async getUpcoming(wardId: string, limit = 5): Promise<WdcMeeting[]> {
    return this.meetingRepository.find({
      where: {
        wardId,
        isActive: true,
        status: MeetingStatus.SCHEDULED,
        meetingDate: MoreThan(new Date()),
      },
      order: { meetingDate: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get meeting statistics
   */
  async getStatistics(wardId?: string): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    averageAttendance: number;
    quorumMeetings: number;
  }> {
    const where: any = { isActive: true };
    if (wardId) {
      where.wardId = wardId;
    }

    const [
      total,
      scheduled,
      completed,
      cancelled,
      completedMeetings,
    ] = await Promise.all([
      this.meetingRepository.count({ where }),
      this.meetingRepository.count({ where: { ...where, status: MeetingStatus.SCHEDULED } }),
      this.meetingRepository.count({ where: { ...where, status: MeetingStatus.COMPLETED } }),
      this.meetingRepository.count({ where: { ...where, status: MeetingStatus.CANCELLED } }),
      this.meetingRepository.find({ where: { ...where, status: MeetingStatus.COMPLETED } }),
    ]);

    // Calculate attendance statistics
    let totalAttendance = 0;
    let quorumMeetings = 0;

    completedMeetings.forEach(meeting => {
      totalAttendance += meeting.actualAttendees;
      if (meeting.quorumMet) {
        quorumMeetings++;
      }
    });

    const averageAttendance = completed > 0 ? Math.round(totalAttendance / completed) : 0;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      averageAttendance,
      quorumMeetings,
    };
  }

  /**
   * Soft delete meeting
   */
  async remove(id: string, userId: string): Promise<void> {
    const meeting = await this.findOne(id);

    // Only allow deletion of scheduled meetings
    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Can only delete scheduled meetings');
    }

    meeting.isActive = false;
    meeting.updatedBy = userId;

    await this.meetingRepository.save(meeting);
    
    this.logger.log(`Deleted meeting ${meeting.meetingNumber} by user ${userId}`);
  }

  /**
   * Check for meeting conflicts
   */
  private async checkMeetingConflicts(
    wardId: string,
    meetingDate: Date,
    excludeMeetingId?: string,
  ): Promise<void> {
    const where: any = {
      wardId,
      isActive: true,
      status: MeetingStatus.SCHEDULED,
    };

    if (excludeMeetingId) {
      where.id = { $ne: excludeMeetingId };
    }

    // Check for meetings within 2 hours of the proposed time
    const twoHoursBefore = new Date(meetingDate.getTime() - 2 * 60 * 60 * 1000);
    const twoHoursAfter = new Date(meetingDate.getTime() + 2 * 60 * 60 * 1000);

    const conflictingMeetings = await this.meetingRepository.find({
      where: {
        ...where,
        meetingDate: LessThan(twoHoursAfter),
      },
    });

    const hasConflict = conflictingMeetings.some(meeting => 
      meeting.meetingDate >= twoHoursBefore
    );

    if (hasConflict) {
      throw new BadRequestException('Meeting conflicts with existing meeting. Please choose a different time.');
    }
  }

  /**
   * Get geographic data based on ward ID
   * TODO: Implement proper database lookup
   */
  private async getGeographicData(wardId: string): Promise<{
    constituencyId: string;
    districtId: string;
    provinceId: string;
  }> {
    // This is a simplified implementation
    // In a real system, you would query the wards table to get the geographic hierarchy
    return {
      constituencyId: 'dummy-constituency-id',
      districtId: 'dummy-district-id',
      provinceId: 'dummy-province-id',
    };
  }
}