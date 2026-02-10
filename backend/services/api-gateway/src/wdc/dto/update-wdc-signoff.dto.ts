import { IsOptional, IsBoolean, IsString, IsNumber, IsDateString, IsUUID } from 'class-validator';

// Define explicit optional fields to avoid dependency on '@nestjs/mapped-types'
export class UpdateWdcSignoffDto {
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @IsOptional()
  @IsUUID()
  ward_id?: string;

  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @IsOptional()
  @IsDateString()
  meeting_date?: string;

  @IsOptional()
  @IsString()
  meeting_minutes_url?: string | null;

  @IsOptional()
  @IsString()
  chair_name?: string;

  @IsOptional()
  @IsString()
  chair_nrc?: string | null;

  @IsOptional()
  @IsBoolean()
  chair_signed?: boolean;

  @IsOptional()
  @IsString()
  chair_signature?: string | null;

  @IsOptional()
  @IsNumber()
  attendees_count?: number;

  @IsOptional()
  @IsBoolean()
  quorum_met?: boolean;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  residency_verified?: boolean;

  @IsOptional()
  @IsString()
  residency_verified_by?: string | null;

  @IsOptional()
  @IsString()
  residency_verification_method?: string | null;

  @IsOptional()
  @IsNumber()
  residents_count?: number | null;

  @IsOptional()
  @IsNumber()
  non_residents_count?: number | null;

  @IsOptional()
  @IsBoolean()
  residency_threshold_met?: boolean;

  @IsOptional()
  @IsString()
  residency_notes?: string | null;
}
