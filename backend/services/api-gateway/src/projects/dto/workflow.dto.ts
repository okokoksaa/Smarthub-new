import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsUUID, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ApprovalDecision {
  APPROVE = 'approve',
  APPROVE_WITH_CONDITIONS = 'approve_with_conditions',
  REJECT = 'reject',
  RETURN = 'return',
  REVISE = 'revise',
}

export class SubmitProjectDto {
  @ApiPropertyOptional({ description: 'Additional notes on submission' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class WdcSignoffDto {
  @ApiProperty({ description: 'Meeting date for WDC sign-off' })
  @IsString()
  meeting_date: string;

  @ApiPropertyOptional({ description: 'Meeting ID if linked to existing meeting' })
  @IsUUID()
  @IsOptional()
  meeting_id?: string;

  @ApiProperty({ description: 'WDC Chair name' })
  @IsString()
  chair_name: string;

  @ApiPropertyOptional({ description: 'WDC Chair NRC' })
  @IsString()
  @IsOptional()
  chair_nrc?: string;

  @ApiProperty({ description: 'Number of attendees at the meeting' })
  @IsNumber()
  @Min(0)
  attendees_count: number;

  @ApiProperty({ description: 'Was quorum met?' })
  @IsBoolean()
  quorum_met: boolean;

  @ApiProperty({ description: 'Residency verification completed' })
  @IsBoolean()
  residency_verified: boolean;

  @ApiPropertyOptional({ description: 'Number of verified residents' })
  @IsNumber()
  @IsOptional()
  residents_count?: number;

  @ApiPropertyOptional({ description: 'Notes on the sign-off' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'URL to uploaded meeting minutes' })
  @IsString()
  @IsOptional()
  meeting_minutes_url?: string;
}

export class CdfcApprovalDto {
  @ApiProperty({ enum: ApprovalDecision, description: 'CDFC decision' })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Comments on the decision' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Conditions if approved with conditions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conditions?: string[];

  @ApiProperty({ description: 'Quorum count at meeting' })
  @IsNumber()
  @Min(6)
  quorum_count: number;

  @ApiPropertyOptional({ description: 'Priority ranking (1-100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  priority_rank?: number;
}

export class TacAppraisalDto {
  @ApiProperty({ enum: ApprovalDecision, description: 'TAC decision' })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Technical comments' })
  @IsString()
  @IsOptional()
  technical_comments?: string;

  @ApiPropertyOptional({ description: 'Viability assessment notes' })
  @IsString()
  @IsOptional()
  viability_notes?: string;

  @ApiPropertyOptional({ description: 'ZPPA compliance checklist items' })
  @IsArray()
  @IsOptional()
  zppa_checklist?: Record<string, boolean>[];

  @ApiPropertyOptional({ description: 'Required revisions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  required_revisions?: string[];

  @ApiProperty({ description: 'Second reviewer has appraised (two-reviewer rule)' })
  @IsBoolean()
  second_review_completed: boolean;

  @ApiPropertyOptional({ description: 'Second reviewer ID' })
  @IsUUID()
  @IsOptional()
  second_reviewer_id?: string;
}

export class PlgoApprovalDto {
  @ApiProperty({ enum: ApprovalDecision, description: 'PLGO decision' })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Comments on the decision' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Conditions if approved with conditions' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conditions?: string[];

  @ApiPropertyOptional({ description: 'Publication URL' })
  @IsString()
  @IsOptional()
  publication_url?: string;
}

export class MinistryApprovalDto {
  @ApiProperty({ enum: ApprovalDecision, description: 'Ministry decision' })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Comments on the decision' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Gazette reference' })
  @IsString()
  @IsOptional()
  gazette_reference?: string;
}

export class UpdateProgressDto {
  @ApiProperty({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiPropertyOptional({ description: 'Progress notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Milestone name completed' })
  @IsString()
  @IsOptional()
  milestone_completed?: string;
}

export class CompleteProjectDto {
  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Actual end date' })
  @IsString()
  @IsOptional()
  actual_end_date?: string;

  @ApiProperty({ description: 'Practical completion certificate uploaded' })
  @IsBoolean()
  completion_certificate_uploaded: boolean;
}

export class RejectProjectDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
