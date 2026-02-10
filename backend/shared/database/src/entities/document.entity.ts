import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

export enum DocumentType {
  PROJECT_PROPOSAL = 'PROJECT_PROPOSAL',
  BUDGET_DOCUMENT = 'BUDGET_DOCUMENT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  REPORT = 'REPORT',
  PAYMENT_VOUCHER = 'PAYMENT_VOUCHER',
  MILESTONE_EVIDENCE = 'MILESTONE_EVIDENCE',
  APPROVAL_LETTER = 'APPROVAL_LETTER',
  MEETING_MINUTES = 'MEETING_MINUTES',
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentAccessLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  RESTRICTED = 'RESTRICTED',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500 })
  originalFilename: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  storageKey: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
    name: 'document_type',
  })
  documentType: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({
    type: 'enum',
    enum: DocumentAccessLevel,
    default: DocumentAccessLevel.INTERNAL,
    name: 'access_level',
  })
  accessLevel: DocumentAccessLevel;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tags: string[];

  // Version control
  @Column({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true, name: 'parent_document_id' })
  parentDocumentId: string;

  @Column({ type: 'boolean', default: true, name: 'is_latest_version' })
  isLatestVersion: boolean;

  // Relations
  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ type: 'uuid', nullable: true, name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Document, { nullable: true })
  @JoinColumn({ name: 'parent_document_id' })
  parentDocument: Document;

  @OneToMany(() => Document, (document) => document.parentDocument)
  versions: Document[];

  // Approval workflow
  @Column({ type: 'uuid', nullable: true, name: 'approved_by' })
  approvedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ type: 'timestamptz', nullable: true, name: 'approved_at' })
  approvedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'approval_notes' })
  approvalNotes: string;

  @Column({ type: 'uuid', nullable: true, name: 'rejected_by' })
  rejectedBy: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'rejected_at' })
  rejectedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason: string;

  // Administrative hierarchy (for RLS)
  @Column({ type: 'uuid', nullable: true, name: 'constituency_id' })
  constituencyId: string;

  @Column({ type: 'uuid', nullable: true, name: 'ward_id' })
  wardId: string;

  @Column({ type: 'uuid', nullable: true, name: 'district_id' })
  districtId: string;

  @Column({ type: 'uuid', nullable: true, name: 'province_id' })
  provinceId: string;

  // Soft delete
  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date;

  @Column({ type: 'uuid', nullable: true, name: 'deleted_by' })
  deletedBy: string;

  // Download tracking
  @Column({ type: 'integer', default: 0, name: 'download_count' })
  downloadCount: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_downloaded_at' })
  lastDownloadedAt: Date;

  // Timestamps
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get fileSizeMB(): number {
    return Number((Number(this.fileSize) / (1024 * 1024)).toFixed(2));
  }

  get isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  get isPDF(): boolean {
    return this.mimeType === 'application/pdf';
  }

  get isVideo(): boolean {
    return this.mimeType.startsWith('video/');
  }

  get isDocument(): boolean {
    return (
      this.mimeType.includes('word') ||
      this.mimeType.includes('excel') ||
      this.mimeType.includes('powerpoint') ||
      this.mimeType === 'application/pdf'
    );
  }

  get fileExtension(): string {
    return this.originalFilename.split('.').pop()?.toLowerCase() || '';
  }
}
