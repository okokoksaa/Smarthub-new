import { IsString, IsNumber, IsOptional, IsUUID, IsEnum, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GrantType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  COOPERATIVE = 'cooperative',
  WOMEN_GROUP = 'women_group',
  YOUTH_GROUP = 'youth_group',
  DISABILITY_GROUP = 'disability_group',
}

export class CreateEmpowermentDto {
  @ApiProperty({ description: 'Constituency ID' })
  @IsUUID()
  constituency_id: string;

  @ApiPropertyOptional({ description: 'Ward ID' })
  @IsUUID()
  @IsOptional()
  ward_id?: string;

  @ApiProperty({ description: 'Applicant full name' })
  @IsString()
  applicant_name: string;

  @ApiPropertyOptional({ description: 'Applicant NRC number (format: NNNNNN/NN/N)' })
  @IsString()
  @IsOptional()
  applicant_nrc?: string;

  @ApiPropertyOptional({ description: 'Applicant phone number' })
  @IsString()
  @IsOptional()
  applicant_phone?: string;

  @ApiPropertyOptional({ description: 'Applicant physical address' })
  @IsString()
  @IsOptional()
  applicant_address?: string;

  @ApiPropertyOptional({ description: 'Group name (for group grants)' })
  @IsString()
  @IsOptional()
  group_name?: string;

  @ApiPropertyOptional({ description: 'Number of members in group' })
  @IsInt()
  @Min(1)
  @IsOptional()
  group_size?: number;

  @ApiProperty({ description: 'Type of grant', enum: GrantType })
  @IsEnum(GrantType)
  grant_type: GrantType;

  @ApiProperty({ description: 'Purpose/business description for the grant' })
  @IsString()
  purpose: string;

  @ApiProperty({ description: 'Requested amount in ZMW' })
  @IsNumber()
  @Min(0)
  requested_amount: number;

  @ApiPropertyOptional({ description: 'Training completed (required for some grants)' })
  @IsString()
  @IsOptional()
  training_completed?: string;

  @ApiPropertyOptional({ description: 'Business plan document ID' })
  @IsUUID()
  @IsOptional()
  business_plan_document_id?: string;
}
