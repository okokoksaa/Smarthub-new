import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsNumber,
  IsPositive,
  Length,
  ArrayMinSize,
  ValidateIf,
  IsObject,
} from 'class-validator';
import { PollType, PollStatus } from '../entities/poll.entity';

/**
 * Create Poll DTO
 */
export class CreatePollDto {
  @ApiProperty({
    description: 'Poll title',
    example: 'Priority Areas for Ward Development 2024',
  })
  @IsString()
  @Length(5, 255)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the poll',
    example: 'We need your input on which areas should be prioritized for development in our ward this year. Your responses will help guide our planning process.',
  })
  @IsString()
  @Length(20, 2000)
  description: string;

  @ApiProperty({
    description: 'Type of poll',
    enum: PollType,
    example: PollType.MULTIPLE_CHOICE,
  })
  @IsEnum(PollType)
  type: PollType;

  @ApiProperty({
    description: 'Ward ID for this poll',
    example: 'ward-123',
  })
  @IsString()
  wardId: string;

  @ApiPropertyOptional({
    description: 'Poll options (required for MULTIPLE_CHOICE and RANKING)',
    example: ['Road Infrastructure', 'Water Supply', 'Health Facilities', 'Education', 'Market Development'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ValidateIf((obj) => obj.type === PollType.MULTIPLE_CHOICE || obj.type === PollType.RANKING)
  options?: string[];

  @ApiPropertyOptional({
    description: 'Whether users can select multiple options',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleResponses?: boolean;

  @ApiPropertyOptional({
    description: 'Whether authentication is required to vote',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requireAuthentication?: boolean;

  @ApiPropertyOptional({
    description: 'Whether responses should be anonymous',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  anonymousResponses?: boolean;

  @ApiProperty({
    description: 'Poll start date and time',
    example: '2024-02-01T09:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Poll end date and time',
    example: '2024-02-15T17:00:00.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Maximum responses per user',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxResponsesPerUser?: number;

  @ApiPropertyOptional({
    description: 'Whether poll results should be visible to participants',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  resultsVisible?: boolean;
}

/**
 * Update Poll DTO
 */
export class UpdatePollDto {
  @ApiPropertyOptional({
    description: 'Updated poll title',
  })
  @IsOptional()
  @IsString()
  @Length(5, 255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated poll description',
  })
  @IsOptional()
  @IsString()
  @Length(20, 2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated poll options',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  options?: string[];

  @ApiPropertyOptional({
    description: 'Updated start date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Updated end date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether results should be visible',
  })
  @IsOptional()
  @IsBoolean()
  resultsVisible?: boolean;
}

/**
 * Submit Poll Response DTO
 */
export class SubmitResponseDto {
  @ApiProperty({
    description: 'Poll response data - structure varies by poll type',
    example: { selectedOptions: ['Road Infrastructure', 'Water Supply'] },
  })
  @IsObject()
  response: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional comments from the voter',
    example: 'These areas are most critical for our community development.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comments?: string;

  @ApiPropertyOptional({
    description: 'Session ID for anonymous responses',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

/**
 * Publish Poll DTO
 */
export class PublishPollDto {
  @ApiProperty({
    description: 'Whether to publish the poll',
    example: true,
  })
  @IsBoolean()
  publish: boolean;

  @ApiPropertyOptional({
    description: 'Publication notes or comments',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

/**
 * Close Poll DTO
 */
export class ClosePollDto {
  @ApiPropertyOptional({
    description: 'Reason for closing the poll',
    example: 'Sufficient responses received. Moving to implementation phase.',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Whether to make results visible upon closing',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  makeResultsVisible?: boolean;
}