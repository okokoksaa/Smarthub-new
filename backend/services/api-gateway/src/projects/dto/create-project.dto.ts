import { IsString, IsUUID, IsNumber, IsEnum, IsOptional, IsArray, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectSector {
  EDUCATION = 'education',
  HEALTH = 'health',
  WATER = 'water',
  ROADS = 'roads',
  AGRICULTURE = 'agriculture',
  COMMUNITY = 'community',
  ENERGY = 'energy',
  GOVERNANCE = 'governance',
  OTHER = 'other',
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name/title' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Detailed project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ProjectSector, description: 'Project sector' })
  @IsEnum(ProjectSector)
  sector: ProjectSector;

  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiPropertyOptional({ description: 'Ward ID' })
  @IsUUID()
  @IsOptional()
  ward_id?: string;

  @ApiProperty({ description: 'Estimated budget in ZMW', minimum: 0 })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiPropertyOptional({ description: 'Expected number of beneficiaries' })
  @IsNumber()
  @IsOptional()
  beneficiaries?: number;

  @ApiPropertyOptional({ description: 'Location description' })
  @IsString()
  @IsOptional()
  location_description?: string;

  @ApiPropertyOptional({ description: 'GPS latitude' })
  @IsNumber()
  @IsOptional()
  gps_latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude' })
  @IsNumber()
  @IsOptional()
  gps_longitude?: number;

  @ApiPropertyOptional({ description: 'Expected start date' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Expected end date' })
  @IsDateString()
  @IsOptional()
  expected_end_date?: string;

  @ApiPropertyOptional({ description: 'Contractor ID if known' })
  @IsUUID()
  @IsOptional()
  contractor_id?: string;
}
