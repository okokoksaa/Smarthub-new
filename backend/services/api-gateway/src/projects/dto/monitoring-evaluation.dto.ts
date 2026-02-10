import { IsString, IsNumber, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMonitoringEvaluationDto {
  @ApiProperty({ description: 'GPS Latitude of the verified location' })
  @IsNumber()
  gps_latitude: number;

  @ApiProperty({ description: 'GPS Longitude of the verified location' })
  @IsNumber()
  gps_longitude: number;

  @ApiProperty({ description: 'Date of the GPS verification' })
  @IsDateString()
  verification_date: string;

  @ApiPropertyOptional({ description: 'Notes or comments on the verification' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'URL to an uploaded photo verifying the location' })
  @IsString()
  @IsOptional()
  photo_url?: string;
}

export class UpdateMonitoringEvaluationDto {
  @ApiPropertyOptional({ description: 'GPS Latitude of the verified location' })
  @IsNumber()
  @IsOptional()
  gps_latitude?: number;

  @ApiPropertyOptional({ description: 'GPS Longitude of the verified location' })
  @IsNumber()
  @IsOptional()
  gps_longitude?: number;

  @ApiPropertyOptional({ description: 'Date of the GPS verification' })
  @IsDateString()
  @IsOptional()
  verification_date?: string;

  @ApiPropertyOptional({ description: 'Notes or comments on the verification' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'URL to an uploaded photo verifying the location' })
  @IsString()
  @IsOptional()
  photo_url?: string;
}
