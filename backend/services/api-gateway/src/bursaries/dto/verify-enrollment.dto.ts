import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyEnrollmentDto {
  @ApiProperty({ description: 'Enrollment verified status' })
  @IsBoolean()
  enrollment_verified: boolean;

  @ApiPropertyOptional({ description: 'Enrollment proof document ID' })
  @IsOptional()
  @IsUUID()
  enrollment_proof_document_id?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsOptional()
  @IsString()
  verification_notes?: string;

  @ApiPropertyOptional({ description: 'Institution confirmation reference' })
  @IsOptional()
  @IsString()
  institution_confirmation_ref?: string;
}
