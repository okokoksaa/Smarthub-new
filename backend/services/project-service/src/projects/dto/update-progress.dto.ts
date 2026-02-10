import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsDateString,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Project Progress DTO
 */
export class UpdateProgressDto {
  @ApiProperty({
    description: 'Progress percentage (0-100)',
    example: 45.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;

  @ApiPropertyOptional({
    description: 'Progress notes',
    example: 'Foundation completed, starting walls construction',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Actual cost incurred to date',
    example: 250000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Actual beneficiaries reached',
    example: 2500,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualBeneficiaries?: number;

  @ApiPropertyOptional({
    description: 'Quality rating (0-5)',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  qualityRating?: number;
}

/**
 * Complete Project DTO
 */
export class CompleteProjectDto {
  @ApiProperty({
    description: 'Actual completion date',
    example: '2024-12-15',
  })
  @IsDateString()
  actualEndDate: string;

  @ApiPropertyOptional({
    description: 'Final actual cost',
    example: 480000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Total beneficiaries reached',
    example: 5200,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualBeneficiaries?: number;

  @ApiPropertyOptional({
    description: 'Completion certificate URL',
    example: 'https://storage.example.com/certificates/proj123.pdf',
  })
  @IsOptional()
  @IsString()
  completionCertificateUrl?: string;

  @ApiPropertyOptional({
    description: 'Completion notes',
    example: 'Project completed successfully within budget',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
