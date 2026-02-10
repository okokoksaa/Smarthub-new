import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  SubmitProjectDto,
  WdcSignoffDto,
  CdfcApprovalDto,
  TacAppraisalDto,
  PlgoApprovalDto,
  MinistryApprovalDto,
  UpdateProgressDto,
  CompleteProjectDto,
  RejectProjectDto,
} from './dto/workflow.dto';
import { CreateMonitoringEvaluationDto } from './dto/monitoring-evaluation.dto';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ==================== CRUD ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'List all projects with filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'constituency_id', required: false })
  @ApiQuery({ name: 'ward_id', required: false })
  @ApiQuery({ name: 'sector', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(
    @Query('status') status?: string,
    @Query('constituency_id') constituencyId?: string,
    @Query('ward_id') wardId?: string,
    @Query('sector') sector?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.projectsService.findAll({
      status,
      constituencyId,
      wardId,
      sector,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/workflow-status')
  @ApiOperation({ summary: 'Get project workflow status with SLA tracking' })
  @ApiResponse({ status: 200, description: 'Workflow status retrieved' })
  async getWorkflowStatus(@Param('id') id: string) {
    return this.projectsService.getWorkflowStatus(id);
  }

  @Get('constituency/:id/stats')
  @ApiOperation({ summary: 'Get project statistics for a constituency' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getConstituencyStats(@Param('id') constituencyId: string) {
    return this.projectsService.getConstituencyStats(constituencyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new project (Draft)' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid project data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @Roles('cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen', 'super_admin')
  async create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project details' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, user);
  }

  // ==================== WDC WORKFLOW ====================

  @Post(':id/wdc-signoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add WDC meeting sign-off (required before submission)' })
  @ApiResponse({ status: 200, description: 'WDC sign-off recorded' })
  @ApiResponse({ status: 400, description: 'Invalid sign-off data' })
  @ApiResponse({ status: 403, description: 'Not authorized for WDC sign-off' })
  @Roles('wdc_member', 'cdfc_chair', 'cdfc_member', 'super_admin')
  async addWdcSignoff(
    @Param('id') id: string,
    @Body() wdcSignoffDto: WdcSignoffDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.addWdcSignoff(id, wdcSignoffDto, user);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit project for CDFC review (requires WDC sign-off)' })
  @ApiResponse({ status: 200, description: 'Project submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing WDC sign-off or other requirements' })
  @Roles('cdfc_chair', 'cdfc_member', 'wdc_member', 'super_admin')
  async submit(
    @Param('id') id: string,
    @Body() submitDto: SubmitProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.submit(id, submitDto, user);
  }

  // ==================== CDFC WORKFLOW ====================

  @Post(':id/cdfc-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CDFC Chair decision (approve/reject/return) - requires quorum >= 6' })
  @ApiResponse({ status: 200, description: 'CDFC decision recorded' })
  @ApiResponse({ status: 400, description: 'Quorum not met or invalid decision' })
  @ApiResponse({ status: 403, description: 'Not authorized - CDFC Chair only' })
  @Roles('cdfc_chair', 'super_admin')
  async cdfcApprove(
    @Param('id') id: string,
    @Body() approvalDto: CdfcApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.cdfcApprove(id, approvalDto, user);
  }

  // ==================== TAC WORKFLOW ====================

  @Post(':id/tac-appraise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'TAC technical appraisal (requires two reviewers)' })
  @ApiResponse({ status: 200, description: 'TAC appraisal recorded' })
  @ApiResponse({ status: 400, description: 'Two-reviewer rule not met or missing artefacts' })
  @ApiResponse({ status: 403, description: 'Not authorized - TAC members only' })
  @Roles('tac_chair', 'tac_member', 'super_admin')
  async tacAppraise(
    @Param('id') id: string,
    @Body() appraisalDto: TacAppraisalDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.tacAppraise(id, appraisalDto, user);
  }

  // ==================== PLGO WORKFLOW ====================

  @Post(':id/plgo-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PLGO decision (14 working day SLA)' })
  @ApiResponse({ status: 200, description: 'PLGO decision recorded' })
  @ApiResponse({ status: 400, description: 'Invalid decision' })
  @ApiResponse({ status: 403, description: 'Not authorized - PLGO only' })
  @Roles('plgo', 'ministry_official', 'super_admin')
  async plgoApprove(
    @Param('id') id: string,
    @Body() approvalDto: PlgoApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.plgoApprove(id, approvalDto, user);
  }

  // ==================== MINISTRY WORKFLOW ====================

  @Post(':id/ministry-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ministry approval (for consolidated lists)' })
  @ApiResponse({ status: 200, description: 'Ministry decision recorded' })
  @ApiResponse({ status: 403, description: 'Not authorized - Ministry officials only' })
  @Roles('ministry_official', 'super_admin')
  async ministryApprove(
    @Param('id') id: string,
    @Body() approvalDto: MinistryApprovalDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.ministryApprove(id, approvalDto, user);
  }

  // ==================== IMPLEMENTATION & COMPLETION ====================

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update project progress (0-100%)' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  @ApiResponse({ status: 400, description: 'Invalid progress value' })
  @Roles('cdfc_chair', 'finance_officer', 'plgo', 'super_admin')
  async updateProgress(
    @Param('id') id: string,
    @Body() progressDto: UpdateProgressDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.updateProgress(id, progressDto, user);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark project as complete (requires completion certificate)' })
  @ApiResponse({ status: 200, description: 'Project marked complete' })
  @ApiResponse({ status: 400, description: 'Missing completion certificate' })
  @Roles('plgo', 'cdfc_chair', 'super_admin')
  async complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.complete(id, completeDto, user);
  }

  // ==================== REJECTION ====================

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject project at any review stage' })
  @ApiResponse({ status: 200, description: 'Project rejected' })
  @ApiResponse({ status: 400, description: 'Cannot reject at this stage' })
  @Roles('cdfc_chair', 'tac_chair', 'plgo', 'ministry_official', 'super_admin')
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.reject(id, rejectDto, user);
  }

  // ==================== MONITORING & EVALUATION ====================

  @Post(':id/m-e-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a monitoring and evaluation report with GPS verification' })
  @ApiResponse({ status: 200, description: 'M&E report recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid M&E data' })
  @ApiResponse({ status: 403, description: 'Not authorized to record M&E report' })
  @Roles('cdfc_chair', 'plgo', 'super_admin', 'auditor') // Example roles
  async recordMonitoringEvaluation(
    @Param('id') id: string,
    @Body() mEReportDto: CreateMonitoringEvaluationDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.recordMonitoringEvaluation(id, mEReportDto, user);
  }

  @Get(':id/site-visits')
  @ApiOperation({ summary: 'List site visits (M&E) for a project' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listSiteVisits(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.projectsService.listSiteVisits(id, Number(page), Number(limit));
  }
}
