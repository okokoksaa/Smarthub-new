import { IsString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enable MFA DTO
 */
export class EnableMfaDto {
  @ApiProperty({
    description: 'TOTP verification code from authenticator app',
    example: '123456',
  })
  @IsString()
  verificationCode: string;

  @ApiProperty({
    description: 'Backup codes from MFA setup',
    example: ['A1B2C3D4', 'E5F6G7H8', '...'],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(10)
  @IsString({ each: true })
  backupCodes: string[];
}

/**
 * Verify MFA DTO
 */
export class VerifyMfaDto {
  @ApiProperty({
    description: 'TOTP verification code or backup code',
    example: '123456',
  })
  @IsString()
  code: string;
}

/**
 * Disable MFA DTO
 */
export class DisableMfaDto {
  @ApiProperty({
    description: 'TOTP verification code from authenticator app',
    example: '123456',
  })
  @IsString()
  verificationCode: string;
}

/**
 * Regenerate Backup Codes DTO
 */
export class RegenerateBackupCodesDto {
  @ApiProperty({
    description: 'TOTP verification code from authenticator app',
    example: '123456',
  })
  @IsString()
  verificationCode: string;
}
