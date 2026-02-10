import { Entity, Column, Index, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * User Roles ENUM
 */
export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  MINISTRY = 'MINISTRY',
  AUDITOR_GENERAL = 'AUDITOR_GENERAL',
  PLGO = 'PLGO',
  CDFC_CHAIR = 'CDFC_CHAIR',
  CDFC_MEMBER = 'CDFC_MEMBER',
  WDC_CHAIR = 'WDC_CHAIR',
  WDC_MEMBER = 'WDC_MEMBER',
  TAC_MEMBER = 'TAC_MEMBER',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  M_AND_E_OFFICER = 'M_AND_E_OFFICER',
  CONTRACTOR = 'CONTRACTOR',
  SUPPLIER = 'SUPPLIER',
  CITIZEN = 'CITIZEN',
}

/**
 * Tenant Scope Level ENUM
 */
export enum TenantScopeLevel {
  NATIONAL = 'NATIONAL',
  PROVINCIAL = 'PROVINCIAL',
  DISTRICT = 'DISTRICT',
  CONSTITUENCY = 'CONSTITUENCY',
  WARD = 'WARD',
}

/**
 * Gender ENUM
 */
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

/**
 * User Entity
 * Represents system users with authentication and authorization
 */
@Entity('users')
@Index(['email'], { unique: true })
@Index(['nationalIdNumber'], { unique: true, where: 'national_id_number IS NOT NULL' })
export class User extends BaseEntity {
  // Authentication
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  // Personal Information
  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName?: string;

  @Column({ name: 'national_id_number', type: 'varchar', length: 20, nullable: true })
  nationalIdNumber?: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  // Contact Information
  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ name: 'alternative_phone', type: 'varchar', length: 20, nullable: true })
  alternativePhone?: string;

  @Column({ name: 'physical_address', type: 'text', nullable: true })
  physicalAddress?: string;

  // Role & Permissions
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'tenant_scope_level', type: 'enum', enum: TenantScopeLevel })
  tenantScopeLevel: TenantScopeLevel;

  // Profile
  @Column({ name: 'profile_photo_url', type: 'text', nullable: true })
  profilePhotoUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  // Multi-Factor Authentication
  @Column({ name: 'mfa_enabled', type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', type: 'varchar', length: 255, nullable: true, select: false })
  mfaSecret?: string;

  @Column({ name: 'mfa_backup_codes', type: 'jsonb', nullable: true, select: false })
  mfaBackupCodes?: string[];

  // Email Verification
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamp with time zone', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ name: 'verification_token', type: 'varchar', length: 255, nullable: true, select: false })
  verificationToken?: string;

  // Password Reset
  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true, select: false })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires', type: 'timestamp with time zone', nullable: true })
  passwordResetExpires?: Date;

  @Column({ name: 'password_changed_at', type: 'timestamp with time zone', nullable: true })
  passwordChangedAt?: Date;

  // Account Status
  @Column({ name: 'is_locked', type: 'boolean', default: false })
  isLocked: boolean;

  @Column({ name: 'locked_at', type: 'timestamp with time zone', nullable: true })
  lockedAt?: Date;

  @Column({ name: 'locked_reason', type: 'text', nullable: true })
  lockedReason?: string;

  @Column({ name: 'failed_login_attempts', type: 'integer', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'last_failed_login', type: 'timestamp with time zone', nullable: true })
  lastFailedLogin?: Date;

  // Activity Tracking
  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'last_login_ip', type: 'inet', nullable: true })
  lastLoginIp?: string;

  @Column({ name: 'last_activity_at', type: 'timestamp with time zone', nullable: true })
  lastActivityAt?: Date;

  // Preferences
  @Column({ name: 'language_preference', type: 'varchar', length: 10, default: 'en' })
  languagePreference: string;

  @Column({ name: 'timezone', type: 'varchar', length: 50, default: 'Africa/Lusaka' })
  timezone: string;

  @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Virtual property for full name
  get fullName(): string {
    const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
    return parts.join(' ');
  }

  // Virtual property for initials
  get initials(): string {
    const firstInitial = this.firstName?.charAt(0) || '';
    const lastInitial = this.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  // Check if account is locked
  isAccountLocked(): boolean {
    return this.isLocked || this.failedLoginAttempts >= 5;
  }

  // Check if email is verified
  isEmailVerified(): boolean {
    return this.isVerified && !!this.emailVerifiedAt;
  }

  // Check if MFA is required
  requiresMfa(): boolean {
    // MFA required for financial operations roles
    const mfaRequiredRoles = [
      UserRole.SYSTEM_ADMIN,
      UserRole.FINANCE_OFFICER,
      UserRole.PLGO,
      UserRole.CDFC_CHAIR,
    ];
    return mfaRequiredRoles.includes(this.role) || this.mfaEnabled;
  }
}
