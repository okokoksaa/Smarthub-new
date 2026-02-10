import { IsEnum, IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentAccessLevel } from '@shared/database';

export class UpdateDocumentDto {
  @ApiProperty({
    description: 'Access level for the document',
    enum: DocumentAccessLevel,
    example: DocumentAccessLevel.INTERNAL,
    required: false,
  })
  @IsEnum(DocumentAccessLevel)
  @IsOptional()
  accessLevel?: DocumentAccessLevel;

  @ApiProperty({
    description: 'Document description',
    example: 'Updated project proposal for health clinic construction',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Tags for document categorization',
    example: ['proposal', 'health', '2024', 'updated'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Additional metadata',
    example: { contractor: 'XYZ Ltd', budgetYear: '2024', status: 'revised' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
