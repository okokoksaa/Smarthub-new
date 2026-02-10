import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPass123!',
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: 'New password (min 8 characters, must include uppercase, lowercase, number, and special character)',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

/**
 * Reset Password DTO
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password (min 8 characters)',
    example: 'NewSecurePass456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

/**
 * Request Password Reset DTO
 */
export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsString()
  email: string;
}
