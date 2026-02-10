import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VisitType {
  SCHEDULED = 'scheduled',
  UNSCHEDULED = 'unscheduled',
  FOLLOW_UP = 'follow_up',
  FINAL_INSPECTION = 'final_inspection',
}

export enum VisitOutcome {
  SATISFACTORY = 'satisfactory',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  UNSATISFACTORY = 'unsatisfactory',
  WORK_STOPPED = 'work_stopped',
  PROJECT_COMPLETE = 'project_complete',
}

export class CreateSiteVisitDto {
  @ApiProperty({ description: 'Project ID being visited' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ description: 'Type of visit', enum: VisitType })
  @IsEnum(VisitType)
  visit_type: VisitType;

  @ApiProperty({ description: 'GPS Latitude of visit location' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'GPS Longitude of visit location' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters' })
  @IsNumber()
  @IsOptional()
  gps_accuracy?: number;

  @ApiProperty({ description: 'Physical progress percentage (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  physical_progress: number;

  @ApiProperty({ description: 'Visit outcome', enum: VisitOutcome })
  @IsEnum(VisitOutcome)
  outcome: VisitOutcome;

  @ApiProperty({ description: 'Detailed observations from the visit' })
  @IsString()
  observations: string;

  @ApiPropertyOptional({ description: 'Issues or defects found' })
  @IsString()
  @IsOptional()
  issues_found?: string;

  @ApiPropertyOptional({ description: 'Recommendations for improvement' })
  @IsString()
  @IsOptional()
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Photo document IDs with EXIF data' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  photo_ids?: string[];

  @ApiPropertyOptional({ description: 'Workers present at site' })
  @IsNumber()
  @IsOptional()
  workers_present?: number;

  @ApiPropertyOptional({ description: 'Materials observed on site' })
  @IsString()
  @IsOptional()
  materials_on_site?: string;

  @ApiPropertyOptional({ description: 'Equipment observed on site' })
  @IsString()
  @IsOptional()
  equipment_on_site?: string;

  @ApiPropertyOptional({ description: 'Safety compliance notes' })
  @IsString()
  @IsOptional()
  safety_compliance?: string;
}
