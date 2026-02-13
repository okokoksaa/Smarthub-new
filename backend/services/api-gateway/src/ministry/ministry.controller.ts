import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MinistryService } from './ministry.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Ministry')
@Controller('ministry')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MinistryController {
  constructor(private readonly ministryService: MinistryService) {}

  /**
   * Get ministry dashboard summary
   * GET /api/v1/ministry/dashboard
   */
  @Get('dashboard')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get ministry dashboard summary' })
  async getDashboardSummary(@Req() req?: any) {
    const summary = await this.ministryService.getDashboardSummary(req?.scopeContext);
    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get CAPR cycles (Constituency Annual Project Review)
   * GET /api/v1/ministry/capr
   */
  @Get('capr')
  @Roles('ministry_official', 'plgo', 'super_admin')
  @ApiOperation({ summary: 'Get CAPR cycles for all constituencies' })
  @ApiQuery({ name: 'province_id', required: false })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['on_track', 'due_soon', 'overdue', 'completed'] })
  async getCAPRCycles(
    @Query('province_id') provinceId?: string,
    @Query('fiscal_year') fiscalYear?: string,
    @Query('status') status?: string,
    @Req() req?: any,
  ) {
    const cycles = await this.ministryService.getCAPRCycles(provinceId, fiscalYear, status, req?.scopeContext);
    return {
      success: true,
      data: cycles,
      total: cycles.length,
    };
  }

  /**
   * Get CAPR cycle by constituency
   * GET /api/v1/ministry/capr/:constituencyId
   */
  @Get('capr/:constituencyId')
  @Roles('ministry_official', 'plgo', 'cdfc_chair', 'super_admin')
  @ApiOperation({ summary: 'Get CAPR cycle for a specific constituency' })
  async getCAPRCycleByConstituency(
    @Param('constituencyId', ParseUUIDPipe) constituencyId: string,
    @Query('fiscal_year') fiscalYear?: string,
    @Req() req?: any,
  ) {
    const cycles = await this.ministryService.getCAPRCycles(undefined, fiscalYear, undefined, req?.scopeContext);
    const cycle = cycles.find(c => c.constituency_id === constituencyId);

    if (!cycle) {
      return {
        success: false,
        error: 'CAPR cycle not found for this constituency',
      };
    }

    return {
      success: true,
      data: cycle,
    };
  }

  /**
   * Get ministerial inbox
   * GET /api/v1/ministry/inbox
   */
  @Get('inbox')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Get ministerial inbox items' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'deferred'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['normal', 'high', 'urgent'] })
  @ApiQuery({ name: 'type', required: false })
  async getMinisterialInbox(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Req() req?: any,
  ) {
    const items = await this.ministryService.getMinisterialInbox(status, priority, type, req?.scopeContext);
    return {
      success: true,
      data: items,
      total: items.length,
    };
  }

  /**
   * Approve ministerial item
   * POST /api/v1/ministry/inbox/:id/approve
   */
  @Post('inbox/:id/approve')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Approve a ministerial item' })
  async approveItem(
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() body: { comments?: string },
    @CurrentUser() user: { id: string },
    @Req() req?: any,
  ) {
    const result = await this.ministryService.approveItem(itemId, user.id, body.comments, req?.scopeContext);
    return result;
  }

  /**
   * Reject ministerial item
   * POST /api/v1/ministry/inbox/:id/reject
   */
  @Post('inbox/:id/reject')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Reject a ministerial item' })
  async rejectItem(
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() body: { reason: string },
    @CurrentUser() user: { id: string },
    @Req() req?: any,
  ) {
    const result = await this.ministryService.rejectItem(itemId, user.id, body.reason, req?.scopeContext);
    return result;
  }

  /**
   * Get gazette publications
   * GET /api/v1/ministry/gazette
   */
  @Get('gazette')
  @Roles('ministry_official', 'plgo', 'super_admin')
  @ApiOperation({ summary: 'Get gazette publications by province' })
  @ApiQuery({ name: 'province_id', required: false })
  @ApiQuery({ name: 'fiscal_year', required: false })
  async getGazettePublications(
    @Query('province_id') provinceId?: string,
    @Query('fiscal_year') fiscalYear?: string,
    @Req() req?: any,
  ) {
    const publications = await this.ministryService.getGazettePublications(provinceId, fiscalYear, req?.scopeContext);
    return {
      success: true,
      data: publications,
      total: publications.length,
    };
  }

  /**
   * Publish gazette for a province
   * POST /api/v1/ministry/gazette/:provinceId/publish
   */
  @Post('gazette/:provinceId/publish')
  @Roles('ministry_official', 'super_admin')
  @ApiOperation({ summary: 'Publish gazette for a province' })
  async publishGazette(
    @Param('provinceId', ParseUUIDPipe) provinceId: string,
    @Body() body: { file_url: string },
    @CurrentUser() user: { id: string },
    @Req() req?: any,
  ) {
    const result = await this.ministryService.publishGazette(provinceId, user.id, body.file_url, req?.scopeContext);
    return result;
  }
}
