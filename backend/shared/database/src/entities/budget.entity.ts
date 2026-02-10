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
import { Constituency } from './administrative.entity';
import { User } from './user.entity';

/**
 * Budget Status ENUM
 */
export enum BudgetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ALLOCATED = 'ALLOCATED',
  EXHAUSTED = 'EXHAUSTED',
}

/**
 * Budget Category ENUM
 */
export enum BudgetCategory {
  CAPITAL_PROJECTS = 'CAPITAL_PROJECTS',
  RECURRENT_EXPENSES = 'RECURRENT_EXPENSES',
  EMERGENCY_FUND = 'EMERGENCY_FUND',
  ADMINISTRATIVE_COSTS = 'ADMINISTRATIVE_COSTS',
  MONITORING_EVALUATION = 'MONITORING_EVALUATION',
}

/**
 * Budget Allocation Entity
 * Represents budget allocation to constituencies and projects
 */
@Entity('budget_allocations')
@Index(['constituencyId', 'fiscalYear'])
@Index(['projectId', 'fiscalYear'])
@Index(['fiscalYear', 'status'])
@Check(`allocated_amount > 0`)
@Check(`amount_utilized >= 0`)
@Check(`amount_committed >= 0`)
export class BudgetAllocation extends BaseEntity {
  // Reference Information
  @Column({ name: 'budget_code', type: 'varchar', length: 50, unique: true })
  budgetCode: string;

  @Column({ name: 'fiscal_year', type: 'integer' })
  fiscalYear: number;

  @Column({ name: 'budget_category', type: 'enum', enum: BudgetCategory })
  budgetCategory: BudgetCategory;

  // Allocation Target
  @Column({ name: 'constituency_id', type: 'uuid' })
  constituencyId: string;

  @ManyToOne(() => Constituency)
  @JoinColumn({ name: 'constituency_id' })
  constituency: Constituency;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  // Financial Information
  @Column({ name: 'allocated_amount', type: 'decimal', precision: 15, scale: 2 })
  allocatedAmount: number;

  @Column({ name: 'amount_utilized', type: 'decimal', precision: 15, scale: 2, default: 0 })
  amountUtilized: number;

  @Column({ name: 'amount_committed', type: 'decimal', precision: 15, scale: 2, default: 0 })
  amountCommitted: number;

  @Column({ name: 'amount_available', type: 'decimal', precision: 15, scale: 2 })
  amountAvailable: number;

  // Status & Approval
  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.DRAFT })
  status: BudgetStatus;

  @Column({ name: 'approved', type: 'boolean', default: false })
  approved: boolean;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver?: User;

  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'approval_notes', type: 'text', nullable: true })
  approvalNotes?: string;

  // Timeline
  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  // Metadata
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    source?: string;
    restrictions?: string[];
    conditions?: string[];
  };

  // Computed properties
  get utilizationRate(): number {
    if (this.allocatedAmount === 0) return 0;
    return (this.amountUtilized / this.allocatedAmount) * 100;
  }

  get commitmentRate(): number {
    if (this.allocatedAmount === 0) return 0;
    return (this.amountCommitted / this.allocatedAmount) * 100;
  }

  get isExhausted(): boolean {
    return this.amountAvailable <= 0;
  }

  get isExpired(): boolean {
    return new Date() > this.expiryDate;
  }
}
