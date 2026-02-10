import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
  CITIZEN = 'CITIZEN'
}

export enum TenantScopeLevel {
  NATIONAL = 'NATIONAL',
  PROVINCIAL = 'PROVINCIAL',
  DISTRICT = 'DISTRICT',
  CONSTITUENCY = 'CONSTITUENCY',
  WARD = 'WARD'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column('text', { nullable: true })
  mfaBackupCodes: string;

  @Column({ nullable: true })
  salt: string;

  @Column({ nullable: true })
  passwordChangedAt: Date;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true })
  lockedReason: string;

  @Column({ nullable: true })
  lockedAt: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  emailVerifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}