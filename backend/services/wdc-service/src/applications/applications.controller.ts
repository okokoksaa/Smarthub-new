import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './entities/application.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  SubmitApplicationDto,
  ReviewApplicationDto,
  VerifyResidencyDto,
} from './dto/create-application.dto';

/**
 * WDC Applications Controller
 * Handles HTTP requests for Ward Development Committee applications
 */
@ApiTags('WDC Applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * Create a new application
   */
  @Post()
  @ApiOperation({ summary: 'Create a new WDC application' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid application data',
  })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.applicationsService.create(createApplicationDto, userId);
  }

  /**
   * Get all applications with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all applications with filtering and pagination' })
  @ApiQuery({
    name: 'wardId',
    required: false,
    description: 'Filter by ward ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ApplicationStatus,
    description: 'Filter by application status',
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
    description: 'Applications retrieved successfully',
  })
  async findAll(
    @Query('wardId') wardId?: string,
    @Query('status') status?: ApplicationStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req?.user?.id;
    
    return this.applicationsService.findAll(
      wardId,
      status,
      page || 1,
      limit || 10,
      userId,
    );
  }

  /**
   * Get application statistics
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Get application statistics' })
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
    return this.applicationsService.getStatistics(wardId);
  }

  /**
   * Get application by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id;
    
    return this.applicationsService.findOne(id, userId);
  }

  /**
   * Update application
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update application (only DRAFT applications)' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update non-draft application',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot update other users applications',
  })
  async update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.applicationsService.update(id, updateApplicationDto, userId);
  }

  /**
   * Submit application for WDC review
   */
  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit application for WDC review' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Application does not meet submission requirements',
  })
  async submit(
    @Param('id') id: string,
    @Body() submitDto: SubmitApplicationDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.applicationsService.submit(id, submitDto, userId);
  }

  /**
   * Review application (WDC chairperson/member)
   */
  @Post(':id/review')
  @ApiOperation({ summary: 'Review application (approve/reject)' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application reviewed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot review application in current status',
  })
  async review(
    @Param('id') id: string,
    @Body() reviewDto: ReviewApplicationDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token and verify WDC role
    const reviewerId = req.user?.id || 'dummy-reviewer-id';
    
    return this.applicationsService.review(id, reviewDto, reviewerId);
  }

  /**
   * Verify applicant residency
   */
  @Post(':id/verify-residency')
  @ApiOperation({ summary: 'Verify applicant residency' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Residency verification completed',
  })
  async verifyResidency(
    @Param('id') id: string,
    @Body() verifyDto: VerifyResidencyDto,
    @Req() req: any,
  ) {
    // TODO: Extract user ID from JWT token and verify WDC role
    const verifierId = req.user?.id || 'dummy-verifier-id';
    
    return this.applicationsService.verifyResidency(id, verifyDto, verifierId);
  }

  /**
   * Forward application to CDFC
   */
  @Post(':id/forward')
  @ApiOperation({ summary: 'Forward approved application to CDFC' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application forwarded to CDFC successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Application does not meet forwarding requirements',
  })
  async forwardToCdfc(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token and verify WDC chairperson role
    const userId = req.user?.id || 'dummy-user-id';
    
    return this.applicationsService.forwardToCdfc(id, userId);
  }

  /**
   * Delete application (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete application (only DRAFT applications)' })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete non-draft application',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete other users applications',
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    // TODO: Extract user ID from JWT token
    const userId = req.user?.id || 'dummy-user-id';
    
    await this.applicationsService.remove(id, userId);
    return { message: 'Application deleted successfully' };
  }
}