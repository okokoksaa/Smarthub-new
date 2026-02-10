import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IssueCategory {
  QUALITY = 'quality',
  SAFETY = 'safety',
  DELAY = 'delay',
  COST_OVERRUN = 'cost_overrun',
  MATERIALS = 'materials',
  WORKMANSHIP = 'workmanship',
  DESIGN = 'design',
  ENVIRONMENTAL = 'environmental',
  OTHER = 'other',
}

export class CreateIssueDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  project_id: string;

  @ApiPropertyOptional({ description: 'Site visit ID that identified this issue' })
  @IsUUID()
  @IsOptional()
  site_visit_id?: string;

  @ApiProperty({ description: 'Issue category', enum: IssueCategory })
  @IsEnum(IssueCategory)
  category: IssueCategory;

  @ApiProperty({ description: 'Issue severity', enum: IssueSeverity })
  @IsEnum(IssueSeverity)
  severity: IssueSeverity;

  @ApiProperty({ description: 'Issue title/summary' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Recommended corrective action' })
  @IsString()
  @IsOptional()
  corrective_action?: string;

  @ApiPropertyOptional({ description: 'Photo evidence document IDs' })
  @IsUUID('4', { each: true })
  @IsOptional()
  photo_ids?: string[];
}
