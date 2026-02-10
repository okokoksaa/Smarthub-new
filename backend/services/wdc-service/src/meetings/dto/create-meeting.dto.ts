import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  Length,
  Min,
  Max,
} from 'class-validator';
import { MeetingType } from '../entities/meeting.entity';

/**
 * Create WDC Meeting DTO
 */
export class CreateMeetingDto {
  @ApiProperty({
    description: 'Type of meeting',
    enum: MeetingType,
    example: MeetingType.REGULAR,
  })
  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @ApiProperty({
    description: 'Meeting date and time',
    example: '2024-02-15T10:00:00Z',
  })
  @IsDateString()
  meetingDate: string;

  @ApiProperty({
    description: 'Meeting location',
    example: 'Ward Community Hall',
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200)
  location: string;

  @ApiProperty({
    description: 'Meeting agenda',
    example: 'Review pending applications, discuss community projects, plan next quarter activities',
  })
  @IsString()
  @Length(20, 2000)
  agenda: string;

  @ApiProperty({
    description: 'Number of expected attendees',
    example: 15,
    minimum: 2,
  })
  @IsNumber()
  @IsPositive()
  @Min(2)
  @Max(100)
  expectedAttendees: number;

  @ApiProperty({
    description: 'Ward ID where the meeting will be held',
    format: 'uuid',
  })
  @IsUUID()
  wardId: string;

  @ApiPropertyOptional({
    description: 'Next meeting date (if known)',
    example: '2024-03-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;
}

/**
 * Update Meeting DTO
 */
export class UpdateMeetingDto {
  @ApiPropertyOptional({
    description: 'Meeting date and time',
  })
  @IsOptional()
  @IsDateString()
  meetingDate?: string;

  @ApiPropertyOptional({
    description: 'Meeting location',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(5, 200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Meeting agenda',
  })
  @IsOptional()
  @IsString()
  @Length(20, 2000)
  agenda?: string;

  @ApiPropertyOptional({
    description: 'Number of expected attendees',
    minimum: 2,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(2)
  @Max(100)
  expectedAttendees?: number;

  @ApiPropertyOptional({
    description: 'Next meeting date',
  })
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;
}

/**
 * Record Attendance DTO
 */
export class RecordAttendanceDto {
  @ApiProperty({
    description: 'List of attendees present',
    example: ['John Banda - Chairperson', 'Mary Phiri - Secretary', 'Peter Mwansa - Member'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  attendeesPresent: string[];

  @ApiPropertyOptional({
    description: 'Additional notes about attendance',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

/**
 * Complete Meeting DTO
 */
export class CompleteMeetingDto {
  @ApiProperty({
    description: 'List of attendees who were present',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  attendeesPresent: string[];

  @ApiProperty({
    description: 'Decisions made during the meeting',
    example: 'Approved 3 applications, rejected 1 application, scheduled site visits',
  })
  @IsString()
  @Length(10, 2000)
  decisionsMade: string;

  @ApiPropertyOptional({
    description: 'Actions assigned to members',
    example: 'Secretary to prepare minutes, Chairperson to visit project sites',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  actionsAssigned?: string;

  @ApiPropertyOptional({
    description: 'Next meeting date',
  })
  @IsOptional()
  @IsDateString()
  nextMeetingDate?: string;
}