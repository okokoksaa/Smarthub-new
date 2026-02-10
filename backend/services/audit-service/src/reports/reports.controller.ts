import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService, ReportQuery } from './reports.service';

export class GenerateReportDto {
  type: 'audit' | 'financial' | 'project' | 'user' | 'compliance';
  format: 'excel' | 'pdf' | 'json';
  dateFrom: string;
  dateTo: string;
  constituencyId?: string;
  wardId?: string;
  districtId?: string;
  provinceId?: string;
  userId?: string;
  projectId?: string;
  filters?: Record<string, any>;
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate comprehensive report' })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
  })
  async generateReport(
    @Body() generateDto: GenerateReportDto,
    @Res() res: Response,
  ): Promise<void> {
    // Validate date range
    const dateFrom = new Date(generateDto.dateFrom);
    const dateTo = new Date(generateDto.dateTo);

    if (dateFrom >= dateTo) {
      throw new BadRequestException('dateFrom must be before dateTo');
    }

    if (dateTo.getTime() - dateFrom.getTime() > 365 * 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Date range cannot exceed 1 year');
    }

    const query: ReportQuery = {
      ...generateDto,
      dateFrom,
      dateTo,
    };

    let reportData;

    // Generate appropriate report based on type
    switch (generateDto.type) {
      case 'audit':
        reportData = await this.reportsService.generateAuditReport(query);
        break;
      case 'financial':
        reportData = await this.reportsService.generateFinancialReport(query);
        break;
      case 'project':
        reportData = await this.reportsService.generateProjectReport(query);
        break;
      case 'compliance':
        reportData = await this.reportsService.generateComplianceReport(query);
        break;
      default:
        throw new BadRequestException(`Unsupported report type: ${generateDto.type}`);
    }

    // Return in requested format
    switch (generateDto.format) {
      case 'json':
        res.json(reportData);
        break;

      case 'excel':
        const excelBuffer = await this.reportsService.generateExcelReport(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${generateDto.type}-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelBuffer);
        break;

      case 'pdf':
        const pdfBuffer = await this.reportsService.generatePdfReport(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${generateDto.type}-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);
        break;

      default:
        throw new BadRequestException(`Unsupported format: ${generateDto.format}`);
    }
  }

  @Get('audit')
  @ApiOperation({ summary: 'Generate audit report (JSON format)' })
  @ApiResponse({
    status: 200,
    description: 'Audit report generated successfully',
  })
  async getAuditReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('userId') userId?: string,
  ): Promise<any> {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo are required');
    }

    const query: ReportQuery = {
      type: 'audit',
      format: 'json',
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      userId,
    };

    return this.reportsService.generateAuditReport(query);
  }

  @Get('financial')
  @ApiOperation({ summary: 'Generate financial report (JSON format)' })
  @ApiResponse({
    status: 200,
    description: 'Financial report generated successfully',
  })
  async getFinancialReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('constituencyId') constituencyId?: string,
  ): Promise<any> {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo are required');
    }

    const query: ReportQuery = {
      type: 'financial',
      format: 'json',
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      constituencyId,
    };

    return this.reportsService.generateFinancialReport(query);
  }

  @Get('project')
  @ApiOperation({ summary: 'Generate project report (JSON format)' })
  @ApiResponse({
    status: 200,
    description: 'Project report generated successfully',
  })
  async getProjectReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('constituencyId') constituencyId?: string,
  ): Promise<any> {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo are required');
    }

    const query: ReportQuery = {
      type: 'project',
      format: 'json',
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      constituencyId,
    };

    return this.reportsService.generateProjectReport(query);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Generate compliance report (JSON format)' })
  @ApiResponse({
    status: 200,
    description: 'Compliance report generated successfully',
  })
  async getComplianceReport(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ): Promise<any> {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException('dateFrom and dateTo are required');
    }

    const query: ReportQuery = {
      type: 'compliance',
      format: 'json',
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    };

    return this.reportsService.generateComplianceReport(query);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get available report templates' })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
  })
  async getReportTemplates(): Promise<any> {
    return {
      types: [
        {
          id: 'audit',
          name: 'Audit Activity Report',
          description: 'Comprehensive audit trail analysis with user activity and risk assessment',
          parameters: ['dateFrom', 'dateTo', 'userId'],
          charts: ['Actions by Type', 'Activities by Entity', 'Daily Activity Trend', 'Top Active Users'],
        },
        {
          id: 'financial',
          name: 'Financial Activity Report',
          description: 'Payment processing analysis with approval workflows and trends',
          parameters: ['dateFrom', 'dateTo', 'constituencyId'],
          charts: ['Payments by Status', 'Amount by Status', 'Monthly Trends', 'Category Breakdown'],
        },
        {
          id: 'project',
          name: 'Project Activity Report',
          description: 'Project lifecycle analysis with progress tracking and budget utilization',
          parameters: ['dateFrom', 'dateTo', 'constituencyId'],
          charts: ['Projects by Status', 'Projects by Type', 'Monthly Creation', 'Budget Distribution'],
        },
        {
          id: 'compliance',
          name: 'Compliance Assessment Report',
          description: 'Comprehensive compliance analysis with risk indicators and policy adherence',
          parameters: ['dateFrom', 'dateTo'],
          charts: ['Compliance Scores', 'Risk Distribution'],
        },
      ],
      formats: [
        { id: 'json', name: 'JSON Data', description: 'Raw data in JSON format for API consumption' },
        { id: 'excel', name: 'Excel Spreadsheet', description: 'Formatted spreadsheet with charts and summary' },
        { id: 'pdf', name: 'PDF Document', description: 'Professional report document suitable for printing' },
      ],
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary data' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboardData(@Query('days') days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate quick reports for dashboard
    const [auditReport, financialReport, projectReport, complianceReport] = await Promise.all([
      this.reportsService.generateAuditReport({
        type: 'audit',
        format: 'json',
        dateFrom: startDate,
        dateTo: endDate,
      }),
      this.reportsService.generateFinancialReport({
        type: 'financial',
        format: 'json',
        dateFrom: startDate,
        dateTo: endDate,
      }),
      this.reportsService.generateProjectReport({
        type: 'project',
        format: 'json',
        dateFrom: startDate,
        dateTo: endDate,
      }),
      this.reportsService.generateComplianceReport({
        type: 'compliance',
        format: 'json',
        dateFrom: startDate,
        dateTo: endDate,
      }),
    ]);

    return {
      period: `${days} days`,
      generatedAt: new Date(),
      summary: {
        audit: auditReport.summary,
        financial: financialReport.summary,
        project: projectReport.summary,
        compliance: complianceReport.summary,
      },
      charts: {
        auditActivity: auditReport.charts?.find(c => c.title === 'Daily Activity Trend')?.data,
        financialTrends: financialReport.charts?.find(c => c.title === 'Monthly Payment Trends')?.data,
        projectCreation: projectReport.charts?.find(c => c.title === 'Monthly Project Creation')?.data,
        complianceScores: complianceReport.charts?.find(c => c.title === 'Compliance Scores by Area')?.data,
      },
    };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule automated report generation' })
  @ApiResponse({
    status: 201,
    description: 'Report scheduled successfully',
  })
  async scheduleReport(@Body() scheduleDto: {
    reportType: string;
    format: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    filters?: Record<string, any>;
  }): Promise<any> {
    // This would integrate with a job scheduler like Bull/Agenda
    // For now, return a placeholder response
    return {
      message: 'Report scheduling functionality not yet implemented',
      scheduledReport: {
        id: 'scheduled-' + Date.now(),
        type: scheduleDto.reportType,
        format: scheduleDto.format,
        schedule: scheduleDto.schedule,
        recipients: scheduleDto.recipients,
        createdAt: new Date(),
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
      },
    };
  }
}