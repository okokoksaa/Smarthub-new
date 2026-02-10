import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get constituency report
   * GET /api/v1/reports/constituency/:id
   */
  @Get('constituency/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getConstituencyReport(@Param('id', ParseUUIDPipe) id: string) {
    const report = await this.reportsService.getConstituencyReport(id);

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Get financial summary report
   * GET /api/v1/reports/financial
   */
  @Get('financial')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('finance_officer', 'auditor', 'plgo', 'ministry_official', 'super_admin')
  async getFinancialReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const report = await this.reportsService.getFinancialReport(startDate, endDate);

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Get project status report
   * GET /api/v1/reports/projects
   */
  @Get('projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getProjectStatusReport(
    @Query('constituency_id') constituencyId?: string,
  ) {
    const report = await this.reportsService.getProjectStatusReport(constituencyId);

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Get payment analytics report
   * GET /api/v1/reports/payments
   */
  @Get('payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('finance_officer', 'auditor', 'plgo', 'ministry_official', 'super_admin')
  async getPaymentAnalyticsReport(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('constituency_id') constituencyId?: string,
  ) {
    const report = await this.reportsService.getPaymentAnalyticsReport(
      startDate,
      endDate,
      constituencyId,
    );

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Get compliance dashboard
   * GET /api/v1/reports/compliance
   */
  @Get('compliance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('auditor', 'plgo', 'ministry_official', 'super_admin')
  async getComplianceReport(
    @Query('constituency_id') constituencyId?: string,
  ) {
    const report = await this.reportsService.getComplianceReport(constituencyId);

    return {
      success: true,
      data: report,
    };
  }

  /**
   * Generate custom report
   * POST /api/v1/reports/generate
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async generateReport(
    @Body() dto: GenerateReportDto,
    @CurrentUser() user: { id: string },
  ) {
    const report = await this.reportsService.generateReport(dto, user.id);

    return {
      success: true,
      data: report,
    };
  }
}
