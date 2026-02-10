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
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { UpdateProjectGeofenceDto } from './dto/update-project-geofence.dto';
import { CreateIssueDto } from './dto/create-issue.dto';

@ApiTags('Monitoring & Evaluation')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  // ========== Site Visits ==========

  @Post('site-visits')
  @ApiOperation({ summary: 'Create a new site visit with GPS verification' })
  @ApiResponse({ status: 201, description: 'Site visit created successfully' })
  @ApiResponse({ status: 400, description: 'GPS outside geofence or invalid data' })
  @Roles('plgo', 'cdfc_chair', 'tac_chair', 'tac_member', 'finance_officer', 'super_admin')
  async createSiteVisit(@Body() dto: CreateSiteVisitDto, @CurrentUser() user: any) {
    return this.monitoringService.createSiteVisit(dto, user);
  }

  @Get('projects/:projectId/site-visits')
  @ApiOperation({ summary: 'Get site visits for a project' })
  @ApiResponse({ status: 200, description: 'Site visits retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSiteVisits(
    @Param('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.monitoringService.getSiteVisits(projectId, { page, limit });
  }

  @Get('site-visits/:id')
  @ApiOperation({ summary: 'Get site visit details' })
  @ApiResponse({ status: 200, description: 'Site visit retrieved' })
  @ApiResponse({ status: 404, description: 'Site visit not found' })
  async getSiteVisit(@Param('id') id: string) {
    return this.monitoringService.getSiteVisit(id);
  }

  // ========== Geofence ==========

  @Patch('projects/:projectId/geofence')
  @ApiOperation({ summary: 'Set or update project geofence location' })
  @ApiResponse({ status: 200, description: 'Geofence updated successfully' })
  @Roles('plgo', 'cdfc_chair', 'tac_chair', 'super_admin')
  async updateGeofence(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectGeofenceDto,
    @CurrentUser() user: any,
  ) {
    return this.monitoringService.updateProjectGeofence(projectId, dto, user);
  }

  @Get('projects/:projectId/geofence')
  @ApiOperation({ summary: 'Get project geofence settings' })
  @ApiResponse({ status: 200, description: 'Geofence settings retrieved' })
  async getGeofence(@Param('projectId') projectId: string) {
    return this.monitoringService.getProjectGeofence(projectId);
  }

  // ========== Issues ==========

  @Post('issues')
  @ApiOperation({ summary: 'Create a new project issue/defect' })
  @ApiResponse({ status: 201, description: 'Issue created successfully' })
  @Roles('plgo', 'cdfc_chair', 'tac_chair', 'tac_member', 'finance_officer', 'super_admin')
  async createIssue(@Body() dto: CreateIssueDto, @CurrentUser() user: any) {
    return this.monitoringService.createIssue(dto, user);
  }

  @Get('projects/:projectId/issues')
  @ApiOperation({ summary: 'Get issues for a project' })
  @ApiResponse({ status: 200, description: 'Issues retrieved successfully' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getIssues(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.monitoringService.getIssues(projectId, { status, severity, page, limit });
  }

  @Patch('issues/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an issue' })
  @ApiResponse({ status: 200, description: 'Issue resolved successfully' })
  @Roles('plgo', 'cdfc_chair', 'tac_chair', 'super_admin')
  async resolveIssue(
    @Param('id') id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() user: any,
  ) {
    return this.monitoringService.resolveIssue(id, resolution, user);
  }

  // ========== KPIs & Analytics ==========

  @Get('projects/:projectId/kpis')
  @ApiOperation({ summary: 'Get project KPIs (physical, financial, quality, schedule)' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getProjectKPIs(@Param('projectId') projectId: string) {
    return this.monitoringService.getProjectKPIs(projectId);
  }

  @Get('constituencies/:constituencyId/stats')
  @ApiOperation({ summary: 'Get M&E statistics for constituency' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getConstituencyStats(@Param('constituencyId') constituencyId: string) {
    return this.monitoringService.getConstituencyMEStats(constituencyId);
  }
}
