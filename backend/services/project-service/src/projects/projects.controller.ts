import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApproveProjectDto } from './dto/approve-project.dto';
import { UpdateProgressDto as UpdateProgressDtoInternal, CompleteProjectDto as CompleteProjectDtoInternal } from './dto/update-progress.dto';
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
import { ProjectStatus, ProjectType } from '@shared/database';

/**
 * Projects Controller
 * Handles all project management endpoints
 */
@ApiTags('Projects')
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ==================== Project CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    return this.projectsService.create(createProjectDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'projectType', required: false, enum: ProjectType })
  @ApiQuery({ name: 'constituencyId', required: false, type: String })
  @ApiQuery({ name: 'wardId', required: false, type: String })
  @ApiQuery({ name: 'fiscalYear', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ProjectStatus,
    @Query('projectType') projectType?: ProjectType,
    @Query('constituencyId') constituencyId?: string,
    @Query('wardId') wardId?: string,
    @Query('fiscalYear') fiscalYear?: number,
    @Query('search') search?: string,
  ) {
    return this.projectsService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      projectType,
      constituencyId,
      wardId,
      fiscalYear: fiscalYear ? Number(fiscalYear) : undefined,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiQuery({ name: 'constituencyId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics(@Query('constituencyId') constituencyId?: string) {
    return this.projectsService.getStatistics(constituencyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get project by code' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findByCode(@Param('code') code: string) {
    return this.projectsService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 400, description: 'Cannot update completed or closed projects' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel project (soft delete)' })
  @ApiResponse({ status: 204, description: 'Project cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 400, description: 'Can only cancel draft, submitted, or rejected projects' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.projectsService.remove(id, req.user.id);
  }

  // ==================== Project Lifecycle ====================

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit project for approval' })
  @ApiResponse({ status: 200, description: 'Project submitted successfully' })
  @ApiResponse({ status: 400, description: 'Only draft projects can be submitted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  submit(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.projectsService.submit(id, req.user.id);
  }

  @Post(':id/cdfc-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CDFC approval or rejection' })
  @ApiResponse({ status: 200, description: 'CDFC decision recorded successfully' })
  @ApiResponse({ status: 400, description: 'Project not in correct status for CDFC approval' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  cdfcApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: CdfcApprovalDto,
    @Request() req: any,
  ) {
    return this.projectsService.cdfcApprove(id, approvalDto, req.user.id);
  }

  @Post(':id/tac-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'TAC approval or rejection' })
  @ApiResponse({ status: 200, description: 'TAC decision recorded successfully' })
  @ApiResponse({ status: 400, description: 'Project must be CDFC approved before TAC approval' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  tacApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: TacAppraisalDto,
    @Request() req: any,
  ) {
    return this.projectsService.tacApprove(id, approvalDto, req.user.id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start project execution' })
  @ApiResponse({ status: 200, description: 'Project execution started' })
  @ApiResponse({ status: 400, description: 'Only budgeted projects can be started' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  startExecution(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.projectsService.startExecution(id, req.user.id);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Update project progress' })
  @ApiResponse({ status: 200, description: 'Project progress updated successfully' })
  @ApiResponse({ status: 400, description: 'Can only update progress for in-progress projects' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() progressDto: UpdateProgressDto,
    @Request() req: any,
  ) {
    const mapped: UpdateProgressDtoInternal = {
      progressPercentage: progressDto.progressPercentage,
      actualCost: progressDto.actualCost,
      qualityRating: progressDto.qualityRating,
      notes: progressDto.notes,
      actualBeneficiaries: undefined,
    } as any;
    return this.projectsService.updateProgress(id, mapped, req.user.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark project as completed' })
  @ApiResponse({ status: 200, description: 'Project completed successfully' })
  @ApiResponse({ status: 400, description: 'Project must be 100% complete and in progress' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteProjectDto,
    @Request() req: any,
  ) {
    const mapped: CompleteProjectDtoInternal = {
      actualEndDate: completeDto.actualEndDate,
      actualCost: completeDto.actualCost,
      actualBeneficiaries: completeDto.actualBeneficiaries,
      completionCertificateUrl: completeDto.completionCertificateUrl,
      notes: completeDto.notes,
    } as any;
    return this.projectsService.complete(id, mapped, req.user.id);
  }

  // --------- Additional API Gateway aligned endpoints ---------

  @Get(':id/workflow-status')
  @ApiOperation({ summary: 'Get project workflow status with SLA tracking' })
  async getWorkflowStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getWorkflowStatus(id);
  }

  @Get('constituency/:id/stats')
  @ApiOperation({ summary: 'Get project statistics for a constituency' })
  async getConstituencyStats(@Param('id', ParseUUIDPipe) constituencyId: string) {
    return this.projectsService.getStatistics(constituencyId);
  }

  @Post(':id/wdc-signoff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add WDC meeting sign-off (required before submission)' })
  async addWdcSignoff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() wdcSignoffDto: WdcSignoffDto,
    @Request() req: any,
  ) {
    return this.projectsService.addWdcSignoff(id, wdcSignoffDto, req.user?.id);
  }

  @Post(':id/plgo-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PLGO decision (14 working day SLA)' })
  async plgoApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: PlgoApprovalDto,
    @Request() req: any,
  ) {
    return this.projectsService.plgoApprove(id, approvalDto, req.user?.id);
  }

  @Post(':id/ministry-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ministry approval (for consolidated lists)' })
  async ministryApprove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approvalDto: MinistryApprovalDto,
    @Request() req: any,
  ) {
    return this.projectsService.ministryApprove(id, approvalDto, req.user?.id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject project at any review stage' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectDto: RejectProjectDto,
    @Request() req: any,
  ) {
    return this.projectsService.reject(id, rejectDto, req.user?.id);
  }

  @Post(':id/m-e-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record a monitoring and evaluation report with GPS verification' })
  async recordMonitoringEvaluation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() mEReportDto: CreateMonitoringEvaluationDto,
    @Request() req: any,
  ) {
    return this.projectsService.recordMonitoringEvaluation(id, mEReportDto, req.user?.id);
  }
}
