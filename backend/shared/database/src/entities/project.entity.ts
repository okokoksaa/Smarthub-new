import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Constituency, Ward } from './administrative.entity';

/**
 * Project Status ENUM
 */
export enum ProjectStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BUDGETED = 'BUDGETED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

/**
 * Project Type ENUM
 */
export enum ProjectType {
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  WATER_AND_SANITATION = 'WATER_AND_SANITATION',
  AGRICULTURE = 'AGRICULTURE',
  SOCIAL_WELFARE = 'SOCIAL_WELFARE',
  SPORTS_AND_RECREATION = 'SPORTS_AND_RECREATION',
  ECONOMIC_EMPOWERMENT = 'ECONOMIC_EMPOWERMENT',
  ENVIRONMENT = 'ENVIRONMENT',
  GOVERNANCE = 'GOVERNANCE',
  OTHER = 'OTHER',
}

/**
 * Project Priority ENUM
 */
export enum ProjectPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Procurement Method ENUM
 */
export enum ProcurementMethod {
  OPEN_TENDER = 'OPEN_TENDER',
  RESTRICTED_TENDER = 'RESTRICTED_TENDER',
  REQUEST_FOR_QUOTATIONS = 'REQUEST_FOR_QUOTATIONS',
  DIRECT_PROCUREMENT = 'DIRECT_PROCUREMENT',
  FORCE_ACCOUNT = 'FORCE_ACCOUNT',
}

/**
 * Project Entity
 * Represents CDF projects with complete lifecycle management
 */
