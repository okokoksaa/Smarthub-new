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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Roles, UserRole } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinutesService } from './minutes.service';
import {
  UploadMinutesDto,
  ApproveMinutesDto,
  VerifyMinutesDto,
  UpdateMinutesDto,
} from './dto/create-minutes.dto';

/**
 * WDC Minutes Controller
 * Handles HTTP requests for Ward Development Committee meeting minutes
 */
@ApiTags('WDC Minutes')
@Controller('minutes')
export class MinutesController {
  constructor(private readonly minutesService: MinutesService) {}

  /**
   * Upload new meeting minutes
   */
  @Post('upload')
  @ApiOperation({ summary: 'Upload WDC meeting minutes document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Minutes upload data with document file',
    type: UploadMinutesDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Minutes uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid minutes data or meeting already has minutes',
  })
  @UseInterceptors(FileInterceptor('document'))
  async upload(
    @Body() uploadMinutesDto: UploadMinutesDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';

    // TODO: Handle file upload to storage service
    if (file) {
      uploadMinutesDto.documentName = file.originalname;
      uploadMinutesDto.documentSizeBytes = file.size;
      uploadMinutesDto.documentUrl = `/uploads/minutes/${Date.now()}_${file.originalname}`;
      
      // Determine document type from file extension
      const fileExt = file.originalname.split('.').pop()?.toUpperCase();
      if (['PDF', 'DOC', 'DOCX'].includes(fileExt || '')) {
        uploadMinutesDto.documentType = fileExt as string;
      }
    }

    return this.minutesService.upload(uploadMinutesDto, userId);
  }

  /**
   * Get all minutes with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all meeting minutes with filtering and pagination' })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filter by meeting ID',
  })
  @ApiQuery({
    name: 'approved',
    required: false,
    type: Boolean,
    description: 'Filter by approval status',
  })
  @ApiQuery({
    name: 'verified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
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
    description: 'Minutes retrieved successfully',
  })
  async findAll(
    @Query('meetingId') meetingId?: string,
    @Query('approved') approved?: boolean,
    @Query('verified') verified?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.minutesService.findAll(
      meetingId,
      approved,
      verified,
      page || 1,
      limit || 10,
    );
  }

  /**
   * Get minutes statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get minutes statistics' })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filter statistics by meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(@Query('meetingId') meetingId?: string) {
    return this.minutesService.getStatistics(meetingId);
  }

  /**
   * Get pending approvals for chairperson
   */
  @Get('pending-approvals')
  @ApiOperation({ summary: 'Get minutes pending chairperson approval' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter by ward ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending approvals retrieved successfully',
  })
  async getPendingApprovals(@Query('wardId') wardId?: string) {
    return this.minutesService.getPendingApprovals(wardId);
  }

  /**
   * Get minutes by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get minutes by ID' })
  @ApiParam({
    name: 'id',
    description: 'Minutes ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Minutes not found',
  })
  async findOne(@Param('id') id: string) {
    return this.minutesService.findOne(id);
  }

  /**
   * Get minutes by meeting ID
   */
  @Get('meeting/:meetingId')
  @ApiOperation({ summary: 'Get minutes by meeting ID' })
  @ApiParam({
    name: 'meetingId',
    description: 'Meeting ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes retrieved successfully',
  })
  async findByMeeting(@Param('meetingId') meetingId: string) {
    const minutes = await this.minutesService.findByMeeting(meetingId);
    if (!minutes) {
      return { message: 'No minutes found for this meeting' };
    }
    return minutes;
  }

  /**
   * Update minutes (only if not approved)
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update minutes (only if not yet approved)' })
  @ApiParam({
    name: 'id',
    description: 'Minutes ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update approved minutes',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to update these minutes',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMinutesDto: UpdateMinutesDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';

    return this.minutesService.update(id, updateMinutesDto, userId);
  }

  /**
   * Approve minutes (WDC Chairperson)
   */
  @Post(':id/approve')
  @Roles(UserRole.WDC_CHAIRPERSON)
  @ApiOperation({ summary: 'Approve or reject minutes (WDC Chairperson only)' })
  @ApiParam({
    name: 'id',
    description: 'Minutes ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes approval status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Minutes already approved or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Only WDC Chairperson can approve minutes',
  })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveMinutesDto,
    @Req() req: any,
  ) {
    // TODO: Extract chairperson ID from JWT token and verify role
    const chairpersonId = req.user?.id || 'dummy-chairperson-id';

    return this.minutesService.approve(id, approveDto, chairpersonId);
  }

  /**
   * Verify minutes (Official verification)
   */
  @Post(':id/verify')
  @Roles(UserRole.DISTRICT_ADMIN, UserRole.CONSTITUENCY_COORDINATOR)
  @ApiOperation({ summary: 'Verify minutes (Official verification)' })
  @ApiParam({
    name: 'id',
    description: 'Minutes ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes verification status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Minutes must be approved before verification',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to verify minutes',
  })
  async verify(
    @Param('id') id: string,
    @Body() verifyDto: VerifyMinutesDto,
    @Req() req: any,
  ) {
    // TODO: Extract verifier ID from JWT token and verify role
    const verifierId = req.user?.id || 'dummy-verifier-id';

    return this.minutesService.verify(id, verifyDto, verifierId);
  }

  /**
   * Delete minutes
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete minutes (only if not approved)' })
  @ApiParam({
    name: 'id',
    description: 'Minutes ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Minutes deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete approved minutes',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized to delete these minutes',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';

    await this.minutesService.remove(id, userId);
    return { message: 'Minutes deleted successfully' };
  }
}