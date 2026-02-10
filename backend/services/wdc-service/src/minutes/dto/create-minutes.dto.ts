import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsArray,
  IsDateString,
  IsOptional,
  IsNumber,
  IsPositive,
  Length,
  IsEnum,
} from 'class-validator';

/**
 * Upload Minutes DTO
 */
export class UploadMinutesDto {
  @ApiProperty({
    description: 'Meeting ID these minutes belong to',
    format: 'uuid',
  })
  @IsUUID()
  meetingId: string;

  @ApiProperty({
    description: 'Name of the document file',
    example: 'WDC_Meeting_Minutes_Jan_2024.pdf',
  })
  @IsString()
  @Length(1, 255)
  documentName: string;

  @ApiProperty({
    description: 'Document type',
    enum: ['PDF', 'DOC', 'DOCX'],
    example: 'PDF',
  })
  @IsEnum(['PDF', 'DOC', 'DOCX'])
  documentType: string;

  @ApiProperty({
    description: 'URL/path to the uploaded document',
    example: '/uploads/minutes/2024/01/meeting_minutes_123.pdf',
  })
  @IsString()
  documentUrl: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsNumber()
  @IsPositive()
  documentSizeBytes: number;

  @ApiProperty({
    description: 'Date when minutes were recorded',
    example: '2024-01-15',
  })
  @IsDateString()
  recordedDate: string;

  @ApiProperty({
    description: 'List of attendees present at the meeting',
    example: ['John Banda - Chairperson', 'Mary Phiri - Secretary', 'Peter Mwansa - Member'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  attendeesPresent: string[];

  @ApiProperty({
    description: 'Summary of decisions made during the meeting',
    example: 'Approved 3 project applications, rejected 1 application due to incomplete documentation, scheduled site visits for approved projects.',
  })
  @IsString()
  @Length(10, 2000)
  decisionsMade: string;

  @ApiPropertyOptional({
    description: 'Actions assigned to specific members',
    example: 'Secretary to prepare official letters for approved applicants. Chairperson to coordinate site visits.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  actionsAssigned?: string;
}

/**
 * Approve Minutes DTO
 */
export class ApproveMinutesDto {
  @ApiProperty({
    description: 'Whether to approve the minutes',
    example: true,
  })
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Digital signature data or approval reference',
    example: 'DIGITAL_SIGNATURE_HASH_12345',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  signatureData?: string;

  @ApiPropertyOptional({
    description: 'Approval or rejection comments',
    example: 'Minutes accurately reflect meeting proceedings and decisions.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  comments?: string;
}

/**
 * Verify Minutes DTO
 */
export class VerifyMinutesDto {
  @ApiProperty({
    description: 'Whether the minutes are verified',
    example: true,
  })
  verified: boolean;

  @ApiPropertyOptional({
    description: 'Verification comments',
    example: 'Minutes have been reviewed and are compliant with meeting requirements.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  verificationComments?: string;
}

/**
 * Update Minutes DTO
 */
export class UpdateMinutesDto {
  @ApiPropertyOptional({
    description: 'Updated document name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  documentName?: string;

  @ApiPropertyOptional({
    description: 'Updated recorded date',
  })
  @IsOptional()
  @IsDateString()
  recordedDate?: string;

  @ApiPropertyOptional({
    description: 'Updated list of attendees present',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeesPresent?: string[];

  @ApiPropertyOptional({
    description: 'Updated decisions made',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  decisionsMade?: string;

  @ApiPropertyOptional({
    description: 'Updated actions assigned',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  actionsAssigned?: string;
}