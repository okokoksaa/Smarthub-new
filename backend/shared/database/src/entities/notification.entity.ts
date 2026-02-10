import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

export enum NotificationCategory {
  // Project notifications
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_APPROVED = 'PROJECT_APPROVED',
  PROJECT_REJECTED = 'PROJECT_REJECTED',

  // Milestone notifications
  MILESTONE_CREATED = 'MILESTONE_CREATED',
  MILESTONE_COMPLETED = 'MILESTONE_COMPLETED',
  MILESTONE_OVERDUE = 'MILESTONE_OVERDUE',

  // Payment notifications
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  PAYMENT_PANEL_A_APPROVAL = 'PAYMENT_PANEL_A_APPROVAL',
  PAYMENT_PANEL_B_APPROVAL = 'PAYMENT_PANEL_B_APPROVAL',
  PAYMENT_APPROVED = 'PAYMENT_APPROVED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  PAYMENT_EXECUTED = 'PAYMENT_EXECUTED',

  // Document notifications
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',

  // Budget notifications
  BUDGET_ALLOCATED = 'BUDGET_ALLOCATED',
  BUDGET_LOW = 'BUDGET_LOW',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',

  // User notifications
  USER_CREATED = 'USER_CREATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',

  // System notifications
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',

  // General
  GENERAL = 'GENERAL',
}

@Entity('notifications')
@Index(['recipientId', 'status'])
@Index(['recipientId', 'createdAt'])
@Index(['category', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  // Recipient
  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  // Email specific
  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail: string;

  // SMS specific
  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone: string;

  // Push notification specific
  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceToken: string;

  // Content
  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  htmlBody: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  // Template info
  @Column({ type: 'varchar', length: 100, nullable: true })
  templateName: string;

  @Column({ type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  // Tracking
  @Column({ type: 'timestamptz', nullable: true, name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' })
  deliveredAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'failed_at' })
  failedAt: Date;

  // Error handling
  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'integer', default: 0, name: 'retry_count' })
  retryCount: number;

  @Column({ type: 'integer', default: 3, name: 'max_retries' })
  maxRetries: number;

  @Column({ type: 'timestamptz', nullable: true, name: 'next_retry_at' })
  nextRetryAt: Date;

  // External IDs (from email/SMS providers)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_id' })
  externalId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string;

  // Scheduled sending
  @Column({ type: 'timestamptz', nullable: true, name: 'scheduled_for' })
  scheduledFor: Date;

  // Expiration
  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date;

  // Related entities
  @Column({ type: 'uuid', nullable: true, name: 'project_id' })
  projectId: string;

  @Column({ type: 'uuid', nullable: true, name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'uuid', nullable: true, name: 'document_id' })
  documentId: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // Computed properties
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  get isPending(): boolean {
    return this.status === NotificationStatus.PENDING;
  }

  get isSent(): boolean {
    return this.status === NotificationStatus.SENT ||
           this.status === NotificationStatus.DELIVERED ||
           this.status === NotificationStatus.READ;
  }

  get isFailed(): boolean {
    return this.status === NotificationStatus.FAILED;
  }

  get canRetry(): boolean {
    return this.isFailed && this.retryCount < this.maxRetries;
  }

  get isRead(): boolean {
    return this.status === NotificationStatus.READ;
  }
}
