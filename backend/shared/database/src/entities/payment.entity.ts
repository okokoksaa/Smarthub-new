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
import { BudgetAllocation } from './budget.entity';

/**
 * Payment Status ENUM
 */
export enum PaymentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PANEL_A_PENDING = 'PANEL_A_PENDING',
  PANEL_A_APPROVED = 'PANEL_A_APPROVED',
  PANEL_A_REJECTED = 'PANEL_A_REJECTED',
  PANEL_B_PENDING = 'PANEL_B_PENDING',
  PANEL_B_APPROVED = 'PANEL_B_APPROVED',
  PANEL_B_REJECTED = 'PANEL_B_REJECTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

/**
 * Payment Type ENUM
 */
export enum PaymentType {
  CONTRACTOR_PAYMENT = 'CONTRACTOR_PAYMENT',
  SUPPLIER_PAYMENT = 'SUPPLIER_PAYMENT',
  SERVICE_PAYMENT = 'SERVICE_PAYMENT',
  ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
  RETENTION_RELEASE = 'RETENTION_RELEASE',
  REFUND = 'REFUND',
  OTHER = 'OTHER',
}

/**
 * Payment Method ENUM
 */
export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CHEQUE = 'CHEQUE',
  CASH = 'CASH',
}

/**
 * Payment Voucher Entity
 * Represents payment vouchers with dual-approval workflow (Panel A + Panel B)
 */
@Entity('payment_vouchers')
@Index(['projectId', 'status'])
@Index(['paymentType', 'status'])
@Index(['fiscalYear', 'status'])
@Index(['voucherNumber'], { unique: true })
@Check(`amount > 0`)
@Check(`retention_amount >= 0`)
@Check(`net_amount > 0`)
export class PaymentVoucher extends BaseEntity {
  // Voucher Information
  @Column({ name: 'voucher_number', type: 'varchar', length: 50, unique: true })
  voucherNumber: string;

  @Column({ name: 'payment_type', type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ name: 'fiscal_year', type: 'integer' })
  fiscalYear: number;

  // Project Reference
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // Budget Reference
  @Column({ name: 'budget_allocation_id', type: 'uuid' })
  budgetAllocationId: string;

  @ManyToOne(() => BudgetAllocation)
  @JoinColumn({ name: 'budget_allocation_id' })
  budgetAllocation: BudgetAllocation;

  // Payee Information
  @Column({ name: 'payee_name', type: 'varchar', length: 255 })
  payeeName: string;

  @Column({ name: 'payee_id', type: 'uuid', nullable: true })
  payeeId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'payee_id' })
  payee?: User;

  @Column({ name: 'payee_account_number', type: 'varchar', length: 100 })
  payeeAccountNumber: string;

  @Column({ name: 'payee_bank_name', type: 'varchar', length: 255, nullable: true })
  payeeBankName?: string;

  @Column({ name: 'payee_bank_branch', type: 'varchar', length: 255, nullable: true })
  payeeBankBranch?: string;

  @Column({ name: 'payee_phone_number', type: 'varchar', length: 20, nullable: true })
  payeePhoneNumber?: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'retention_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  retentionPercentage: number;

  @Column({ name: 'retention_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  retentionAmount: number;

  @Column({ name: 'net_amount', type: 'decimal', precision: 15, scale: 2 })
  netAmount: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 3, default: 'ZMW' })
  currencyCode: string;

  // Payment Details
  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100, nullable: true })
  invoiceNumber?: string;

  @Column({ name: 'invoice_date', type: 'date', nullable: true })
  invoiceDate?: Date;

  // Status & Workflow
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.DRAFT })
  status: PaymentStatus;

  // Panel A Approval (CDFC - Planning)
  @Column({ name: 'panel_a_approved', type: 'boolean', default: false })
  panelAApproved: boolean;

  @Column({ name: 'panel_a_approved_by', type: 'uuid', nullable: true })
  panelAApprovedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'panel_a_approved_by' })
  panelAApprover?: User;

  @Column({ name: 'panel_a_approved_at', type: 'timestamp with time zone', nullable: true })
  panelAApprovedAt?: Date;

  @Column({ name: 'panel_a_notes', type: 'text', nullable: true })
  panelANotes?: string;

  // Panel B Approval (Local Authority - Execution)
  @Column({ name: 'panel_b_approved', type: 'boolean', default: false })
  panelBApproved: boolean;

  @Column({ name: 'panel_b_approved_by', type: 'uuid', nullable: true })
  panelBApprovedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'panel_b_approved_by' })
  panelBApprover?: User;

  @Column({ name: 'panel_b_approved_at', type: 'timestamp with time zone', nullable: true })
  panelBApprovedAt?: Date;

  @Column({ name: 'panel_b_notes', type: 'text', nullable: true })
  panelBNotes?: string;

  // Rejection
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'rejected_at', type: 'timestamp with time zone', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'rejected_by' })
  rejector?: User;

  // Payment Execution
  @Column({ name: 'paid', type: 'boolean', default: false })
  paid: boolean;

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: Date;

  @Column({ name: 'payment_reference', type: 'varchar', length: 255, nullable: true })
  paymentReference?: string;

  @Column({ name: 'payment_receipt_url', type: 'text', nullable: true })
  paymentReceiptUrl?: string;

  @Column({ name: 'processed_by', type: 'uuid', nullable: true })
  processedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'processed_by' })
  processor?: User;

  // Supporting Documents
  @Column({ name: 'supporting_documents', type: 'jsonb', nullable: true })
  supportingDocuments?: {
    url: string;
    type: string;
    name: string;
    uploadedAt: Date;
  }[];

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    workCompletionPercentage?: number;
    milestoneReference?: string;
    contractReference?: string;
    previousPayments?: string[];
  };

  // Computed properties
  get requiresDualApproval(): boolean {
    return this.amount >= 10000; // Threshold for dual approval
  }

  get isFullyApproved(): boolean {
    return this.panelAApproved && this.panelBApproved;
  }

  get approvalProgress(): number {
    if (this.panelAApproved && this.panelBApproved) return 100;
    if (this.panelAApproved || this.panelBApproved) return 50;
    return 0;
  }

  get daysInApprovalProcess(): number {
    const startDate = this.status === PaymentStatus.SUBMITTED ? this.createdAt : new Date();
    const today = new Date();
    return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}
