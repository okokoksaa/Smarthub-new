import { IsEnum, IsOptional, IsString, IsUUID, IsObject, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType, DocumentAccessLevel } from '@shared/database';

export class CreateDocumentDto {
  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.PROJECT_PROPOSAL,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

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
    example: 'Project proposal for health clinic construction',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Project ID this document belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'Constituency ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  constituencyId?: string;

  @ApiProperty({
    description: 'Ward ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  wardId?: string;

  @ApiProperty({
    description: 'District ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  districtId?: string;

  @ApiProperty({
    description: 'Province ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({
    description: 'Tags for document categorization',
    example: ['proposal', 'health', '2024'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Additional metadata',
    example: { contractor: 'ABC Ltd', budgetYear: '2024' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
