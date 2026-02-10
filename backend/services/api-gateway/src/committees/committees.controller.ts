import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CommitteesService } from './committees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateCommitteeDto,
  AddMemberDto,
  CreateMeetingDto,
  RecordAttendanceDto,
  ConflictOfInterestDto,
  RecordVoteDto,
  UploadMinutesDto,
  ApproveMinutesDto,
} from './dto/committee.dto';

@ApiTags('Committees & Meetings')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  // ==================== COMMITTEES ====================

  @Get('committees')
  @ApiOperation({ summary: 'List all committees with filters' })
  @ApiResponse({ status: 200, description: 'Committees retrieved successfully' })
  async findAllCommittees(
    @Query('type') type?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('province_id') provinceId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.committeesService.findAllCommittees({
      type,
      constituencyId,
      provinceId,
      page,
      limit,
    });
  }

  @Get('committees/:id')
  @ApiOperation({ summary: 'Get committee details' })
  @ApiResponse({ status: 200, description: 'Committee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Committee not found' })
  async findOneCommittee(@Param('id') id: string) {
    return this.committeesService.findOneCommittee(id);
  }

  @Post('committees')
  @ApiOperation({ summary: 'Create a new committee' })
  @ApiResponse({ status: 201, description: 'Committee created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid committee data' })
  @Roles('plgo', 'ministry_official', 'super_admin')
  async createCommittee(
    @Body() createCommitteeDto: CreateCommitteeDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.createCommittee(createCommitteeDto, user);
  }

  @Post('committees/:id/members')
  @ApiOperation({ summary: 'Add member to committee' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 400, description: 'User already a member' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async addMember(
    @Param('id') committeeId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.addMember(committeeId, addMemberDto, user);
  }

  @Delete('committees/:id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove member from committee' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @Roles('cdfc_chair', 'plgo', 'super_admin')
  async removeMember(
    @Param('id') committeeId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.removeMember(committeeId, userId, user);
  }

  // ==================== MEETINGS ====================

  @Get('meetings')
  @ApiOperation({ summary: 'List all meetings with filters' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully' })
  async findAllMeetings(
    @Query('committee_id') committeeId?: string,
    @Query('status') status?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.committeesService.findAllMeetings({
      committeeId,
      status,
      fromDate,
      toDate,
      page,
      limit,
    });
  }

  @Get('meetings/:id')
  @ApiOperation({ summary: 'Get meeting details' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findOneMeeting(@Param('id') id: string) {
    return this.committeesService.findOneMeeting(id);
  }

  @Post('meetings')
  @ApiOperation({ summary: 'Schedule a new meeting' })
  @ApiResponse({ status: 201, description: 'Meeting scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid meeting data' })
  @Roles('cdfc_chair', 'tac_chair', 'plgo', 'super_admin')
  async createMeeting(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.createMeeting(createMeetingDto, user);
  }

  @Post('meetings/:id/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record meeting attendance' })
  @ApiResponse({ status: 200, description: 'Attendance recorded successfully' })
  @Roles('cdfc_chair', 'tac_chair', 'plgo', 'super_admin')
  async recordAttendance(
    @Param('id') meetingId: string,
    @Body() recordAttendanceDto: RecordAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.recordAttendance(meetingId, recordAttendanceDto, user);
  }

  @Post('meetings/:id/conflict-of-interest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Declare conflict of interest for an agenda item' })
  @ApiResponse({ status: 200, description: 'Conflict of interest recorded' })
  async recordConflictOfInterest(
    @Param('id') meetingId: string,
    @Body() coiDto: ConflictOfInterestDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.recordConflictOfInterest(meetingId, coiDto, user);
  }

  @Post('meetings/:id/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record vote on agenda item' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 400, description: 'Quorum not met or voter has COI' })
  @Roles('cdfc_member', 'cdfc_chair', 'tac_member', 'tac_chair', 'wdc_member')
  async recordVote(
    @Param('id') meetingId: string,
    @Body() voteDto: RecordVoteDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.recordVote(meetingId, voteDto, user);
  }

  @Post('meetings/:id/minutes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload meeting minutes' })
  @ApiResponse({ status: 200, description: 'Minutes uploaded successfully' })
  @Roles('cdfc_chair', 'tac_chair', 'plgo', 'super_admin')
  async uploadMinutes(
    @Param('id') meetingId: string,
    @Body() uploadMinutesDto: UploadMinutesDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.uploadMinutes(meetingId, uploadMinutesDto, user);
  }

  @Post('meetings/:id/approve-minutes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve meeting minutes' })
  @ApiResponse({ status: 200, description: 'Minutes approved successfully' })
  @Roles('cdfc_chair', 'tac_chair', 'plgo')
  async approveMinutes(
    @Param('id') meetingId: string,
    @Body() approveMinutesDto: ApproveMinutesDto,
    @CurrentUser() user: any,
  ) {
    return this.committeesService.approveMinutes(meetingId, approveMinutesDto, user);
  }

  // ==================== VOTE RESULTS ====================

  @Get('meetings/:id/vote-results')
  @ApiOperation({ summary: 'Get all vote results for a meeting' })
  @ApiResponse({ status: 200, description: 'Vote results retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeetingVoteResults(@Param('id') meetingId: string) {
    return this.committeesService.getMeetingVoteResults(meetingId);
  }

  @Get('meetings/:id/vote-results/:agendaItem')
  @ApiOperation({ summary: 'Get vote results for a specific agenda item' })
  @ApiResponse({ status: 200, description: 'Vote results retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Meeting or agenda item not found' })
  async getAgendaItemVoteResults(
    @Param('id') meetingId: string,
    @Param('agendaItem') agendaItem: string,
  ) {
    return this.committeesService.calculateVoteResults(meetingId, decodeURIComponent(agendaItem));
  }

  @Get('committees/:id/voter-eligibility/:userId')
  @ApiOperation({ summary: 'Check if a user is eligible to vote in a committee' })
  @ApiResponse({ status: 200, description: 'Eligibility status returned' })
  async checkVoterEligibility(
    @Param('id') committeeId: string,
    @Param('userId') userId: string,
  ) {
    const isEligible = await this.committeesService.isVoterEligible(committeeId, userId);
    return { committee_id: committeeId, user_id: userId, is_eligible: isEligible };
  }
}
