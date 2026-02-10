import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import {
  BudgetAllocation,
  BudgetStatus,
  BudgetCategory,
  Project,
} from '@shared/database';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetRepository: Repository<BudgetAllocation>;
  let projectRepository: Repository<Project>;
  let eventEmitter: EventEmitter2;

  const mockBudget = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    budgetCode: 'BUD-CONST001-24-0001',
    fiscalYear: 2024,
    budgetCategory: BudgetCategory.CAPITAL_PROJECTS,
    constituencyId: 'const-001',
    projectId: 'project-001',
    allocatedAmount: 1000000,
    amountUtilized: 0,
    amountCommitted: 0,
    amountAvailable: 1000000,
    status: BudgetStatus.DRAFT,
    approved: false,
    effectiveDate: new Date('2024-01-01'),
    expiryDate: new Date('2024-12-31'),
    description: 'FY2024 Capital Projects Budget',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'project-001',
    projectCode: 'PROJ-001',
    name: 'Health Clinic Construction',
    budgetAllocated: 0,
    amountDisbursed: 0,
  };

  const mockBudgetRepository = {
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

  const mockProjectRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getRepositoryToken(BudgetAllocation),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    budgetRepository = module.get<Repository<BudgetAllocation>>(
      getRepositoryToken(BudgetAllocation),
    );
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createBudgetDto = {
      fiscalYear: 2024,
      budgetCategory: BudgetCategory.CAPITAL_PROJECTS,
      constituencyId: 'const-001',
      projectId: 'project-001',
      allocatedAmount: 1000000,
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      description: 'FY2024 Capital Projects Budget',
    };

    it('should create a new budget allocation successfully', async () => {
      mockBudgetRepository.count.mockResolvedValue(0);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.findOne.mockResolvedValue(null);
      mockBudgetRepository.create.mockReturnValue(mockBudget);
      mockBudgetRepository.save.mockResolvedValue(mockBudget);

      const result = await service.create(createBudgetDto, 'user-id');

      expect(result).toEqual(mockBudget);
      expect(mockBudgetRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.created', {
        budget: mockBudget,
      });
    });

    it('should generate unique budget code', async () => {
      mockBudgetRepository.count.mockResolvedValue(5);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.findOne.mockResolvedValue(null);
      mockBudgetRepository.create.mockReturnValue(mockBudget);
      mockBudgetRepository.save.mockResolvedValue(mockBudget);

      await service.create(createBudgetDto, 'user-id');

      const createCall = mockBudgetRepository.create.mock.calls[0][0];
      expect(createCall.budgetCode).toMatch(/^BUD-[A-Z0-9]+-\d{2}-\d{4}$/);
    });

    it('should initialize budget with correct status and amounts', async () => {
      mockBudgetRepository.count.mockResolvedValue(0);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.findOne.mockResolvedValue(null);
      mockBudgetRepository.create.mockReturnValue(mockBudget);
      mockBudgetRepository.save.mockResolvedValue(mockBudget);

      await service.create(createBudgetDto, 'user-id');

      const createCall = mockBudgetRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe(BudgetStatus.DRAFT);
      expect(createCall.amountUtilized).toBe(0);
      expect(createCall.amountCommitted).toBe(0);
      expect(createCall.amountAvailable).toBe(createBudgetDto.allocatedAmount);
      expect(createCall.approved).toBe(false);
    });

    it('should validate effective date before expiry date', async () => {
      const invalidDto = {
        ...createBudgetDto,
        effectiveDate: new Date('2024-12-31'),
        expiryDate: new Date('2024-01-01'),
      };

      await expect(service.create(invalidDto, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createBudgetDto, 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent duplicate allocation for same project', async () => {
      const existingBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.findOne.mockResolvedValue(existingBudget);

      await expect(service.create(createBudgetDto, 'user-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated budget allocations', async () => {
      const mockBudgets = [mockBudget];
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockBudgets, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        budgets: mockBudgets,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter by constituency', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ constituencyId: 'const-001' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'budget.constituencyId = :constituencyId',
        { constituencyId: 'const-001' },
      );
    });

    it('should filter by project', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ projectId: 'project-001' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'budget.projectId = :projectId',
        { projectId: 'project-001' },
      );
    });

    it('should filter by fiscal year', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ fiscalYear: 2024 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'budget.fiscalYear = :fiscalYear',
        { fiscalYear: 2024 },
      );
    });

    it('should filter by status', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: BudgetStatus.ALLOCATED });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'budget.status = :status',
        { status: BudgetStatus.ALLOCATED },
      );
    });
  });

  describe('findOne', () => {
    it('should return budget by id', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      const result = await service.findOne(mockBudget.id);

      expect(result).toEqual(mockBudget);
      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
        relations: ['constituency', 'project', 'approver'],
      });
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      allocatedAmount: 1500000,
      description: 'Updated budget allocation',
    };

    it('should update budget successfully', async () => {
      const updatedBudget = { ...mockBudget, ...updateDto };
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockBudgetRepository.save.mockResolvedValue(updatedBudget);

      const result = await service.update(mockBudget.id, updateDto, 'user-id');

      expect(result.allocatedAmount).toBe(updateDto.allocatedAmount);
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.updated', {
        budget: updatedBudget,
      });
    });

    it('should recalculate available amount when allocated amount changes', async () => {
      const budget = {
        ...mockBudget,
        amountUtilized: 200000,
        amountCommitted: 100000,
      };
      mockBudgetRepository.findOne.mockResolvedValue(budget);
      mockBudgetRepository.save.mockResolvedValue(budget);

      await service.update(mockBudget.id, { allocatedAmount: 1500000 }, 'user-id');

      const saveCall = mockBudgetRepository.save.mock.calls[0][0];
      expect(saveCall.amountAvailable).toBe(1200000); // 1500000 - 200000 - 100000
    });

    it('should prevent updating allocated budgets', async () => {
      const allocatedBudget = { ...mockBudget, status: BudgetStatus.ALLOCATED };
      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);

      await expect(
        service.update(mockBudget.id, updateDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent updating exhausted budgets', async () => {
      const exhaustedBudget = { ...mockBudget, status: BudgetStatus.EXHAUSTED };
      mockBudgetRepository.findOne.mockResolvedValue(exhaustedBudget);

      await expect(
        service.update(mockBudget.id, updateDto, 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    it('should approve submitted budget', async () => {
      const submittedBudget = { ...mockBudget, status: BudgetStatus.SUBMITTED };
      const approvedBudget = {
        ...submittedBudget,
        status: BudgetStatus.APPROVED,
        approved: true,
      };

      mockBudgetRepository.findOne.mockResolvedValue(submittedBudget);
      mockBudgetRepository.save.mockResolvedValue(approvedBudget);

      const result = await service.approve(
        mockBudget.id,
        'Budget approved',
        'user-id',
      );

      expect(result.status).toBe(BudgetStatus.APPROVED);
      expect(result.approved).toBe(true);
      expect(result.approvedBy).toBe('user-id');
      expect(result.approvedAt).toBeDefined();
      expect(result.approvalNotes).toBe('Budget approved');
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.approved', {
        budget: approvedBudget,
      });
    });

    it('should throw if budget not submitted', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      await expect(
        service.approve(mockBudget.id, 'Approval notes', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('allocate', () => {
    it('should allocate approved budget', async () => {
      const approvedBudget = { ...mockBudget, status: BudgetStatus.APPROVED };
      const allocatedBudget = { ...approvedBudget, status: BudgetStatus.ALLOCATED };

      mockBudgetRepository.findOne.mockResolvedValue(approvedBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.save.mockResolvedValue(allocatedBudget);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.allocate(mockBudget.id, 'user-id');

      expect(result.status).toBe(BudgetStatus.ALLOCATED);
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.allocated', {
        budget: allocatedBudget,
      });
    });

    it('should update project budget when allocating', async () => {
      const approvedBudget = { ...mockBudget, status: BudgetStatus.APPROVED };

      mockBudgetRepository.findOne.mockResolvedValue(approvedBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockBudgetRepository.save.mockResolvedValue(approvedBudget);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.allocate(mockBudget.id, 'user-id');

      const projectSaveCall = mockProjectRepository.save.mock.calls[0][0];
      expect(projectSaveCall.budgetAllocated).toBe(mockBudget.allocatedAmount);
    });

    it('should throw if budget not approved', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      await expect(service.allocate(mockBudget.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('commit', () => {
    it('should commit budget successfully', async () => {
      const allocatedBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountAvailable: 1000000,
        amountCommitted: 0,
      };
      const committedBudget = {
        ...allocatedBudget,
        amountCommitted: 50000,
        amountAvailable: 950000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);
      mockBudgetRepository.save.mockResolvedValue(committedBudget);

      const result = await service.commit(mockBudget.id, 50000);

      expect(result.amountCommitted).toBe(50000);
      expect(result.amountAvailable).toBe(950000);
    });

    it('should throw if insufficient budget available', async () => {
      const allocatedBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountAvailable: 10000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);

      await expect(service.commit(mockBudget.id, 50000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if budget not allocated', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      await expect(service.commit(mockBudget.id, 50000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('utilize', () => {
    it('should utilize budget and update project', async () => {
      const allocatedBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountCommitted: 50000,
        amountUtilized: 0,
      };
      const utilizedBudget = {
        ...allocatedBudget,
        amountCommitted: 0,
        amountUtilized: 50000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);
      mockBudgetRepository.save.mockResolvedValue(utilizedBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.utilize(mockBudget.id, 50000);

      expect(result.amountCommitted).toBe(0);
      expect(result.amountUtilized).toBe(50000);
      expect(eventEmitter.emit).toHaveBeenCalledWith('budget.utilized', {
        budget: utilizedBudget,
        amount: 50000,
      });
    });

    it('should update project amountDisbursed', async () => {
      const allocatedBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountCommitted: 50000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);
      mockBudgetRepository.save.mockResolvedValue(allocatedBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.utilize(mockBudget.id, 50000);

      const projectSaveCall = mockProjectRepository.save.mock.calls[0][0];
      expect(projectSaveCall.amountDisbursed).toBe(50000);
    });

    it('should mark budget as exhausted when fully utilized', async () => {
      const allocatedBudget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountAvailable: 0,
        amountCommitted: 50000,
      };
      const exhaustedBudget = {
        ...allocatedBudget,
        amountCommitted: 0,
        amountUtilized: 1000000,
        status: BudgetStatus.EXHAUSTED,
      };

      mockBudgetRepository.findOne.mockResolvedValue(allocatedBudget);
      mockBudgetRepository.save.mockResolvedValue(exhaustedBudget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.utilize(mockBudget.id, 50000);

      expect(result.status).toBe(BudgetStatus.EXHAUSTED);
    });
  });

  describe('releaseCommitment', () => {
    it('should release committed budget', async () => {
      const budget = {
        ...mockBudget,
        status: BudgetStatus.ALLOCATED,
        amountCommitted: 50000,
        amountAvailable: 950000,
      };
      const releasedBudget = {
        ...budget,
        amountCommitted: 0,
        amountAvailable: 1000000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(budget);
      mockBudgetRepository.save.mockResolvedValue(releasedBudget);

      const result = await service.releaseCommitment(mockBudget.id, 50000);

      expect(result.amountCommitted).toBe(0);
      expect(result.amountAvailable).toBe(1000000);
    });

    it('should throw if releasing more than committed', async () => {
      const budget = {
        ...mockBudget,
        amountCommitted: 10000,
      };

      mockBudgetRepository.findOne.mockResolvedValue(budget);

      await expect(service.releaseCommitment(mockBudget.id, 50000)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return budget statistics', async () => {
      const budgets = [
        {
          ...mockBudget,
          status: BudgetStatus.ALLOCATED,
          allocatedAmount: 1000000,
          amountUtilized: 300000,
          amountCommitted: 200000,
          amountAvailable: 500000,
          budgetCategory: BudgetCategory.CAPITAL_PROJECTS,
        },
        {
          ...mockBudget,
          status: BudgetStatus.ALLOCATED,
          allocatedAmount: 500000,
          amountUtilized: 100000,
          amountCommitted: 50000,
          amountAvailable: 350000,
          budgetCategory: BudgetCategory.RECURRENT_EXPENSES,
        },
      ];

      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(budgets);

      const result = await service.getStatistics();

      expect(result.totalAllocated).toBe(1500000);
      expect(result.totalUtilized).toBe(400000);
      expect(result.totalCommitted).toBe(250000);
      expect(result.totalAvailable).toBe(850000);
      expect(result.utilizationRate).toBeCloseTo(26.67, 1);
      expect(result.byCategory).toBeDefined();
    });

    it('should filter by constituency', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getStatistics('const-001');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'budget.constituencyId = :constituencyId',
        { constituencyId: 'const-001' },
      );
    });

    it('should filter by fiscal year', async () => {
      const queryBuilder = mockBudgetRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getStatistics(undefined, 2024);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'budget.fiscalYear = :fiscalYear',
        { fiscalYear: 2024 },
      );
    });
  });

  describe('budget lifecycle', () => {
    it('should follow complete budget workflow', async () => {
      // 1. Create (DRAFT)
      let budget = { ...mockBudget, status: BudgetStatus.DRAFT };
      mockBudgetRepository.findOne.mockResolvedValue(budget);

      // 2. Approve (APPROVED)
      budget = { ...budget, status: BudgetStatus.SUBMITTED };
      mockBudgetRepository.findOne.mockResolvedValue(budget);
      budget = { ...budget, status: BudgetStatus.APPROVED, approved: true };
      mockBudgetRepository.save.mockResolvedValue(budget);
      await service.approve(budget.id, 'Approved', 'user-id');

      // 3. Allocate (ALLOCATED)
      mockBudgetRepository.findOne.mockResolvedValue(budget);
      budget = { ...budget, status: BudgetStatus.ALLOCATED };
      mockBudgetRepository.save.mockResolvedValue(budget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);
      await service.allocate(budget.id, 'user-id');

      // 4. Commit
      mockBudgetRepository.findOne.mockResolvedValue(budget);
      budget = { ...budget, amountCommitted: 50000, amountAvailable: 950000 };
      mockBudgetRepository.save.mockResolvedValue(budget);
      await service.commit(budget.id, 50000);

      // 5. Utilize
      mockBudgetRepository.findOne.mockResolvedValue(budget);
      budget = { ...budget, amountCommitted: 0, amountUtilized: 50000 };
      mockBudgetRepository.save.mockResolvedValue(budget);
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);
      await service.utilize(budget.id, 50000);

      expect(budget.status).toBe(BudgetStatus.ALLOCATED);
      expect(budget.amountUtilized).toBe(50000);
    });
  });
});
