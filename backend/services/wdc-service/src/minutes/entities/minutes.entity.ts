import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * WDC Minutes Entity
 * Represents meeting minutes with approval workflow
 */
@Entity('wdc_minutes')
export class WdcMinutes {
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

  // Meeting reference
  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  // Document information
  @Column({ name: 'document_name' })
  documentName: string;

  @Column({ name: 'document_url', type: 'text' })
  documentUrl: string;

  @Column({ name: 'document_type', length: 10 })
  documentType: string;

  @Column({ name: 'document_size_bytes' })
  documentSizeBytes: number;

  // Minutes content
  @Column({ name: 'recorded_date', type: 'date' })
  recordedDate: Date;

  @Column({ name: 'attendees_present', type: 'text', array: true })
  attendeesPresent: string[];

  @Column({ name: 'decisions_made', type: 'text' })
  decisionsMade: string;

  @Column({ name: 'actions_assigned', type: 'text', nullable: true })
  actionsAssigned?: string;

  // Approval workflow
  @Column({ name: 'chairperson_approved', default: false })
  chairpersonApproved: boolean;

  @Column({ name: 'chairperson_approved_by', type: 'uuid', nullable: true })
  chairpersonApprovedBy?: string;

  @Column({ name: 'chairperson_approved_at', type: 'timestamptz', nullable: true })
  chairpersonApprovedAt?: Date;

  @Column({ name: 'signature_data', type: 'text', nullable: true })
  signatureData?: string;

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

  // Computed properties
  get isApproved(): boolean {
    return this.chairpersonApproved && this.verified;
  }

  get canApprove(): boolean {
    return !this.chairpersonApproved && this.isActive;
  }
}