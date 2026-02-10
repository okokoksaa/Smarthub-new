import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitProjectDto {
  @ApiPropertyOptional({ description: 'Additional submission notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WdcSignoffDto {
  @ApiProperty({ description: 'WDC chair signed' })
  @IsBoolean()
  chair_signed: boolean;

  @ApiPropertyOptional({ description: 'Meeting minutes URL' })
  @IsOptional()
  @IsString()
  meeting_minutes_url?: string;
}

export class CdfcApprovalDto {
  @ApiProperty({ description: 'Approved or rejected' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Decision notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TacAppraisalDto extends CdfcApprovalDto {}

export class PlgoApprovalDto extends CdfcApprovalDto {}

export class MinistryApprovalDto extends CdfcApprovalDto {}

export class UpdateProgressDto {
  @ApiProperty({ description: 'Progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiPropertyOptional({ description: 'Actual cost in ZMW' })
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional({ description: 'Quality rating 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteProjectDto {
  @ApiProperty({ description: 'Actual end date' })
  @IsDateString()
  actualEndDate: string;

  @ApiPropertyOptional({ description: 'Actual cost' })
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional({ description: 'Actual beneficiaries' })
  @IsOptional()
  @IsNumber()
  actualBeneficiaries?: number;

  @ApiPropertyOptional({ description: 'Completion certificate URL' })
  @IsOptional()
  @IsString()
  completionCertificateUrl?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectProjectDto {
  @ApiProperty({ description: 'Rejection reason' })
  @IsString()
  reason: string;
}

