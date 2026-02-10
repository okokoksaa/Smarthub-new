import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

/**
 * Application Types enum
 */
export enum ApplicationType {
  PROJECT = 'PROJECT',
  GRANT_LOAN = 'GRANT_LOAN',
  BURSARY = 'BURSARY',
}

/**
 * Application Status enum
 */
export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  WDC_REVIEW = 'WDC_REVIEW',
  WDC_APPROVED = 'WDC_APPROVED',
  WDC_REJECTED = 'WDC_REJECTED',
  FORWARDED_TO_CDFC = 'FORWARDED_TO_CDFC',
  CDFC_REVIEW = 'CDFC_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * WDC Application Entity
 * Represents a project application submitted through the Ward Development Committee
 */
@Entity('wdc_applications')
export class WdcApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Application identification
  @Column({ name: 'application_number', unique: true })
  applicationNumber: string;

  // Application type and details
  @Column({
    name: 'application_type',
    type: 'enum',
    enum: ApplicationType,
  })
  applicationType: ApplicationType;

  @Column({ length: 200 })
  title: string;

  @Column('text')
  description: string;

  @Column({
    name: 'budget_estimate',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  budgetEstimate: number;

  @Column({ name: 'beneficiaries_count' })
  beneficiariesCount: number;

  // Geographic scope
  @Column({ name: 'ward_id', type: 'uuid' })
  wardId: string;

  @Column({ name: 'constituency_id', type: 'uuid' })
  constituencyId: string;

  @Column({ name: 'district_id', type: 'uuid' })
  districtId: string;

  @Column({ name: 'province_id', type: 'uuid' })
  provinceId: string;

  // Applicant information
  @Column({ name: 'applicant_name', length: 200 })
  applicantName: string;

  @Column({ name: 'applicant_nrc', length: 20 })
  applicantNrc: string;

  @Column({ name: 'applicant_phone', length: 20 })
  applicantPhone: string;

  @Column({ name: 'applicant_address', type: 'text' })
  applicantAddress: string;

  @Column({ name: 'applicant_email', nullable: true })
  applicantEmail?: string;

  // Application status and workflow
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  // Submission tracking
  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ name: 'wdc_reviewed_at', type: 'timestamptz', nullable: true })
  wdcReviewedAt?: Date;

  @Column({ name: 'wdc_review_comments', type: 'text', nullable: true })
  wdcReviewComments?: string;

  @Column({ name: 'wdc_approved_by', type: 'uuid', nullable: true })
  wdcApprovedBy?: string;

  // Requirements verification
  @Column({ name: 'residency_verified', default: false })
  residencyVerified: boolean;

  @Column({ name: 'residency_verified_by', type: 'uuid', nullable: true })
  residencyVerifiedBy?: string;

  @Column({ name: 'residency_verified_at', type: 'timestamptz', nullable: true })
  residencyVerifiedAt?: Date;

  @Column({ name: 'meeting_minutes_attached', default: false })
  meetingMinutesAttached: boolean;

  @Column({ name: 'meeting_id', type: 'uuid', nullable: true })
  meetingId?: string;

  // Audit trail
  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  // Relations
  @OneToMany(() => WdcApplicationDocument, document => document.application, {
    cascade: true,
    eager: false,
  })
  documents?: WdcApplicationDocument[];

  // Computed properties
  get canSubmit(): boolean {
    return (
      this.status === ApplicationStatus.DRAFT &&
      this.residencyVerified &&
      this.meetingMinutesAttached &&
      this.documents?.some(doc => doc.isActive && doc.verified) === true
    );
  }

  get canForwardToCdfc(): boolean {
    return (
      this.status === ApplicationStatus.WDC_APPROVED &&
      this.meetingMinutesAttached &&
      this.residencyVerified
    );
  }
}

/**
 * Document Categories enum
 */
export enum DocumentCategory {
  IDENTIFICATION = 'IDENTIFICATION',
  PROOF_OF_RESIDENCE = 'PROOF_OF_RESIDENCE',
  BUDGET_BREAKDOWN = 'BUDGET_BREAKDOWN',
  SUPPORTING_LETTER = 'SUPPORTING_LETTER',
  PROJECT_PROPOSAL = 'PROJECT_PROPOSAL',
  OTHER = 'OTHER',
}

/**
 * WDC Application Document Entity
 * Represents supporting documents for WDC applications
 */
@Entity('wdc_application_documents')
export class WdcApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Application reference
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  // Document information
  @Column({ name: 'document_name' })
  documentName: string;

  @Column({ name: 'document_type', length: 50 })
  documentType: string;

  @Column({ name: 'document_url', type: 'text' })
  documentUrl: string;

  @Column({ name: 'document_size_bytes' })
  documentSizeBytes: number;

  @Column({ name: 'file_extension', length: 10 })
  fileExtension: string;

  // Document classification
  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  category: DocumentCategory;

  // Verification status
  @Column({ default: false })
  verified: boolean;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verification_comments', type: 'text', nullable: true })
  verificationComments?: string;

  // Audit trail
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  // Relations
  @ManyToOne(() => WdcApplication, application => application.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: WdcApplication;
}