@Entity('projects')
@Index(['constituencyId', 'status'])
@Index(['wardId', 'status'])
@Index(['projectType', 'status'])
@Index(['fiscalYear', 'status'])
@Check(`estimated_cost > 0`)
@Check(`actual_cost >= 0`)
@Check(`start_date <= end_date`)
export class Project extends BaseEntity {
  // Basic Information
  @Column({ name: 'project_code', type: 'varchar', length: 50, unique: true })
  projectCode: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'project_type', type: 'enum', enum: ProjectType })
  projectType: ProjectType;

  @Column({ type: 'enum', enum: ProjectPriority, default: ProjectPriority.MEDIUM })
  priority: ProjectPriority;

  // Location
  @Column({ name: 'constituency_id', type: 'uuid' })
  constituencyId: string;

  @ManyToOne(() => Constituency)
  @JoinColumn({ name: 'constituency_id' })
  constituency: Constituency;

  @Column({ name: 'ward_id', type: 'uuid', nullable: true })
  wardId?: string;

  @ManyToOne(() => Ward)
  @JoinColumn({ name: 'ward_id' })
  ward?: Ward;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  // Financial Information
  @Column({ name: 'estimated_cost', type: 'decimal', precision: 15, scale: 2 })
  estimatedCost: number;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost: number;

  @Column({ name: 'budget_allocated', type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetAllocated: number;

  @Column({ name: 'amount_disbursed', type: 'decimal', precision: 15, scale: 2, default: 0 })
  amountDisbursed: number;

  @Column({ name: 'fiscal_year', type: 'integer' })
  fiscalYear: number;

  // Timeline
  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'actual_start_date', type: 'date', nullable: true })
  actualStartDate?: Date;

  @Column({ name: 'actual_end_date', type: 'date', nullable: true })
  actualEndDate?: Date;

  @Column({ name: 'duration_months', type: 'integer', nullable: true })
  durationMonths?: number;

  // Procurement
  @Column({ name: 'procurement_method', type: 'enum', enum: ProcurementMethod, nullable: true })
  procurementMethod?: ProcurementMethod;

  @Column({ name: 'contractor_name', type: 'varchar', length: 255, nullable: true })
  contractorName?: string;

  @Column({ name: 'contractor_id', type: 'uuid', nullable: true })
  contractorId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'contractor_id' })
  contractor?: User;

  @Column({ name: 'contract_number', type: 'varchar', length: 100, nullable: true })
  contractNumber?: string;

  @Column({ name: 'contract_signed_date', type: 'date', nullable: true })
  contractSignedDate?: Date;

  // Status & Progress
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ name: 'progress_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ name: 'is_overdue', type: 'boolean', default: false })
  isOverdue: boolean;

  @Column({ name: 'is_over_budget', type: 'boolean', default: false })
  isOverBudget: boolean;

  // Beneficiaries
  @Column({ name: 'target_beneficiaries', type: 'integer', nullable: true })
  targetBeneficiaries?: number;

  @Column({ name: 'actual_beneficiaries', type: 'integer', default: 0 })
  actualBeneficiaries: number;

  @Column({ name: 'beneficiary_demographics', type: 'jsonb', nullable: true })
  beneficiaryDemographics?: {
    male?: number;
    female?: number;
    children?: number;
    youth?: number;
    elderly?: number;
    disabled?: number;
  };

  // Approvals
  @Column({ name: 'cdfc_approved', type: 'boolean', default: false })
  cdfcApproved: boolean;

  @Column({ name: 'cdfc_approved_at', type: 'timestamp with time zone', nullable: true })
  cdfcApprovedAt?: Date;

  @Column({ name: 'cdfc_approved_by', type: 'uuid', nullable: true })
  cdfcApprovedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cdfc_approved_by' })
  cdfcApprover?: User;

  @Column({ name: 'tac_approved', type: 'boolean', default: false })
  tacApproved: boolean;

  @Column({ name: 'tac_approved_at', type: 'timestamp with time zone', nullable: true })
  tacApprovedAt?: Date;

  @Column({ name: 'tac_approved_by', type: 'uuid', nullable: true })
  tacApprovedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tac_approved_by' })
  tacApprover?: User;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'rejection_date', type: 'timestamp with time zone', nullable: true })
  rejectionDate?: Date;

  // Project Team
  @Column({ name: 'project_manager_id', type: 'uuid', nullable: true })
  projectManagerId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'project_manager_id' })
  projectManager?: User;

  @Column({ name: 'monitoring_officer_id', type: 'uuid', nullable: true })
  monitoringOfficerId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'monitoring_officer_id' })
  monitoringOfficer?: User;

  // Documentation
  @Column({ name: 'proposal_document_url', type: 'text', nullable: true })
  proposalDocumentUrl?: string;

  @Column({ name: 'contract_document_url', type: 'text', nullable: true })
  contractDocumentUrl?: string;

  @Column({ name: 'completion_certificate_url', type: 'text', nullable: true })
  completionCertificateUrl?: string;

  // Monitoring & Evaluation
  @Column({ name: 'last_inspection_date', type: 'date', nullable: true })
  lastInspectionDate?: Date;

  @Column({ name: 'next_inspection_date', type: 'date', nullable: true })
  nextInspectionDate?: Date;

  @Column({ name: 'quality_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  qualityRating?: number;

  @Column({ name: 'inspection_notes', type: 'text', nullable: true })
  inspectionNotes?: string;

  // Environmental & Social Impact
  @Column({ name: 'environmental_impact_assessment', type: 'boolean', default: false })
  environmentalImpactAssessment: boolean;

  @Column({ name: 'social_impact_assessment', type: 'boolean', default: false })
  socialImpactAssessment: boolean;

  @Column({ name: 'sustainability_plan', type: 'text', nullable: true })
  sustainabilityPlan?: string;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    tags?: string[];
    customFields?: Record<string, any>;
    sdgAlignment?: number[]; // UN Sustainable Development Goals
    impactIndicators?: Record<string, any>;
  };

  // Computed properties
  get isOnTrack(): boolean {
    if (!this.endDate) return true;
    const today = new Date();
    const daysUntilEnd = Math.floor((this.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = Math.min(100, (this.progressPercentage / 100) * daysUntilEnd);
    return this.progressPercentage >= expectedProgress * 0.9;
  }

  get budgetUtilizationRate(): number {
    if (this.budgetAllocated === 0) return 0;
    return (this.amountDisbursed / this.budgetAllocated) * 100;
  }

  get costVariance(): number {
    return this.actualCost - this.estimatedCost;
  }

  get scheduleVariance(): number {
    if (!this.endDate || !this.actualEndDate) return 0;
    return Math.floor((this.actualEndDate.getTime() - this.endDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  get beneficiaryReachRate(): number {
    if (!this.targetBeneficiaries || this.targetBeneficiaries === 0) return 0;
    return (this.actualBeneficiaries / this.targetBeneficiaries) * 100;
  }
}
