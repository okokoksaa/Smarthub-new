import {
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  MaxLength,
  IsInt,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BudgetCategory } from '@shared/database';

/**
 * Create Budget Allocation DTO
 */
export class CreateBudgetDto {
  @ApiProperty({
    description: 'Fiscal year',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  fiscalYear: number;

  @ApiProperty({
    description: 'Budget category',
    enum: BudgetCategory,
    example: BudgetCategory.CAPITAL_PROJECTS,
  })
  @IsEnum(BudgetCategory)
  budgetCategory: BudgetCategory;

  @ApiProperty({
    description: 'Constituency UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  constituencyId: string;

  @ApiPropertyOptional({
    description: 'Project UUID (optional - for project-specific allocations)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({
    description: 'Allocated amount in ZMW',
    example: 1000000,
  })
  @IsNumber()
  @Min(1)
  allocatedAmount: number;

  @ApiProperty({
    description: 'Effective date',
    example: '2024-01-01',
  })
  @IsDateString()
  effectiveDate: string;

  @ApiProperty({
    description: 'Expiry date',
    example: '2024-12-31',
  })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({
    description: 'Budget description',
    example: 'FY2024 allocation for infrastructure projects',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
