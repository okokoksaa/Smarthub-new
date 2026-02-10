import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsDateString,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole, TenantScopeLevel, Gender } from '../../entities/user.entity';

/**
 * Create User DTO
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (min 8 characters, must include uppercase, lowercase, number, and special character)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Middle name',
    example: 'Michael',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiPropertyOptional({
    description: 'Zambian National Registration Card (NRC) number',
    example: '123456/78/9',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nationalIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Phone number in international format',
    example: '+260977123456',
  })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Alternative phone number',
    example: '+260966789012',
  })
  @IsOptional()
  @IsPhoneNumber()
  alternativePhone?: string;

  @ApiPropertyOptional({
    description: 'Physical address',
    example: 'Plot 123, Independence Avenue, Lusaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  physicalAddress?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CDFC_MEMBER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Tenant scope level',
    enum: TenantScopeLevel,
    example: TenantScopeLevel.CONSTITUENCY,
  })
  @IsEnum(TenantScopeLevel)
  tenantScopeLevel: TenantScopeLevel;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://storage.example.com/photos/user123.jpg',
  })
  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'Community development advocate with 10 years of experience',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Language preference',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  languagePreference?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'Africa/Lusaka',
    default: 'Africa/Lusaka',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Notification preferences',
    example: {
      email: true,
      sms: true,
      push: false,
    },
  })
  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
}
