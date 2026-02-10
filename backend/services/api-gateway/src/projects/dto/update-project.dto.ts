import { IsString, IsNumber, IsEnum, IsOptional, IsUUID, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectSector } from './create-project.dto';

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name/title' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed project description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectSector, description: 'Project sector' })
  @IsEnum(ProjectSector)
  @IsOptional()
  sector?: ProjectSector;

  @ApiPropertyOptional({ description: 'Ward ID' })
  @IsUUID()
  @IsOptional()
  ward_id?: string;

  @ApiPropertyOptional({ description: 'Estimated budget in ZMW', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

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

  @ApiPropertyOptional({ description: 'Contractor ID' })
  @IsUUID()
  @IsOptional()
  contractor_id?: string;
}
