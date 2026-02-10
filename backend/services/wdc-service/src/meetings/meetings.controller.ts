import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { MeetingStatus, MeetingType } from './entities/meeting.entity';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  RecordAttendanceDto,
  CompleteMeetingDto,
} from './dto/create-meeting.dto';

/**
 * WDC Meetings Controller
 * Handles HTTP requests for Ward Development Committee meetings
 */
@ApiTags('WDC Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  /**
   * Create a new meeting
   */
  @Post()
  @ApiOperation({ summary: 'Schedule a new WDC meeting' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meeting created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid meeting data or scheduling conflict',
  })
  async create(
    @Body() createMeetingDto: CreateMeetingDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.meetingsService.create(createMeetingDto, userId);
  }

  /**
   * Get all meetings with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all meetings with filtering and pagination' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter by ward ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MeetingStatus,
    description: 'Filter by meeting status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: MeetingType,
    description: 'Filter by meeting type',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    description: 'Filter from date (ISO string)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description: 'Filter to date (ISO string)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meetings retrieved successfully',
  })
  async findAll(
    @Query('wardId') wardId?: string,
    @Query('status') status?: MeetingStatus,
    @Query('type') type?: MeetingType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.meetingsService.findAll(
      wardId,
      status,
      type,
      fromDate,
      toDate,
      page || 1,
      limit || 10,
    );
  }

  /**
   * Get upcoming meetings for a ward
   */
  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings for a ward' })
  @ApiQuery({
    name: 'wardId',
    required: true,
    description: 'Ward ID to get upcoming meetings for',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of meetings to return (default: 5)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upcoming meetings retrieved successfully',
  })
  async getUpcoming(
    @Query('wardId') wardId: string,
    @Query('limit') limit?: number,
  ) {
    return this.meetingsService.getUpcoming(wardId, limit || 5);
  }

  /**
   * Get meeting statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get meeting statistics' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter statistics by ward ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Query('wardId') wardId?: string) {
    return this.meetingsService.getStatistics(wardId);
  }

  /**
   * Get meeting by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meeting retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meeting not found',
  })
  async findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  /**
   * Update meeting
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update meeting (only SCHEDULED meetings)' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meeting updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update non-scheduled meeting',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.meetingsService.update(id, updateMeetingDto, userId);
  }

  /**
   * Record attendance
   */
  @Post(':id/attendance')
  @ApiOperation({ summary: 'Record meeting attendance' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attendance recorded successfully',
  })
  async recordAttendance(
    @Param('id') id: string,
    @Body() attendanceDto: RecordAttendanceDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.meetingsService.recordAttendance(id, attendanceDto, userId);
  }

  /**
   * Complete meeting
   */
  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete meeting with final decisions and actions' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meeting completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot complete meeting in current status',
  })
  async complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteMeetingDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.meetingsService.complete(id, completeDto, userId);
  }

  /**
   * Cancel meeting
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled meeting' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meeting cancelled successfully',
  })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.meetingsService.cancel(id, reason, userId);
  }

  /**
   * Delete meeting
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete meeting (only SCHEDULED meetings)' })
  @ApiParam({
    name: 'id',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Meeting deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete non-scheduled meeting',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    await this.meetingsService.remove(id, userId);
    return { message: 'Meeting deleted successfully' };
  }
}