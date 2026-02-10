import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApprovalDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
  SHORTLIST = 'shortlist',
}

export class ApproveApplicationDto {
  @ApiProperty({ description: 'Decision', enum: ApprovalDecision })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Approved amount (if different from requested)', example: 18000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approved_amount?: number;

  @ApiPropertyOptional({ description: 'Comments or reason for decision' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'Rejection reason (required if rejected)' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
