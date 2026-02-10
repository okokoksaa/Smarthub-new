import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsArray } from 'class-validator';

export enum ReportType {
  CONSTITUENCY_SUMMARY = 'constituency_summary',
  FINANCIAL_SUMMARY = 'financial_summary',
  PROJECT_STATUS = 'project_status',
  PAYMENT_ANALYTICS = 'payment_analytics',
  COMPLIANCE_DASHBOARD = 'compliance_dashboard',
  BUDGET_UTILIZATION = 'budget_utilization',
}

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
}

export class GenerateReportDto {
  @IsEnum(ReportType)
  report_type: ReportType;

  @IsOptional()
  @IsUUID()
  constituency_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  include_sections?: string[];
}
