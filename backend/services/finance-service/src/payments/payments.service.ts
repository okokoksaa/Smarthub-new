import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PaymentVoucher,
  PaymentStatus,
  BudgetAllocation,
  Project,
} from '@shared/database';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApprovePaymentDto, ExecutePaymentDto } from './dto/approve-payment.dto';
import { BudgetService } from '../budget/budget.service';

/**
 * Payments Service
 * Handles payment vouchers with dual-approval workflow (Panel A + Panel B)
 *
 * CRITICAL SECURITY:
 * - Panel A (CDFC) approval required BEFORE Panel B
 * - Panel B (Local Authority) approval required BEFORE payment execution
 * - Budget commitment on submission, utilization on payment execution
 * - All approvals logged for audit trail
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentVoucher)
    private readonly paymentRepository: Repository<PaymentVoucher>,
    @InjectRepository(BudgetAllocation)
    private readonly budgetRepository: Repository<BudgetAllocation>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly budgetService: BudgetService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create payment voucher
   */
  async create(createPaymentDto: CreatePaymentDto, userId: string): Promise<PaymentVoucher> {
    // Verify budget allocation exists and has sufficient funds
    const budget = await this.budgetRepository.findOne({
      where: { id: createPaymentDto.budgetAllocationId },
    });

    if (!budget) {
      throw new NotFoundException('Budget allocation not found');
    }

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: createPaymentDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Calculate retention and net amount
    const retentionPercentage = createPaymentDto.retentionPercentage || 0;
    const retentionAmount = (createPaymentDto.amount * retentionPercentage) / 100;
    const netAmount = createPaymentDto.amount - retentionAmount;

    // Generate voucher number
    const voucherNumber = await this.generateVoucherNumber(createPaymentDto.fiscalYear);

    // Add upload timestamps to supporting documents
    const supportingDocuments = createPaymentDto.supportingDocuments?.map((doc) => ({
      ...doc,
      uploadedAt: new Date(),
    }));

    // Create payment voucher
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      voucherNumber,
      retentionAmount,
      netAmount,
      supportingDocuments,
      status: PaymentStatus.DRAFT,
      panelAApproved: false,
      panelBApproved: false,
      paid: false,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    this.logger.log(`Payment voucher created: ${savedPayment.voucherNumber}`);

    // Emit event
    this.eventEmitter.emit('payment.created', { payment: savedPayment });

    return savedPayment;
  }

  /**
   * Submit payment voucher for approval
   * COMMITS budget when submitted
   */
  async submit(id: string, userId: string): Promise<PaymentVoucher> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.DRAFT) {
      throw new BadRequestException('Only draft payments can be submitted');
    }

    // Validate supporting documents
    if (!payment.supportingDocuments || payment.supportingDocuments.length === 0) {
      throw new BadRequestException('Supporting documents required for submission');
    }

    // Commit budget (reserve funds)
    await this.budgetService.commit(payment.budgetAllocationId, payment.netAmount);

    payment.status = PaymentStatus.PANEL_A_PENDING;
    payment.updatedBy = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment voucher submitted: ${updatedPayment.voucherNumber} - Amount committed: ${updatedPayment.netAmount}`,
    );

    // Emit event
    this.eventEmitter.emit('payment.submitted', { payment: updatedPayment });

    return updatedPayment;
  }

  /**
   * Panel A approval (CDFC - Planning)
   * First approval in dual-approval workflow
   */
  async panelAApprove(
    id: string,
    approvalDto: ApprovePaymentDto,
    userId: string,
  ): Promise<PaymentVoucher> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PANEL_A_PENDING) {
      throw new BadRequestException('Payment not pending Panel A approval');
    }

    if (!approvalDto.approved) {
      // Rejection - release budget commitment
      await this.budgetService.releaseCommitment(
        payment.budgetAllocationId,
        payment.netAmount,
      );

      payment.status = PaymentStatus.PANEL_A_REJECTED;
      payment.rejectionReason = approvalDto.notes;
      payment.rejectedAt = new Date();
      payment.rejectedBy = userId;
    } else {
      // Approval
      payment.panelAApproved = true;
      payment.panelAApprovedBy = userId;
      payment.panelAApprovedAt = new Date();
      payment.panelANotes = approvalDto.notes;
      payment.status = PaymentStatus.PANEL_B_PENDING; // Move to Panel B
    }

    payment.updatedBy = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment ${approvalDto.approved ? 'approved' : 'rejected'} by Panel A: ${updatedPayment.voucherNumber}`,
    );

    // Emit event
    this.eventEmitter.emit('payment.panel_a_decision', {
      payment: updatedPayment,
      approved: approvalDto.approved,
    });

    return updatedPayment;
  }

  /**
   * Panel B approval (Local Authority - Execution)
   * Second approval in dual-approval workflow
   * CRITICAL: Can only approve if Panel A approved
   */
  async panelBApprove(
    id: string,
    approvalDto: ApprovePaymentDto,
    userId: string,
  ): Promise<PaymentVoucher> {
    const payment = await this.findOne(id);

    // CRITICAL SECURITY CHECK
    if (!payment.panelAApproved) {
      throw new BadRequestException('Panel A approval required before Panel B approval');
    }

    if (payment.status !== PaymentStatus.PANEL_B_PENDING) {
      throw new BadRequestException('Payment not pending Panel B approval');
    }

    if (!approvalDto.approved) {
      // Rejection - release budget commitment
      await this.budgetService.releaseCommitment(
        payment.budgetAllocationId,
        payment.netAmount,
      );

      payment.status = PaymentStatus.PANEL_B_REJECTED;
      payment.rejectionReason = approvalDto.notes;
      payment.rejectedAt = new Date();
      payment.rejectedBy = userId;
    } else {
      // Approval - both panels approved, ready for payment
      payment.panelBApproved = true;
      payment.panelBApprovedBy = userId;
      payment.panelBApprovedAt = new Date();
      payment.panelBNotes = approvalDto.notes;
      payment.status = PaymentStatus.PAYMENT_PENDING;
    }

    payment.updatedBy = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment ${approvalDto.approved ? 'approved' : 'rejected'} by Panel B: ${updatedPayment.voucherNumber}`,
    );

    // Emit event
    this.eventEmitter.emit('payment.panel_b_decision', {
      payment: updatedPayment,
      approved: approvalDto.approved,
    });

    return updatedPayment;
  }

  /**
   * Execute payment
   * CRITICAL: Can only execute if BOTH Panel A AND Panel B approved
   * UTILIZES budget when payment executed
   */
  async executePayment(
    id: string,
    executeDto: ExecutePaymentDto,
    userId: string,
  ): Promise<PaymentVoucher> {
    const payment = await this.findOne(id);

    // CRITICAL SECURITY CHECKS
    if (!payment.isFullyApproved) {
      throw new BadRequestException('Both Panel A and Panel B approvals required for payment execution');
    }

    if (payment.status !== PaymentStatus.PAYMENT_PENDING) {
      throw new BadRequestException('Payment not ready for execution');
    }

    // Utilize budget (move from committed to utilized)
    await this.budgetService.utilize(payment.budgetAllocationId, payment.netAmount);

    payment.paid = true;
    payment.paymentDate = new Date();
    payment.paymentReference = executeDto.paymentReference;
    payment.paymentReceiptUrl = executeDto.paymentReceiptUrl;
    payment.processedBy = userId;
    payment.status = PaymentStatus.PAID;
    payment.updatedBy = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment executed: ${updatedPayment.voucherNumber} - Amount: ${updatedPayment.netAmount} - Reference: ${executeDto.paymentReference}`,
    );

    // Emit event
    this.eventEmitter.emit('payment.executed', { payment: updatedPayment });

    return updatedPayment;
  }

  /**
   * Cancel payment voucher
   * Releases budget commitment if payment was submitted
   */
  async cancel(id: string, reason: string, userId: string): Promise<PaymentVoucher> {
    const payment = await this.findOne(id);

    if (payment.paid) {
      throw new BadRequestException('Cannot cancel paid vouchers');
    }

    // Release budget commitment if payment was submitted
    if (
      payment.status === PaymentStatus.PANEL_A_PENDING ||
      payment.status === PaymentStatus.PANEL_B_PENDING ||
      payment.status === PaymentStatus.PAYMENT_PENDING
    ) {
      await this.budgetService.releaseCommitment(
        payment.budgetAllocationId,
        payment.netAmount,
      );
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.rejectionReason = reason;
    payment.rejectedAt = new Date();
    payment.rejectedBy = userId;
    payment.updatedBy = userId;

    const updatedPayment = await this.paymentRepository.save(payment);

    this.logger.log(`Payment voucher cancelled: ${updatedPayment.voucherNumber}`);

    // Emit event
    this.eventEmitter.emit('payment.cancelled', { payment: updatedPayment });

    return updatedPayment;
  }

  /**
   * Find all payment vouchers
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: PaymentStatus;
    fiscalYear?: number;
  }): Promise<{
    payments: PaymentVoucher[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.project', 'project')
      .leftJoinAndSelect('payment.budgetAllocation', 'budgetAllocation')
      .leftJoinAndSelect('payment.panelAApprover', 'panelAApprover')
      .leftJoinAndSelect('payment.panelBApprover', 'panelBApprover')
      .leftJoinAndSelect('payment.processor', 'processor')
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params?.projectId) {
      queryBuilder.andWhere('payment.projectId = :projectId', {
        projectId: params.projectId,
      });
    }

    if (params?.status) {
      queryBuilder.andWhere('payment.status = :status', { status: params.status });
    }

    if (params?.fiscalYear) {
      queryBuilder.andWhere('payment.fiscalYear = :fiscalYear', {
        fiscalYear: params.fiscalYear,
      });
    }

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find payment by ID
   */
  async findOne(id: string): Promise<PaymentVoucher> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: [
        'project',
        'budgetAllocation',
        'payee',
        'panelAApprover',
        'panelBApprover',
        'processor',
        'rejector',
      ],
    });

    if (!payment) {
      throw new NotFoundException(`Payment voucher with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Get payment statistics
   */
  async getStatistics(projectId?: string, fiscalYear?: number): Promise<{
    total: number;
    totalAmount: number;
    paid: number;
    paidAmount: number;
    pending: number;
    pendingAmount: number;
    rejected: number;
    byStatus: Record<string, number>;
  }> {
    const queryBuilder = this.paymentRepository.createQueryBuilder('payment');

    if (projectId) {
      queryBuilder.where('payment.projectId = :projectId', { projectId });
    }

    if (fiscalYear) {
      queryBuilder.andWhere('payment.fiscalYear = :fiscalYear', { fiscalYear });
    }

    const payments = await queryBuilder.getMany();

    const total = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.netAmount), 0);
    const paid = payments.filter((p) => p.paid).length;
    const paidAmount = payments
      .filter((p) => p.paid)
      .reduce((sum, p) => sum + Number(p.netAmount), 0);
    const pending = payments.filter(
      (p) =>
        p.status === PaymentStatus.PANEL_A_PENDING ||
        p.status === PaymentStatus.PANEL_B_PENDING ||
        p.status === PaymentStatus.PAYMENT_PENDING,
    ).length;
    const pendingAmount = payments
      .filter(
        (p) =>
          p.status === PaymentStatus.PANEL_A_PENDING ||
          p.status === PaymentStatus.PANEL_B_PENDING ||
          p.status === PaymentStatus.PAYMENT_PENDING,
      )
      .reduce((sum, p) => sum + Number(p.netAmount), 0);
    const rejected = payments.filter(
      (p) =>
        p.status === PaymentStatus.PANEL_A_REJECTED ||
        p.status === PaymentStatus.PANEL_B_REJECTED,
    ).length;

    // By status
    const byStatus: Record<string, number> = {};
    payments.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    return {
      total,
      totalAmount,
      paid,
      paidAmount,
      pending,
      pendingAmount,
      rejected,
      byStatus,
    };
  }

  /**
   * Generate voucher number
   */
  private async generateVoucherNumber(fiscalYear: number): Promise<string> {
    const count = await this.paymentRepository.count({
      where: { fiscalYear },
    });

    const sequence = String(count + 1).padStart(6, '0');
    const yearShort = String(fiscalYear).substring(2);

    return `PV-${yearShort}-${sequence}`;
  }
}
