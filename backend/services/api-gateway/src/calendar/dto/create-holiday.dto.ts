import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ description: 'Holiday name', example: 'Independence Day' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Holiday date (YYYY-MM-DD)', example: '2026-10-24' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Whether this holiday recurs every year', default: false })
  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ description: 'Holiday name' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Holiday date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Whether this holiday recurs every year' })
  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;
}

export class WorkingDaysQueryDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', example: '2026-01-31' })
  @IsDateString()
  end_date: string;
}

export class DeadlineQueryDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ description: 'Number of working days to add', example: 14 })
  working_days: number;
}

/**
 * SLA periods defined by CDF Act
 */
export enum SLAPeriod {
  WDC_ENDORSEMENT = 7,      // 7 working days for WDC to endorse
  CDFC_REVIEW = 10,         // 10 working days for CDFC review
  TAC_APPRAISAL = 14,       // 14 working days for TAC appraisal
  PLGO_APPROVAL = 14,       // 14 working days for PLGO approval
  MINISTRY_REVIEW = 30,     // 30 working days for Ministry review
}
