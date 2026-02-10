import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Approve Project DTO
 */
export class ApproveProjectDto {
  @ApiProperty({
    description: 'Approval decision',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Approval notes or rejection reason',
    example: 'Project aligns with constituency development priorities',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * CDFC Approval DTO
 */
export class CdfcApprovalDto extends ApproveProjectDto {}

/**
 * TAC Approval DTO
 */
export class TacApprovalDto extends ApproveProjectDto {}
