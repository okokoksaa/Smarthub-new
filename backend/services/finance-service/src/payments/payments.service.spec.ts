import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { BudgetService } from '../budget/budget.service';
import {
  PaymentVoucher,
  PaymentStatus,
  PaymentType,
  PaymentMethod,
  BudgetAllocation,
  Project,
} from '@shared/database';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepository: Repository<PaymentVoucher>;
  let budgetRepository: Repository<BudgetAllocation>;
  let projectRepository: Repository<Project>;
  let budgetService: BudgetService;
  let eventEmitter: EventEmitter2;

  const mockPayment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    voucherNumber: 'PV-24-000001',
    paymentType: PaymentType.CONTRACTOR_PAYMENT,
    fiscalYear: 2024,
    projectId: 'project-001',
    budgetAllocationId: 'budget-001',
    payeeName: 'ABC Construction Ltd',
    payeeAccountNumber: '1234567890',
    payeeBankName: 'Zanaco',
    payeeBankBranch: 'Lusaka Main',
    amount: 50000,
    retentionPercentage: 10,
    retentionAmount: 5000,
    netAmount: 45000,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    description: 'Payment for foundation work',
    invoiceNumber: 'INV-2024-001',
    invoiceDate: new Date('2024-01-15'),
    supportingDocuments: [
      { url: 'https://storage.example.com/invoice.pdf', type: 'invoice', name: 'Invoice #001' },
    ],
    status: PaymentStatus.DRAFT,
    panelAApproved: false,
    panelBApproved: false,
    paid: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isFullyApproved: false,
  };

  const mockBudget = {
    id: 'budget-001',
    budgetCode: 'BUD-CONST001-24-0001',
    allocatedAmount: 1000000,
    amountAvailable: 1000000,
    amountCommitted: 0,
    amountUtilized: 0,
  };

  const mockProject = {
    id: 'project-001',
    projectCode: 'PROJ-001',
    name: 'Health Clinic Construction',
    amountDisbursed: 0,
  };

  const mockPaymentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
    })),
  };

  const mockBudgetRepository = {
    findOne: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockBudgetService = {
    commit: jest.fn(),
    utilize: jest.fn(),
    releaseCommitment: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentVoucher),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(BudgetAllocation),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: BudgetService,
          useValue: mockBudgetService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepository = module.get<Repository<PaymentVoucher>>(
      getRepositoryToken(PaymentVoucher),
    );
    budgetRepository = module.get<Repository<BudgetAllocation>>(
      getRepositoryToken(BudgetAllocation),
    );
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    budgetService = module.get<BudgetService>(BudgetService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPaymentDto = {
      paymentType: PaymentType.CONTRACTOR_PAYMENT,
      fiscalYear: 2024,
      projectId: 'project-001',
      budgetAllocationId: 'budget-001',
      payeeName: 'ABC Construction Ltd',
      payeeAccountNumber: '1234567890',
      payeeBankName: 'Zanaco',
      payeeBankBranch: 'Lusaka Main',
      amount: 50000,
      retentionPercentage: 10,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      description: 'Payment for foundation work',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: new Date('2024-01-15'),
      supportingDocuments: [
        { url: 'https://storage.example.com/invoice.pdf', type: 'invoice', name: 'Invoice #001' },
      ],
    };

    it('should create a new payment voucher successfully', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPaymentRepository.count.mockResolvedValue(0);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      const result = await service.create(createPaymentDto, 'user-id');

      expect(result).toEqual(mockPayment);
      expect(mockPaymentRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('payment.created', {
        payment: mockPayment,
      });
    });

    it('should calculate retention and net amount correctly', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPaymentRepository.count.mockResolvedValue(0);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await service.create(createPaymentDto, 'user-id');

      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.retentionAmount).toBe(5000); // 10% of 50000
      expect(createCall.netAmount).toBe(45000); // 50000 - 5000
    });

    it('should generate unique voucher number', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPaymentRepository.count.mockResolvedValue(5);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await service.create(createPaymentDto, 'user-id');

      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.voucherNumber).toMatch(/^PV-\d{2}-\d{6}$/);
    });

    it('should initialize payment with correct status and flags', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPaymentRepository.count.mockResolvedValue(0);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await service.create(createPaymentDto, 'user-id');

      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe(PaymentStatus.DRAFT);
      expect(createCall.panelAApproved).toBe(false);
      expect(createCall.panelBApproved).toBe(false);
      expect(createCall.paid).toBe(false);
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPaymentDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if project not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPaymentDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should add upload timestamps to supporting documents', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockPaymentRepository.count.mockResolvedValue(0);
      mockPaymentRepository.create.mockReturnValue(mockPayment);
      mockPaymentRepository.save.mockResolvedValue(mockPayment);

      await service.create(createPaymentDto, 'user-id');

      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.supportingDocuments[0].uploadedAt).toBeDefined();
    });
  });

  describe('submit', () => {
    it('should submit payment and commit budget', async () => {
      mockPaymentRepository.findOne.mockResolvedValue(mockPayment);
      mockBudgetService.commit.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PANEL_A_PENDING,
      });

      const result = await service.submit(mockPayment.id, 'user-id');

      expect(result.status).toBe(PaymentStatus.PANEL_A_PENDING);
      expect(budgetService.commit).toHaveBeenCalledWith(
        mockPayment.budgetAllocationId,
        mockPayment.netAmount,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('payment.submitted', {
        payment: expect.any(Object),
      });
    });

    it('should throw if payment not in DRAFT status', async () => {
      const submittedPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_A_PENDING,
      };
      mockPaymentRepository.findOne.mockResolvedValue(submittedPayment);

      await expect(service.submit(mockPayment.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should require supporting documents', async () => {
      const paymentWithoutDocs = {
        ...mockPayment,
        supportingDocuments: [],
      };
      mockPaymentRepository.findOne.mockResolvedValue(paymentWithoutDocs);

      await expect(service.submit(mockPayment.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('panelAApprove - CRITICAL DUAL APPROVAL WORKFLOW', () => {
    it('should approve payment by Panel A and move to Panel B', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_A_PENDING,
      };
      const approvedPayment = {
        ...pendingPayment,
        panelAApproved: true,
        status: PaymentStatus.PANEL_B_PENDING,
      };

      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);
      mockPaymentRepository.save.mockResolvedValue(approvedPayment);

      const result = await service.panelAApprove(
        mockPayment.id,
        { approved: true, notes: 'Approved by CDFC' },
        'panel-a-user',
      );

      expect(result.panelAApproved).toBe(true);
      expect(result.panelAApprovedBy).toBe('panel-a-user');
      expect(result.panelAApprovedAt).toBeDefined();
      expect(result.panelANotes).toBe('Approved by CDFC');
      expect(result.status).toBe(PaymentStatus.PANEL_B_PENDING);
      expect(eventEmitter.emit).toHaveBeenCalledWith('payment.panel_a_decision', {
        payment: approvedPayment,
        approved: true,
      });
    });

    it('should reject payment and release budget commitment', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_A_PENDING,
      };
      const rejectedPayment = {
        ...pendingPayment,
        status: PaymentStatus.PANEL_A_REJECTED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);
      mockBudgetService.releaseCommitment.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(rejectedPayment);

      const result = await service.panelAApprove(
        mockPayment.id,
        { approved: false, notes: 'Insufficient documentation' },
        'panel-a-user',
      );

      expect(result.status).toBe(PaymentStatus.PANEL_A_REJECTED);
      expect(result.rejectionReason).toBe('Insufficient documentation');
      expect(budgetService.releaseCommitment).toHaveBeenCalledWith(
        mockPayment.budgetAllocationId,
        mockPayment.netAmount,
      );
    });

    it('should throw if payment not pending Panel A approval', async () => {
      const draftPayment = { ...mockPayment, status: PaymentStatus.DRAFT };
      mockPaymentRepository.findOne.mockResolvedValue(draftPayment);

      await expect(
        service.panelAApprove(
          mockPayment.id,
          { approved: true, notes: 'Approved' },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('panelBApprove - CRITICAL DUAL APPROVAL WORKFLOW', () => {
    it('should approve payment by Panel B after Panel A approval', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_B_PENDING,
        panelAApproved: true,
        panelAApprovedBy: 'panel-a-user',
        panelAApprovedAt: new Date(),
      };
      const approvedPayment = {
        ...pendingPayment,
        panelBApproved: true,
        status: PaymentStatus.PAYMENT_PENDING,
      };

      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);
      mockPaymentRepository.save.mockResolvedValue(approvedPayment);

      const result = await service.panelBApprove(
        mockPayment.id,
        { approved: true, notes: 'Approved by Local Authority' },
        'panel-b-user',
      );

      expect(result.panelBApproved).toBe(true);
      expect(result.panelBApprovedBy).toBe('panel-b-user');
      expect(result.panelBApprovedAt).toBeDefined();
      expect(result.panelBNotes).toBe('Approved by Local Authority');
      expect(result.status).toBe(PaymentStatus.PAYMENT_PENDING);
    });

    it('should PREVENT Panel B approval without Panel A approval - CRITICAL', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_B_PENDING,
        panelAApproved: false, // CRITICAL: Panel A not approved
      };

      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);

      await expect(
        service.panelBApprove(
          mockPayment.id,
          { approved: true, notes: 'Trying to bypass Panel A' },
          'panel-b-user',
        ),
      ).rejects.toThrow('Panel A approval required before Panel B approval');

      expect(budgetService.utilize).not.toHaveBeenCalled();
    });

    it('should reject payment and release budget commitment', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_B_PENDING,
        panelAApproved: true,
      };
      const rejectedPayment = {
        ...pendingPayment,
        status: PaymentStatus.PANEL_B_REJECTED,
      };

      mockPaymentRepository.findOne.mockResolvedValue(pendingPayment);
      mockBudgetService.releaseCommitment.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(rejectedPayment);

      const result = await service.panelBApprove(
        mockPayment.id,
        { approved: false, notes: 'Work not completed' },
        'panel-b-user',
      );

      expect(result.status).toBe(PaymentStatus.PANEL_B_REJECTED);
      expect(budgetService.releaseCommitment).toHaveBeenCalledWith(
        mockPayment.budgetAllocationId,
        mockPayment.netAmount,
      );
    });

    it('should throw if payment not pending Panel B approval', async () => {
      const draftPayment = { ...mockPayment, status: PaymentStatus.DRAFT };
      mockPaymentRepository.findOne.mockResolvedValue(draftPayment);

      await expect(
        service.panelBApprove(
          mockPayment.id,
          { approved: true, notes: 'Approved' },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('executePayment - CRITICAL PAYMENT EXECUTION', () => {
    it('should execute payment after both approvals and utilize budget', async () => {
      const readyPayment = {
        ...mockPayment,
        status: PaymentStatus.PAYMENT_PENDING,
        panelAApproved: true,
        panelBApproved: true,
        isFullyApproved: true,
      };
      const paidPayment = {
        ...readyPayment,
        paid: true,
        status: PaymentStatus.PAID,
      };

      mockPaymentRepository.findOne.mockResolvedValue(readyPayment);
      mockBudgetService.utilize.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(paidPayment);

      const result = await service.executePayment(
        mockPayment.id,
        {
          paymentReference: 'TXN-2024-001234',
          paymentReceiptUrl: 'https://storage.example.com/receipt.pdf',
        },
        'processor-user',
      );

      expect(result.paid).toBe(true);
      expect(result.paymentDate).toBeDefined();
      expect(result.paymentReference).toBe('TXN-2024-001234');
      expect(result.paymentReceiptUrl).toBe('https://storage.example.com/receipt.pdf');
      expect(result.processedBy).toBe('processor-user');
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(budgetService.utilize).toHaveBeenCalledWith(
        mockPayment.budgetAllocationId,
        mockPayment.netAmount,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('payment.executed', {
        payment: paidPayment,
      });
    });

    it('should PREVENT execution without Panel A approval - CRITICAL', async () => {
      const payment = {
        ...mockPayment,
        status: PaymentStatus.PAYMENT_PENDING,
        panelAApproved: false, // CRITICAL: Panel A not approved
        panelBApproved: true,
        isFullyApproved: false,
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(
        service.executePayment(
          mockPayment.id,
          {
            paymentReference: 'TXN-2024-001234',
            paymentReceiptUrl: 'https://storage.example.com/receipt.pdf',
          },
          'processor-user',
        ),
      ).rejects.toThrow('Both Panel A and Panel B approvals required for payment execution');

      expect(budgetService.utilize).not.toHaveBeenCalled();
    });

    it('should PREVENT execution without Panel B approval - CRITICAL', async () => {
      const payment = {
        ...mockPayment,
        status: PaymentStatus.PAYMENT_PENDING,
        panelAApproved: true,
        panelBApproved: false, // CRITICAL: Panel B not approved
        isFullyApproved: false,
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(
        service.executePayment(
          mockPayment.id,
          {
            paymentReference: 'TXN-2024-001234',
            paymentReceiptUrl: 'https://storage.example.com/receipt.pdf',
          },
          'processor-user',
        ),
      ).rejects.toThrow('Both Panel A and Panel B approvals required for payment execution');

      expect(budgetService.utilize).not.toHaveBeenCalled();
    });

    it('should PREVENT execution without BOTH approvals - CRITICAL', async () => {
      const payment = {
        ...mockPayment,
        status: PaymentStatus.PAYMENT_PENDING,
        panelAApproved: false,
        panelBApproved: false,
        isFullyApproved: false,
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(
        service.executePayment(
          mockPayment.id,
          {
            paymentReference: 'TXN-2024-001234',
            paymentReceiptUrl: 'https://storage.example.com/receipt.pdf',
          },
          'processor-user',
        ),
      ).rejects.toThrow('Both Panel A and Panel B approvals required for payment execution');

      expect(budgetService.utilize).not.toHaveBeenCalled();
    });

    it('should throw if payment not ready for execution', async () => {
      const draftPayment = {
        ...mockPayment,
        status: PaymentStatus.DRAFT,
        isFullyApproved: false,
      };
      mockPaymentRepository.findOne.mockResolvedValue(draftPayment);

      await expect(
        service.executePayment(
          mockPayment.id,
          { paymentReference: 'TXN-001', paymentReceiptUrl: 'url' },
          'user-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel draft payment without releasing budget', async () => {
      const draftPayment = { ...mockPayment, status: PaymentStatus.DRAFT };
      const cancelledPayment = { ...draftPayment, status: PaymentStatus.CANCELLED };

      mockPaymentRepository.findOne.mockResolvedValue(draftPayment);
      mockPaymentRepository.save.mockResolvedValue(cancelledPayment);

      const result = await service.cancel(
        mockPayment.id,
        'No longer required',
        'user-id',
      );

      expect(result.status).toBe(PaymentStatus.CANCELLED);
      expect(result.rejectionReason).toBe('No longer required');
      expect(budgetService.releaseCommitment).not.toHaveBeenCalled();
    });

    it('should cancel submitted payment and release budget commitment', async () => {
      const submittedPayment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_A_PENDING,
      };
      const cancelledPayment = { ...submittedPayment, status: PaymentStatus.CANCELLED };

      mockPaymentRepository.findOne.mockResolvedValue(submittedPayment);
      mockBudgetService.releaseCommitment.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(cancelledPayment);

      const result = await service.cancel(
        mockPayment.id,
        'Project cancelled',
        'user-id',
      );

      expect(result.status).toBe(PaymentStatus.CANCELLED);
      expect(budgetService.releaseCommitment).toHaveBeenCalledWith(
        mockPayment.budgetAllocationId,
        mockPayment.netAmount,
      );
    });

    it('should prevent cancellation of paid vouchers', async () => {
      const paidPayment = { ...mockPayment, paid: true };
      mockPaymentRepository.findOne.mockResolvedValue(paidPayment);

      await expect(
        service.cancel(mockPayment.id, 'Cancellation reason', 'user-id'),
      ).rejects.toThrow('Cannot cancel paid vouchers');
    });
  });

  describe('findAll', () => {
    it('should return paginated payment vouchers', async () => {
      const mockPayments = [mockPayment];
      const queryBuilder = mockPaymentRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockPayments, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        payments: mockPayments,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter by project', async () => {
      const queryBuilder = mockPaymentRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ projectId: 'project-001' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.projectId = :projectId',
        { projectId: 'project-001' },
      );
    });

    it('should filter by status', async () => {
      const queryBuilder = mockPaymentRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: PaymentStatus.PAID });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.status = :status',
        { status: PaymentStatus.PAID },
      );
    });

    it('should filter by fiscal year', async () => {
      const queryBuilder = mockPaymentRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ fiscalYear: 2024 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'payment.fiscalYear = :fiscalYear',
        { fiscalYear: 2024 },
      );
    });
  });

  describe('getStatistics', () => {
    it('should return payment statistics', async () => {
      const payments = [
        { ...mockPayment, paid: true, netAmount: 45000, status: PaymentStatus.PAID },
        {
          ...mockPayment,
          paid: false,
          netAmount: 30000,
          status: PaymentStatus.PANEL_A_PENDING,
        },
        {
          ...mockPayment,
          paid: false,
          netAmount: 20000,
          status: PaymentStatus.PANEL_A_REJECTED,
        },
      ];

      const queryBuilder = mockPaymentRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(payments);

      const result = await service.getStatistics();

      expect(result.total).toBe(3);
      expect(result.totalAmount).toBe(95000);
      expect(result.paid).toBe(1);
      expect(result.paidAmount).toBe(45000);
      expect(result.pending).toBe(1);
      expect(result.pendingAmount).toBe(30000);
      expect(result.rejected).toBe(1);
    });
  });

  describe('complete dual-approval workflow - INTEGRATION TEST', () => {
    it('should enforce complete workflow: submit → Panel A → Panel B → execute', async () => {
      // 1. Create payment (DRAFT)
      let payment = { ...mockPayment, status: PaymentStatus.DRAFT };
      mockPaymentRepository.findOne.mockResolvedValue(payment);

      // 2. Submit (PANEL_A_PENDING) - commits budget
      payment = { ...payment, status: PaymentStatus.PANEL_A_PENDING };
      mockBudgetService.commit.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(payment);
      await service.submit(payment.id, 'user-id');
      expect(budgetService.commit).toHaveBeenCalled();

      // 3. Panel A approval (PANEL_B_PENDING)
      mockPaymentRepository.findOne.mockResolvedValue(payment);
      payment = {
        ...payment,
        panelAApproved: true,
        status: PaymentStatus.PANEL_B_PENDING,
      };
      mockPaymentRepository.save.mockResolvedValue(payment);
      await service.panelAApprove(
        payment.id,
        { approved: true, notes: 'Panel A approved' },
        'panel-a-user',
      );

      // 4. Panel B approval (PAYMENT_PENDING)
      mockPaymentRepository.findOne.mockResolvedValue(payment);
      payment = {
        ...payment,
        panelBApproved: true,
        status: PaymentStatus.PAYMENT_PENDING,
        isFullyApproved: true,
      };
      mockPaymentRepository.save.mockResolvedValue(payment);
      await service.panelBApprove(
        payment.id,
        { approved: true, notes: 'Panel B approved' },
        'panel-b-user',
      );

      // 5. Execute payment (PAID) - utilizes budget
      mockPaymentRepository.findOne.mockResolvedValue(payment);
      payment = { ...payment, paid: true, status: PaymentStatus.PAID };
      mockBudgetService.utilize.mockResolvedValue(mockBudget);
      mockPaymentRepository.save.mockResolvedValue(payment);
      await service.executePayment(
        payment.id,
        { paymentReference: 'TXN-001', paymentReceiptUrl: 'url' },
        'processor-user',
      );

      expect(payment.panelAApproved).toBe(true);
      expect(payment.panelBApproved).toBe(true);
      expect(payment.paid).toBe(true);
      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(budgetService.utilize).toHaveBeenCalled();
    });

    it('should enforce approval order: Panel A MUST come before Panel B', async () => {
      // Try to approve Panel B without Panel A approval
      const payment = {
        ...mockPayment,
        status: PaymentStatus.PANEL_B_PENDING,
        panelAApproved: false, // Panel A not approved
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(
        service.panelBApprove(
          payment.id,
          { approved: true, notes: 'Bypassing Panel A' },
          'panel-b-user',
        ),
      ).rejects.toThrow('Panel A approval required before Panel B approval');
    });

    it('should enforce both approvals for payment execution', async () => {
      // Try to execute without both approvals
      const payment = {
        ...mockPayment,
        status: PaymentStatus.PAYMENT_PENDING,
        panelAApproved: true,
        panelBApproved: false, // Panel B not approved
        isFullyApproved: false,
      };

      mockPaymentRepository.findOne.mockResolvedValue(payment);

      await expect(
        service.executePayment(
          payment.id,
          { paymentReference: 'TXN-001', paymentReceiptUrl: 'url' },
          'processor-user',
        ),
      ).rejects.toThrow('Both Panel A and Panel B approvals required for payment execution');
    });
  });
});
