import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApprovalDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export class ApproveEmpowermentDto {
  @ApiProperty({ description: 'Approval decision', enum: ApprovalDecision })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({ description: 'Approved amount (required if approving)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  approved_amount?: number;

  @ApiPropertyOptional({ description: 'Comments/notes for the decision' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Rejection reason (required if rejecting)' })
  @IsString()
  @IsOptional()
  rejection_reason?: string;

  @ApiPropertyOptional({ description: 'Training requirement for disbursement' })
  @IsString()
  @IsOptional()
  training_requirement?: string;
}
