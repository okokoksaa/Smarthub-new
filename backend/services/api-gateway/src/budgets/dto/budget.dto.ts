import { IsString, IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiProperty({ description: 'Fiscal year (e.g., 2026)' })
  @IsNumber()
  fiscal_year: number;

  @ApiProperty({ description: 'Total allocation in ZMW' })
  @IsNumber()
  @Min(0)
  total_allocation: number;

  @ApiProperty({ description: 'Projects allocation' })
  @IsNumber()
  @Min(0)
  projects_allocation: number;

  @ApiProperty({ description: 'Empowerment allocation' })
  @IsNumber()
  @Min(0)
  empowerment_allocation: number;

  @ApiProperty({ description: 'Bursaries allocation' })
  @IsNumber()
  @Min(0)
  bursaries_allocation: number;

  @ApiProperty({ description: 'Admin allocation' })
  @IsNumber()
  @Min(0)
  admin_allocation: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional({ description: 'Total allocation in ZMW' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_allocation?: number;

  @ApiPropertyOptional({ description: 'Projects allocation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  projects_allocation?: number;

  @ApiPropertyOptional({ description: 'Empowerment allocation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  empowerment_allocation?: number;

  @ApiPropertyOptional({ description: 'Bursaries allocation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bursaries_allocation?: number;

  @ApiPropertyOptional({ description: 'Admin allocation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  admin_allocation?: number;
}

export class ApproveBudgetDto {
  @ApiPropertyOptional({ description: 'Approval comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class CreateExpenditureReturnDto {
  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiProperty({ description: 'Fiscal year' })
  @IsNumber()
  fiscal_year: number;

  @ApiProperty({ description: 'Quarter (1-4)' })
  @IsNumber()
  quarter: number;

  @ApiProperty({ description: 'Period start date' })
  @IsString()
  period_start: string;

  @ApiProperty({ description: 'Period end date' })
  @IsString()
  period_end: string;

  @ApiProperty({ description: 'Total received in ZMW' })
  @IsNumber()
  @Min(0)
  total_received: number;

  @ApiProperty({ description: 'Total spent in ZMW' })
  @IsNumber()
  @Min(0)
  total_spent: number;

  @ApiProperty({ description: 'Amount spent on projects' })
  @IsNumber()
  @Min(0)
  projects_spent: number;

  @ApiProperty({ description: 'Amount spent on empowerment' })
  @IsNumber()
  @Min(0)
  empowerment_spent: number;

  @ApiProperty({ description: 'Amount spent on bursaries' })
  @IsNumber()
  @Min(0)
  bursaries_spent: number;

  @ApiProperty({ description: 'Amount spent on admin' })
  @IsNumber()
  @Min(0)
  admin_spent: number;
}

export class ReviewReturnDto {
  @ApiProperty({ description: 'Approve or reject the return' })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  review_notes?: string;
}
