import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProjectGeofenceDto {
  @ApiProperty({ description: 'Project center latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Project center longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Geofence radius in meters (default 500m)' })
  @IsNumber()
  @Min(50)
  @Max(5000)
  radius_meters: number;
}
