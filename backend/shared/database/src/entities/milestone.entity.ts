import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { User } from './user.entity';

/**
 * Milestone Status ENUM
 */
export enum MilestoneStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

/**
 * Milestone Entity
 * Represents project milestones for tracking progress
 */
@Entity('project_milestones')
@Index(['projectId', 'status'])
@Index(['dueDate', 'status'])
@Check(`percentage_weight >= 0 AND percentage_weight <= 100`)
@Check(`actual_cost >= 0`)
export class Milestone extends BaseEntity {
  // Project Reference
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // Milestone Information
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sequence_number', type: 'integer' })
  sequenceNumber: number;

  @Column({ name: 'percentage_weight', type: 'decimal', precision: 5, scale: 2 })
  percentageWeight: number;

  // Timeline
  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate?: Date;

  // Status
  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.PENDING })
  status: MilestoneStatus;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_delayed', type: 'boolean', default: false })
  isDelayed: boolean;

  // Financial
  @Column({ name: 'budgeted_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetedAmount: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost: number;

  // Deliverables
  @Column({ type: 'jsonb', nullable: true })
  deliverables?: {
    description: string;
    quantity?: number;
    unit?: string;
    completed?: boolean;
  }[];

  // Verification
  @Column({ name: 'verified', type: 'boolean', default: false })
  verified: boolean;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'verified_by' })
  verifier?: User;

  @Column({ name: 'verified_at', type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes?: string;

  // Documentation
  @Column({ name: 'evidence_documents', type: 'jsonb', nullable: true })
  evidenceDocuments?: {
    url: string;
    type: string;
    uploadedAt: Date;
  }[];

  // Notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Computed properties
  get daysUntilDue(): number {
    const today = new Date();
    return Math.floor((this.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  get daysOverdue(): number {
    if (this.isCompleted) return 0;
    const today = new Date();
    const overdue = Math.floor((today.getTime() - this.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return overdue > 0 ? overdue : 0;
  }

  get costVariance(): number {
    return this.actualCost - this.budgetedAmount;
  }
}
