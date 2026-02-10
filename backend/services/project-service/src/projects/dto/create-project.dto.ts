import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsObject,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectType, ProjectPriority, ProcurementMethod } from '@shared/database';

/**
 * Beneficiary Demographics DTO
 */
export class BeneficiaryDemographicsDto {
  @ApiPropertyOptional({ description: 'Number of male beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  male?: number;

  @ApiPropertyOptional({ description: 'Number of female beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  female?: number;

  @ApiPropertyOptional({ description: 'Number of children beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ description: 'Number of youth beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  youth?: number;

  @ApiPropertyOptional({ description: 'Number of elderly beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  elderly?: number;

  @ApiPropertyOptional({ description: 'Number of disabled beneficiaries' })
  @IsOptional()
  @IsInt()
  @Min(0)
  disabled?: number;
}

/**
 * Create Project DTO
 */
export class CreateProjectDto {
  @ApiProperty({
    description: 'Project title',
    example: 'Construction of Community Health Clinic',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({
    description: 'Detailed project description',
    example: 'Construction of a modern community health clinic with maternity ward and pharmacy',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Project type',
    enum: ProjectType,
    example: ProjectType.HEALTH,
  })
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @ApiPropertyOptional({
    description: 'Project priority',
    enum: ProjectPriority,
    example: ProjectPriority.HIGH,
    default: ProjectPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @ApiProperty({
    description: 'Constituency UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  constituencyId: string;

  @ApiPropertyOptional({
    description: 'Ward UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  wardId?: string;

  @ApiPropertyOptional({
    description: 'Specific location within ward',
    example: 'Kanyama Compound, Plot 123',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Estimated project cost in ZMW',
    example: 500000,
  })
  @IsNumber()
  @Min(1)
  estimatedCost: number;

  @ApiProperty({
    description: 'Fiscal year',
    example: 2024,
  })
  @IsInt()
  @Min(2020)
  @Max(2100)
  fiscalYear: number;

  @ApiPropertyOptional({
    description: 'Planned start date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Planned end date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Project duration in months',
    example: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  durationMonths?: number;

  @ApiPropertyOptional({
    description: 'Procurement method',
    enum: ProcurementMethod,
    example: ProcurementMethod.OPEN_TENDER,
  })
  @IsOptional()
  @IsEnum(ProcurementMethod)
  procurementMethod?: ProcurementMethod;

  @ApiPropertyOptional({
    description: 'Target number of beneficiaries',
    example: 5000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetBeneficiaries?: number;

  @ApiPropertyOptional({
    description: 'Beneficiary demographics breakdown',
    type: BeneficiaryDemographicsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BeneficiaryDemographicsDto)
  beneficiaryDemographics?: BeneficiaryDemographicsDto;

  @ApiPropertyOptional({
    description: 'Environmental impact assessment required',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  environmentalImpactAssessment?: boolean;

  @ApiPropertyOptional({
    description: 'Social impact assessment required',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  socialImpactAssessment?: boolean;

  @ApiPropertyOptional({
    description: 'Sustainability plan',
    example: 'Community-led maintenance with trained local staff',
  })
  @IsOptional()
  @IsString()
  sustainabilityPlan?: string;

  @ApiPropertyOptional({
    description: 'Project manager UUID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  projectManagerId?: string;

  @ApiPropertyOptional({
    description: 'Monitoring officer UUID',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  monitoringOfficerId?: string;

  @ApiPropertyOptional({
    description: 'Proposal document URL',
    example: 'https://storage.example.com/proposals/proj123.pdf',
  })
  @IsOptional()
  @IsString()
  proposalDocumentUrl?: string;

  @ApiPropertyOptional({
    description: 'Project tags',
    example: ['healthcare', 'infrastructure', 'community'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'UN SDG alignment (SDG numbers)',
    example: [3, 8, 11],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  sdgAlignment?: number[];
}
