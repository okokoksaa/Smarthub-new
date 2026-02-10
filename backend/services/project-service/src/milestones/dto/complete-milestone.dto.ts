import { IsDateString, IsOptional, IsNumber, IsString, Min, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Evidence Document DTO
 */
export class EvidenceDocumentDto {
  @ApiProperty({ description: 'Document URL', example: 'https://storage.example.com/doc123.pdf' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Document type', example: 'photo' })
  @IsString()
  type: string;
}

/**
 * Complete Milestone DTO
 */
export class CompleteMilestoneDto {
  @ApiProperty({
    description: 'Completion date',
    example: '2024-03-25',
  })
  @IsDateString()
  completionDate: string;

  @ApiPropertyOptional({
    description: 'Actual cost incurred',
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Evidence documents (photos, reports)',
    type: [EvidenceDocumentDto],
  })
  @IsOptional()
  @IsArray()
  evidenceDocuments?: EvidenceDocumentDto[];

  @ApiPropertyOptional({
    description: 'Completion notes',
    example: 'Foundation completed ahead of schedule',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Verify Milestone DTO
 */
export class VerifyMilestoneDto {
  @ApiProperty({
    description: 'Verification notes',
    example: 'Milestone verified, quality meets standards',
  })
  @IsString()
  verificationNotes: string;
}
