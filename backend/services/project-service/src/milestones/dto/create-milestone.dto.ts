import {
  IsString,
  IsUUID,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Deliverable DTO
 */
export class DeliverableDto {
  @ApiProperty({ description: 'Deliverable description', example: 'Foundation slab' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'sq meters' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Completion status', example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

/**
 * Create Milestone DTO
 */
export class CreateMilestoneDto {
  @ApiProperty({
    description: 'Project UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'Milestone title',
    example: 'Foundation and structural work',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description',
    example: 'Complete foundation excavation, reinforcement, and concrete pouring',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Sequence number (order of milestone)',
    example: 1,
  })
  @IsInt()
  @Min(1)
  sequenceNumber: number;

  @ApiProperty({
    description: 'Percentage weight in overall project (0-100)',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageWeight: number;

  @ApiProperty({
    description: 'Due date',
    example: '2024-03-31',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Budgeted amount for this milestone',
    example: 125000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetedAmount?: number;

  @ApiPropertyOptional({
    description: 'Deliverables for this milestone',
    type: [DeliverableDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Requires soil testing before excavation',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
