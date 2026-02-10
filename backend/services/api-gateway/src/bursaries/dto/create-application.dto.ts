import { IsString, IsNumber, IsOptional, IsUUID, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InstitutionType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  SKILLS = 'skills',
}

export class CreateApplicationDto {
  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiPropertyOptional({ description: 'Ward ID' })
  @IsOptional()
  @IsUUID()
  ward_id?: string;

  @ApiProperty({ description: 'Academic year', example: 2026 })
  @IsInt()
  @Min(2020)
  academic_year: number;

  // Student Details
  @ApiProperty({ description: 'Student full name' })
  @IsString()
  student_name: string;

  @ApiPropertyOptional({ description: 'Student NRC number' })
  @IsOptional()
  @IsString()
  student_nrc?: string;

  @ApiPropertyOptional({ description: 'Student phone number' })
  @IsOptional()
  @IsString()
  student_phone?: string;

  @ApiPropertyOptional({ description: 'Student date of birth (for age verification)' })
  @IsOptional()
  @IsDateString()
  student_date_of_birth?: string;

  // Guardian Details
  @ApiPropertyOptional({ description: 'Guardian full name' })
  @IsOptional()
  @IsString()
  guardian_name?: string;

  @ApiPropertyOptional({ description: 'Guardian phone number' })
  @IsOptional()
  @IsString()
  guardian_phone?: string;

  @ApiPropertyOptional({ description: 'Guardian NRC number' })
  @IsOptional()
  @IsString()
  guardian_nrc?: string;

  // Institution Details
  @ApiProperty({ description: 'Institution name', example: 'University of Zambia' })
  @IsString()
  institution_name: string;

  @ApiProperty({ description: 'Institution type', enum: InstitutionType })
  @IsEnum(InstitutionType)
  institution_type: InstitutionType;

  @ApiPropertyOptional({ description: 'Program of study' })
  @IsOptional()
  @IsString()
  program_of_study?: string;

  @ApiPropertyOptional({ description: 'Year of study', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  year_of_study?: number;

  // Financial Details
  @ApiProperty({ description: 'Tuition fees amount in ZMW', example: 15000 })
  @IsNumber()
  @Min(0)
  tuition_fees: number;

  @ApiPropertyOptional({ description: 'Accommodation fees in ZMW', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accommodation_fees?: number;

  @ApiPropertyOptional({ description: 'Book allowance in ZMW', example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  book_allowance?: number;

  // Residency Proof (for eligibility)
  @ApiPropertyOptional({ description: 'Date moved to constituency (for residency verification)' })
  @IsOptional()
  @IsDateString()
  residency_start_date?: string;
}
