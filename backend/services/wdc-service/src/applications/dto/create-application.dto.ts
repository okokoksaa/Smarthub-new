import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsPositive,
  IsUUID,
  IsEmail,
  IsOptional,
  Length,
  Min,
  Max,
} from 'class-validator';
import { ApplicationType } from '../entities/application.entity';

/**
 * Create WDC Application DTO
 */
export class CreateApplicationDto {
  @ApiProperty({
    description: 'Type of application',
    enum: ApplicationType,
    example: ApplicationType.PROJECT,
  })
  @IsEnum(ApplicationType)
  applicationType: ApplicationType;

  @ApiProperty({
    description: 'Project/application title',
    example: 'Community Water Borehole Project',
    maxLength: 200,
  })
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the project',
    example: 'Installation of a water borehole to serve 500 households in Ward 15',
  })
  @IsString()
  @Length(20, 2000)
  description: string;

  @ApiProperty({
    description: 'Budget estimate in Kwacha',
    example: 50000.00,
    minimum: 1,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(100)
  @Max(10000000)
  budgetEstimate: number;

  @ApiProperty({
    description: 'Number of beneficiaries',
    example: 500,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(100000)
  beneficiariesCount: number;

  @ApiProperty({
    description: 'Ward ID where the project will be implemented',
    format: 'uuid',
  })
  @IsUUID()
  wardId: string;

  @ApiProperty({
    description: 'Full name of the applicant',
    example: 'John Banda',
    maxLength: 200,
  })
  @IsString()
  @Length(2, 200)
  applicantName: string;

  @ApiProperty({
    description: 'National Registration Card number',
    example: '123456/78/9',
    maxLength: 20,
  })
  @IsString()
  @Length(8, 20)
  applicantNrc: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+260971234567',
    maxLength: 20,
  })
  @IsString()
  @Length(10, 20)
  applicantPhone: string;

  @ApiProperty({
    description: 'Physical address of the applicant',
    example: 'Plot 123, Lusaka Road, Kabwe',
  })
  @IsString()
  @Length(10, 500)
  applicantAddress: string;

  @ApiPropertyOptional({
    description: 'Email address (optional)',
    example: 'john.banda@email.com',
  })
  @IsOptional()
  @IsEmail()
  applicantEmail?: string;
}

/**
 * Update Application DTO
 */
export class UpdateApplicationDto {
  @ApiPropertyOptional({
    description: 'Project/application title',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(5, 200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the project',
  })
  @IsOptional()
  @IsString()
  @Length(20, 2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Budget estimate in Kwacha',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(100)
  @Max(10000000)
  budgetEstimate?: number;

  @ApiPropertyOptional({
    description: 'Number of beneficiaries',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(100000)
  beneficiariesCount?: number;

  @ApiPropertyOptional({
    description: 'Full name of the applicant',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  applicantName?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(10, 20)
  applicantPhone?: string;

  @ApiPropertyOptional({
    description: 'Physical address of the applicant',
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  applicantAddress?: string;

  @ApiPropertyOptional({
    description: 'Email address (optional)',
  })
  @IsOptional()
  @IsEmail()
  applicantEmail?: string;
}

/**
 * Submit Application DTO
 */
export class SubmitApplicationDto {
  @ApiPropertyOptional({
    description: 'Additional notes or comments for submission',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  submissionNotes?: string;
}

/**
 * Review Application DTO
 */
export class ReviewApplicationDto {
  @ApiProperty({
    description: 'Whether to approve or reject the application',
    example: true,
  })
  @IsEnum(['approve', 'reject'])
  decision: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Review comments',
    example: 'Application meets all requirements and serves community needs',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  reviewComments?: string;
}

/**
 * Verify Residency DTO
 */
export class VerifyResidencyDto {
  @ApiProperty({
    description: 'Residency verification status',
    example: true,
  })
  verified: boolean;

  @ApiPropertyOptional({
    description: 'Verification comments',
    example: 'Residency confirmed through ward records',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  verificationComments?: string;
}