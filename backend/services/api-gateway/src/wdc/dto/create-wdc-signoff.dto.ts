import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';

export class CreateWdcSignoffDto {
  @IsUUID()
  project_id!: string;

  @IsOptional()
  @IsUUID()
  ward_id?: string;

  @IsOptional()
  @IsUUID()
  meeting_id?: string;

  @IsDateString()
  meeting_date!: string;

  @IsOptional()
  @IsString()
  meeting_minutes_url?: string;

  @IsString()
  chair_name!: string;

  @IsOptional()
  @IsString()
  chair_nrc?: string;

  @IsBoolean()
  chair_signed!: boolean;

  @IsNumber()
  attendees_count!: number;

  @IsBoolean()
  quorum_met!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  // Residency verification
  @IsOptional()
  @IsBoolean()
  residency_verified?: boolean;

  @IsOptional()
  @IsString()
  residency_verified_by?: string;

  @IsOptional()
  @IsString()
  residency_verification_method?: string;

  @IsOptional()
  @IsNumber()
  residents_count?: number;

  @IsOptional()
  @IsNumber()
  non_residents_count?: number;

  @IsOptional()
  @IsBoolean()
  residency_threshold_met?: boolean;

  @IsOptional()
  @IsString()
  residency_notes?: string;
}

