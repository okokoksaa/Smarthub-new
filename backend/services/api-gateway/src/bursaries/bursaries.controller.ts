import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BursariesService } from './bursaries.service';
import { TermsService } from './terms.service';
import { EligibilityService } from './eligibility.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApproveApplicationDto } from './dto/approve-application.dto';
import { VerifyEnrollmentDto } from './dto/verify-enrollment.dto';
import { DisburseTermDto } from './dto/disburse-term.dto';

@ApiTags('Bursaries')
@Controller('bursaries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class BursariesController {
  constructor(
    private readonly bursariesService: BursariesService,
    private readonly termsService: TermsService,
    private readonly eligibilityService: EligibilityService,
  ) {}

  // ========== Application Endpoints ==========

  @Get()
  @ApiOperation({ summary: 'List all bursary applications with filters' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  async findAll(
    @Query('status') status?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('academic_year') academicYear?: number,
    @Query('institution_type') institutionType?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @CurrentUser() user?: any,
    @Req() req?: any,
  ) {
    return this.bursariesService.findAll({
      status,
      constituencyId,
      academicYear,
      institutionType,
      page,
      limit,
      user,
      scopeContext: req?.scopeContext,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bursary application details' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bursariesService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create new bursary application' })
  @ApiResponse({ status: 201, description: 'Application created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid application data or eligibility failed' })
  @Roles('wdc_member', 'cdfc_member', 'cdfc_chair', 'citizen', 'super_admin')
  async create(@Body() createApplicationDto: CreateApplicationDto, @CurrentUser() user: any) {
    return this.bursariesService.create(createApplicationDto, user);
  }

  @Post(':id/shortlist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Shortlist application for review' })
  @ApiResponse({ status: 200, description: 'Application shortlisted' })
  @Roles('cdfc_member', 'cdfc_chair', 'super_admin')
  async shortlist(
    @Param('id') id: string,
    @Body() approveDto: ApproveApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.bursariesService.shortlist(id, approveDto, user);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject bursary application' })
  @ApiResponse({ status: 200, description: 'Application approved/rejected' })
  @ApiResponse({ status: 400, description: 'Invalid approval state' })
  @Roles('cdfc_chair', 'finance_officer', 'plgo', 'super_admin')
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApproveApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.bursariesService.approve(id, approveDto, user);
  }

  // ========== Eligibility Endpoints ==========

  @Get(':id/eligibility')
  @ApiOperation({ summary: 'Check application eligibility' })
  @ApiResponse({ status: 200, description: 'Eligibility check completed' })
  async checkEligibility(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eligibilityService.checkEligibility(id);
  }

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pre-check eligibility before submission' })
  @ApiResponse({ status: 200, description: 'Eligibility pre-check completed' })
  async preCheckEligibility(
    @Body() dto: Partial<CreateApplicationDto>,
    @CurrentUser() user: any,
  ) {
    return this.eligibilityService.preCheckEligibility(dto);
  }

  // ========== Term-by-Term Tracking Endpoints ==========

  @Get(':id/terms')
  @ApiOperation({ summary: 'Get all terms for a bursary application' })
  @ApiResponse({ status: 200, description: 'Terms retrieved successfully' })
  async getTerms(@Param('id') id: string, @CurrentUser() user: any) {
    return this.termsService.getTermsForApplication(id, user);
  }

  @Post(':id/terms')
  @ApiOperation({ summary: 'Create term payment records for application' })
  @ApiResponse({ status: 201, description: 'Terms created successfully' })
  @Roles('finance_officer', 'cdfc_chair', 'super_admin')
  async createTerms(
    @Param('id') id: string,
    @Body() termsData: { terms_count: number; academic_year: number },
    @CurrentUser() user: any,
  ) {
    return this.termsService.createTermsForApplication(id, termsData, user);
  }

  @Post(':id/terms/:termId/verify-enrollment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify enrollment for a term' })
  @ApiResponse({ status: 200, description: 'Enrollment verified' })
  @ApiResponse({ status: 400, description: 'Invalid enrollment verification' })
  @Roles('cdfc_member', 'cdfc_chair', 'finance_officer', 'super_admin')
  async verifyEnrollment(
    @Param('id') id: string,
    @Param('termId') termId: string,
    @Body() verifyDto: VerifyEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    return this.termsService.verifyEnrollment(termId, verifyDto, user);
  }

  @Post(':id/terms/:termId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve term payment' })
  @ApiResponse({ status: 200, description: 'Term payment approved' })
  @ApiResponse({ status: 400, description: 'Prerequisites not met' })
  @Roles('cdfc_chair', 'finance_officer', 'plgo', 'super_admin')
  async approveTerm(
    @Param('id') id: string,
    @Param('termId') termId: string,
    @CurrentUser() user: any,
  ) {
    return this.termsService.approveTerm(termId, user);
  }

  @Post(':id/terms/:termId/disburse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disburse term payment (5 working day SLA)' })
  @ApiResponse({ status: 200, description: 'Term payment disbursed' })
  @ApiResponse({ status: 400, description: 'Prerequisites not met' })
  @Roles('finance_officer', 'super_admin')
  async disburseTerm(
    @Param('id') id: string,
    @Param('termId') termId: string,
    @Body() disburseDto: DisburseTermDto,
    @CurrentUser() user: any,
  ) {
    return this.termsService.disburseTerm(termId, disburseDto, user);
  }

  // ========== SLA Tracking Endpoints ==========

  @Get('sla-report')
  @ApiOperation({ summary: 'Get SLA compliance report' })
  @ApiResponse({ status: 200, description: 'SLA report retrieved' })
  @Roles('plgo', 'ministry_official', 'auditor', 'super_admin')
  async getSlaReport(
    @Query('constituency_id') constituencyId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.termsService.getSlaReport(constituencyId);
  }

  @Get('sla-report/overdue')
  @ApiOperation({ summary: 'Get overdue payments requiring attention' })
  @ApiResponse({ status: 200, description: 'Overdue payments retrieved' })
  @Roles('finance_officer', 'cdfc_chair', 'plgo', 'ministry_official', 'super_admin')
  async getOverduePayments(
    @Query('constituency_id') constituencyId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.termsService.getOverduePayments(constituencyId);
  }

  // ========== Status Endpoint ==========

  @Get(':id/status')
  @ApiOperation({ summary: 'Get application workflow status' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bursariesService.getStatus(id, user);
  }
}
