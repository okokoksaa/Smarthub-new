import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { WdcMinutes } from './entities/minutes.entity';
import {
  UploadMinutesDto,
  ApproveMinutesDto,
  VerifyMinutesDto,
  UpdateMinutesDto,
} from './dto/create-minutes.dto';

/**
 * Minutes Service
 * Handles WDC meeting minutes business logic
 */
@Injectable()
export class MinutesService {
  private readonly logger = new Logger(MinutesService.name);

  constructor(
    @InjectRepository(WdcMinutes)
    private readonly minutesRepository: Repository<WdcMinutes>,
  ) {}

  /**
   * Upload new meeting minutes
   */
  async upload(
    uploadMinutesDto: UploadMinutesDto,
    uploadedBy: string,
  ): Promise<WdcMinutes> {
    try {
      // Validate meeting exists and is completed
      await this.validateMeetingForMinutes(uploadMinutesDto.meetingId);

      // Check if minutes already exist for this meeting
      const existingMinutes = await this.minutesRepository.findOne({
        where: { meetingId: uploadMinutesDto.meetingId, isActive: true },
      });

      if (existingMinutes) {
        throw new BadRequestException('Minutes already exist for this meeting. Use update instead.');
      }

      const minutes = this.minutesRepository.create({
        ...uploadMinutesDto,
        recordedDate: new Date(uploadMinutesDto.recordedDate),
        uploadedBy,
      });

      const savedMinutes = await this.minutesRepository.save(minutes);
      
      this.logger.log(`Uploaded minutes for meeting ${uploadMinutesDto.meetingId} by user ${uploadedBy}`);
      
      return savedMinutes;
    } catch (error) {
      this.logger.error(`Failed to upload minutes: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload minutes');
    }
  }

  /**
   * Get all minutes with filtering and pagination
   */
  async findAll(
    meetingId?: string,
    approved?: boolean,
    verified?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{
    minutes: WdcMinutes[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = { isActive: true };

    // Apply filtering
    if (meetingId) {
      where.meetingId = meetingId;
    }

    if (approved !== undefined) {
      where.chairpersonApproved = approved;
    }

    if (verified !== undefined) {
      where.verified = verified;
    }

    const options: FindManyOptions<WdcMinutes> = {
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    };

    const [minutes, total] = await this.minutesRepository.findAndCount(options);

    return {
      minutes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get minutes by ID
   */
  async findOne(id: string): Promise<WdcMinutes> {
    const minutes = await this.minutesRepository.findOne({
      where: { id, isActive: true },
    });

    if (!minutes) {
      throw new NotFoundException(`Minutes with ID ${id} not found`);
    }

    return minutes;
  }

  /**
   * Get minutes by meeting ID
   */
  async findByMeeting(meetingId: string): Promise<WdcMinutes | null> {
    return this.minutesRepository.findOne({
      where: { meetingId, isActive: true },
    });
  }

  /**
   * Update minutes (only if not yet approved)
   */
  async update(
    id: string,
    updateMinutesDto: UpdateMinutesDto,
    userId: string,
  ): Promise<WdcMinutes> {
    const minutes = await this.findOne(id);

    // Only allow updates if not yet approved
    if (minutes.chairpersonApproved) {
      throw new BadRequestException('Cannot update minutes that have been approved');
    }

    // Only allow uploader or admin to update
    if (minutes.uploadedBy !== userId) {
      // TODO: Add proper role-based access check
      throw new ForbiddenException('You can only update minutes you uploaded');
    }

    // Update fields
    if (updateMinutesDto.documentName) minutes.documentName = updateMinutesDto.documentName;
    if (updateMinutesDto.recordedDate) minutes.recordedDate = new Date(updateMinutesDto.recordedDate);
    if (updateMinutesDto.attendeesPresent) minutes.attendeesPresent = updateMinutesDto.attendeesPresent;
    if (updateMinutesDto.decisionsMade) minutes.decisionsMade = updateMinutesDto.decisionsMade;
    if (updateMinutesDto.actionsAssigned !== undefined) minutes.actionsAssigned = updateMinutesDto.actionsAssigned;

    const savedMinutes = await this.minutesRepository.save(minutes);
    
    this.logger.log(`Updated minutes ${id} by user ${userId}`);
    
    return savedMinutes;
  }

  /**
   * Approve minutes (WDC Chairperson)
   */
  async approve(
    id: string,
    approveDto: ApproveMinutesDto,
    chairpersonId: string,
  ): Promise<WdcMinutes> {
    const minutes = await this.findOne(id);

    // Check if already approved
    if (minutes.chairpersonApproved) {
      throw new BadRequestException('Minutes have already been approved');
    }

    // Update approval status
    minutes.chairpersonApproved = approveDto.approved;
    
    if (approveDto.approved) {
      minutes.chairpersonApprovedBy = chairpersonId;
      minutes.chairpersonApprovedAt = new Date();
      minutes.signatureData = approveDto.signatureData;
    }

    // Add verification comments if provided
    if (approveDto.comments) {
      minutes.verificationComments = approveDto.comments;
    }

    const savedMinutes = await this.minutesRepository.save(minutes);
    
    const action = approveDto.approved ? 'approved' : 'rejected';
    this.logger.log(`Minutes ${id} ${action} by chairperson ${chairpersonId}`);
    
    return savedMinutes;
  }

  /**
   * Verify minutes (Official verification)
   */
  async verify(
    id: string,
    verifyDto: VerifyMinutesDto,
    verifierId: string,
  ): Promise<WdcMinutes> {
    const minutes = await this.findOne(id);

    // Minutes must be approved before verification
    if (!minutes.chairpersonApproved) {
      throw new BadRequestException('Minutes must be approved by chairperson before verification');
    }

    // Update verification status
    minutes.verified = verifyDto.verified;
    minutes.verifiedBy = verifierId;
    minutes.verifiedAt = new Date();
    minutes.verificationComments = verifyDto.verificationComments;

    const savedMinutes = await this.minutesRepository.save(minutes);
    
    const action = verifyDto.verified ? 'verified' : 'rejected';
    this.logger.log(`Minutes ${id} ${action} by verifier ${verifierId}`);
    
    return savedMinutes;
  }

  /**
   * Get minutes statistics
   */
  async getStatistics(meetingId?: string): Promise<{
    total: number;
    approved: number;
    verified: number;
    pending: number;
    rejected: number;
  }> {
    const where: any = { isActive: true };
    if (meetingId) {
      where.meetingId = meetingId;
    }

    const [
      total,
      approved,
      verified,
      rejected,
    ] = await Promise.all([
      this.minutesRepository.count({ where }),
      this.minutesRepository.count({ where: { ...where, chairpersonApproved: true } }),
      this.minutesRepository.count({ where: { ...where, verified: true } }),
      this.minutesRepository.count({ where: { ...where, chairpersonApproved: false } }),
    ]);

    const pending = total - approved;

    return {
      total,
      approved,
      verified,
      pending,
      rejected,
    };
  }

  /**
   * Get pending approvals for a chairperson
   */
  async getPendingApprovals(chairpersonWardId?: string): Promise<WdcMinutes[]> {
    const where: any = {
      isActive: true,
      chairpersonApproved: false,
    };

    // TODO: Add ward-based filtering when we have proper geography lookup
    // if (chairpersonWardId) {
    //   where.wardId = chairpersonWardId;
    // }

    return this.minutesRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Soft delete minutes
   */
  async remove(id: string, userId: string): Promise<void> {
    const minutes = await this.findOne(id);

    // Only allow deletion if not approved
    if (minutes.chairpersonApproved) {
      throw new BadRequestException('Cannot delete approved minutes');
    }

    // Only allow uploader to delete
    if (minutes.uploadedBy !== userId) {
      throw new ForbiddenException('You can only delete minutes you uploaded');
    }

    minutes.isActive = false;
    await this.minutesRepository.save(minutes);
    
    this.logger.log(`Deleted minutes ${id} by user ${userId}`);
  }

  /**
   * Validate meeting exists and is appropriate for minutes upload
   */
  private async validateMeetingForMinutes(meetingId: string): Promise<void> {
    // TODO: Add proper meeting validation
    // This would check:
    // 1. Meeting exists
    // 2. Meeting is completed
    // 3. Meeting had quorum
    // For now, we'll just validate the meetingId format
    
    if (!meetingId || meetingId.length === 0) {
      throw new BadRequestException('Valid meeting ID is required');
    }

    // In a real implementation, you would:
    // const meeting = await this.meetingsService.findOne(meetingId);
    // if (meeting.status !== MeetingStatus.COMPLETED) {
    //   throw new BadRequestException('Can only upload minutes for completed meetings');
    // }
    // if (!meeting.quorumMet) {
    //   throw new BadRequestException('Cannot upload minutes for meetings without quorum');
    // }
  }
}