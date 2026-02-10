import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PublicService } from './public.service';

// DTO for feedback submission
class SubmitFeedbackDto {
  feedback_type: string; // 'complaint', 'suggestion', 'inquiry', 'compliment'
  category: string; // 'project', 'payment', 'service', 'corruption', 'other'
  subject: string;
  description: string;
  constituency_id?: string;
  ward_id?: string;
  project_id?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  is_anonymous?: boolean;
}

@ApiTags('Public Portal')
@Controller('public')
// NOTE: No AuthGuard - these endpoints are publicly accessible
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // ========== Projects ==========

  @Get('projects')
  @ApiOperation({ summary: 'List sanitized public projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async getProjects(
    @Query('constituency_id') constituencyId?: string,
    @Query('sector') sector?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.publicService.getProjects({
      constituencyId,
      sector,
      status,
      page,
      limit,
    });
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get sanitized public project details' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id') id: string) {
    return this.publicService.getProject(id);
  }

  // ========== Constituencies ==========

  @Get('constituencies')
  @ApiOperation({ summary: 'List constituencies with public stats' })
  @ApiResponse({ status: 200, description: 'Constituencies retrieved successfully' })
  async getConstituencies(
    @Query('province_id') provinceId?: string,
  ) {
    return this.publicService.getConstituencies(provinceId);
  }

  @Get('constituencies/:id/stats')
  @ApiOperation({ summary: 'Get constituency budget utilization stats' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getConstituencyStats(@Param('id') id: string) {
    return this.publicService.getConstituencyStats(id);
  }

  // ========== National Statistics ==========

  @Get('stats/national')
  @ApiOperation({ summary: 'Get national CDF statistics' })
  @ApiResponse({ status: 200, description: 'National stats retrieved successfully' })
  async getNationalStats() {
    return this.publicService.getNationalStats();
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get summary stats for dashboard' })
  @ApiResponse({ status: 200, description: 'Summary stats retrieved successfully' })
  async getSummaryStats() {
    return this.publicService.getSummaryStats();
  }

  // ========== Feedback ==========

  @Post('feedback')
  @ApiOperation({ summary: 'Submit public feedback or complaint' })
  @ApiResponse({ status: 201, description: 'Feedback submitted successfully' })
  async submitFeedback(@Body() feedbackDto: SubmitFeedbackDto) {
    return this.publicService.submitFeedback(feedbackDto);
  }

  // ========== Reports ==========

  @Get('reports')
  @ApiOperation({ summary: 'List published public reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  async getPublishedReports(
    @Query('constituency_id') constituencyId?: string,
    @Query('report_type') reportType?: string,
  ) {
    return this.publicService.getPublishedReports(constituencyId, reportType);
  }

  // ========== Document Verification ==========

  @Get('verify/:documentId')
  @ApiOperation({ summary: 'Verify document authenticity via QR code' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verifyDocument(@Param('documentId') documentId: string) {
    return this.publicService.verifyDocument(documentId);
  }
}
