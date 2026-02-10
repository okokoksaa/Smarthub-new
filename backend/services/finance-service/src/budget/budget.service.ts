import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BudgetAllocation, BudgetStatus, Project } from '@shared/database';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

/**
 * Budget Service
 * Handles budget allocation and tracking
 */
@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @InjectRepository(BudgetAllocation)
    private readonly budgetRepository: Repository<BudgetAllocation>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create budget allocation
   */
  async create(createBudgetDto: CreateBudgetDto, userId: string): Promise<BudgetAllocation> {
    // Generate budget code
    const budgetCode = await this.generateBudgetCode(
      createBudgetDto.constituencyId,
      createBudgetDto.fiscalYear,
    );

    // Validate dates
    const effectiveDate = new Date(createBudgetDto.effectiveDate);
    const expiryDate = new Date(createBudgetDto.expiryDate);

    if (effectiveDate >= expiryDate) {
      throw new BadRequestException('Effective date must be before expiry date');
    }

    // If project-specific allocation, verify project exists
    if (createBudgetDto.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: createBudgetDto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check for duplicate allocation
      const existingAllocation = await this.budgetRepository.findOne({
        where: {
          projectId: createBudgetDto.projectId,
          fiscalYear: createBudgetDto.fiscalYear,
          status: BudgetStatus.ALLOCATED,
        },
      });

      if (existingAllocation) {
        throw new ConflictException(
          'Active budget allocation already exists for this project',
        );
      }
    }

    // Create budget allocation
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      budgetCode,
      status: BudgetStatus.DRAFT,
      amountUtilized: 0,
      amountCommitted: 0,
      amountAvailable: createBudgetDto.allocatedAmount,
      approved: false,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedBudget = await this.budgetRepository.save(budget);

    this.logger.log(`Budget allocation created: ${savedBudget.budgetCode}`);

    // Emit event
    this.eventEmitter.emit('budget.created', { budget: savedBudget });

    return savedBudget;
  }

  /**
   * Find all budget allocations
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    constituencyId?: string;
    projectId?: string;
    fiscalYear?: number;
    status?: BudgetStatus;
  }): Promise<{
    budgets: BudgetAllocation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.constituency', 'constituency')
      .leftJoinAndSelect('budget.project', 'project')
      .leftJoinAndSelect('budget.approver', 'approver')
      .orderBy('budget.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params?.constituencyId) {
      queryBuilder.andWhere('budget.constituencyId = :constituencyId', {
        constituencyId: params.constituencyId,
      });
    }

    if (params?.projectId) {
      queryBuilder.andWhere('budget.projectId = :projectId', {
        projectId: params.projectId,
      });
    }

    if (params?.fiscalYear) {
      queryBuilder.andWhere('budget.fiscalYear = :fiscalYear', {
        fiscalYear: params.fiscalYear,
      });
    }

    if (params?.status) {
      queryBuilder.andWhere('budget.status = :status', { status: params.status });
    }

    const [budgets, total] = await queryBuilder.getManyAndCount();

    return {
      budgets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find budget by ID
   */
  async findOne(id: string): Promise<BudgetAllocation> {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['constituency', 'project', 'approver'],
    });

    if (!budget) {
      throw new NotFoundException(`Budget allocation with ID ${id} not found`);
    }

    return budget;
  }

  /**
   * Find budget by constituency and fiscal year
   */
  async findByConstituencyAndYear(
    constituencyId: string,
    fiscalYear: number,
  ): Promise<BudgetAllocation> {
    const budget = await this.budgetRepository.findOne({
      where: { constituencyId, fiscalYear },
      relations: ['constituency', 'project', 'approver'],
    });

    if (!budget) {
      throw new NotFoundException(
        `Budget not found for constituency ${constituencyId} in fiscal year ${fiscalYear}`,
      );
    }

    return budget;
  }

  /**
   * Get utilization analytics for a constituency and year
   */
  async getUtilization(constituencyId: string, fiscalYear: number) {
    const budget = await this.findByConstituencyAndYear(constituencyId, fiscalYear);

    // Sum executed payments for this constituency/year via projects relation
    // Note: This is a simplified aggregation; refine as needed.
    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.constituency', 'constituency')
      .leftJoin('project.milestones', 'milestone')
      .where('project.constituencyId = :constituencyId', { constituencyId })
      .andWhere('project.fiscalYear = :fiscalYear', { fiscalYear })
      .select('COALESCE(SUM(project.amountDisbursed), 0)', 'totalDisbursed');

    const { totalDisbursed } = await qb.getRawOne<{ totalDisbursed: string }>();
    const disbursed = Number(totalDisbursed || 0);

    return {
      budget_id: budget.id,
      fiscal_year: budget.fiscalYear,
      total_allocation: Number(budget.allocatedAmount),
      disbursed_amount: disbursed,
      remaining: Number(budget.allocatedAmount) - disbursed,
    };
  }

  /**
   * Update budget allocation
   */
  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (budget.status === BudgetStatus.ALLOCATED || budget.status === BudgetStatus.EXHAUSTED) {
      throw new BadRequestException('Cannot update allocated or exhausted budgets');
    }

    Object.assign(budget, updateBudgetDto);
    budget.updatedBy = userId;

    // Recalculate available amount if allocated amount changed
    if (updateBudgetDto.allocatedAmount) {
      budget.amountAvailable =
        updateBudgetDto.allocatedAmount - budget.amountUtilized - budget.amountCommitted;
    }

    const updatedBudget = await this.budgetRepository.save(budget);

    this.logger.log(`Budget allocation updated: ${updatedBudget.budgetCode}`);

    this.eventEmitter.emit('budget.updated', { budget: updatedBudget });

    return updatedBudget;
  }

  /**
   * Approve budget allocation
   */
  async approve(id: string, notes: string, userId: string): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (budget.status !== BudgetStatus.SUBMITTED) {
      throw new BadRequestException('Only submitted budgets can be approved');
    }

    budget.status = BudgetStatus.APPROVED;
    budget.approved = true;
    budget.approvedBy = userId;
    budget.approvedAt = new Date();
    budget.approvalNotes = notes;
    budget.updatedBy = userId;

    const approvedBudget = await this.budgetRepository.save(budget);

    this.logger.log(`Budget allocation approved: ${approvedBudget.budgetCode}`);

    this.eventEmitter.emit('budget.approved', { budget: approvedBudget });

    return approvedBudget;
  }

  /**
   * Allocate budget (make it active)
   */
  async allocate(id: string, userId: string): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (budget.status !== BudgetStatus.APPROVED) {
      throw new BadRequestException('Only approved budgets can be allocated');
    }

    budget.status = BudgetStatus.ALLOCATED;
    budget.updatedBy = userId;

    // Update project budget if project-specific
    if (budget.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: budget.projectId },
      });

      if (project) {
        project.budgetAllocated = Number(budget.allocatedAmount);
        await this.projectRepository.save(project);
      }
    }

    const allocatedBudget = await this.budgetRepository.save(budget);

    this.logger.log(`Budget allocated: ${allocatedBudget.budgetCode}`);

    this.eventEmitter.emit('budget.allocated', { budget: allocatedBudget });

    return allocatedBudget;
  }

  /**
   * Commit budget (reserve for pending payment)
   */
  async commit(id: string, amount: number): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (budget.status !== BudgetStatus.ALLOCATED) {
      throw new BadRequestException('Can only commit from allocated budgets');
    }

    if (amount > budget.amountAvailable) {
      throw new BadRequestException(
        `Insufficient budget. Available: ${budget.amountAvailable}, Requested: ${amount}`,
      );
    }

    budget.amountCommitted = Number(budget.amountCommitted) + amount;
    budget.amountAvailable = Number(budget.amountAvailable) - amount;

    const updatedBudget = await this.budgetRepository.save(budget);

    this.logger.log(
      `Budget committed: ${updatedBudget.budgetCode} - Amount: ${amount}`,
    );

    return updatedBudget;
  }

  /**
   * Utilize budget (mark as spent)
   */
  async utilize(id: string, amount: number): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (budget.status !== BudgetStatus.ALLOCATED) {
      throw new BadRequestException('Can only utilize from allocated budgets');
    }

    // Move from committed to utilized
    budget.amountCommitted = Math.max(0, Number(budget.amountCommitted) - amount);
    budget.amountUtilized = Number(budget.amountUtilized) + amount;

    // Check if exhausted
    if (budget.amountAvailable <= 0 && budget.amountCommitted <= 0) {
      budget.status = BudgetStatus.EXHAUSTED;
    }

    const updatedBudget = await this.budgetRepository.save(budget);

    this.logger.log(
      `Budget utilized: ${updatedBudget.budgetCode} - Amount: ${amount}`,
    );

    // Update project amount disbursed if project-specific
    if (budget.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: budget.projectId },
      });

      if (project) {
        project.amountDisbursed = Number(project.amountDisbursed) + amount;
        await this.projectRepository.save(project);
      }
    }

    this.eventEmitter.emit('budget.utilized', { budget: updatedBudget, amount });

    return updatedBudget;
  }

  /**
   * Release committed budget (cancel commitment)
   */
  async releaseCommitment(id: string, amount: number): Promise<BudgetAllocation> {
    const budget = await this.findOne(id);

    if (amount > budget.amountCommitted) {
      throw new BadRequestException('Cannot release more than committed amount');
    }

    budget.amountCommitted = Number(budget.amountCommitted) - amount;
    budget.amountAvailable = Number(budget.amountAvailable) + amount;

    const updatedBudget = await this.budgetRepository.save(budget);

    this.logger.log(
      `Budget commitment released: ${updatedBudget.budgetCode} - Amount: ${amount}`,
    );

    return updatedBudget;
  }

  /**
   * Get budget statistics
   */
  async getStatistics(constituencyId?: string, fiscalYear?: number): Promise<{
    totalAllocated: number;
    totalUtilized: number;
    totalCommitted: number;
    totalAvailable: number;
    utilizationRate: number;
    byCategory: Record<string, {
      allocated: number;
      utilized: number;
      available: number;
    }>;
  }> {
    const queryBuilder = this.budgetRepository.createQueryBuilder('budget');

    if (constituencyId) {
      queryBuilder.where('budget.constituencyId = :constituencyId', { constituencyId });
    }

    if (fiscalYear) {
      queryBuilder.andWhere('budget.fiscalYear = :fiscalYear', { fiscalYear });
    }

    queryBuilder.andWhere('budget.status = :status', { status: BudgetStatus.ALLOCATED });

    const budgets = await queryBuilder.getMany();

    const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
    const totalUtilized = budgets.reduce((sum, b) => sum + Number(b.amountUtilized), 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.amountCommitted), 0);
    const totalAvailable = budgets.reduce((sum, b) => sum + Number(b.amountAvailable), 0);
    const utilizationRate = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

    // By category
    const byCategory: Record<string, any> = {};
    budgets.forEach((b) => {
      if (!byCategory[b.budgetCategory]) {
        byCategory[b.budgetCategory] = {
          allocated: 0,
          utilized: 0,
          available: 0,
        };
      }
      byCategory[b.budgetCategory].allocated += Number(b.allocatedAmount);
      byCategory[b.budgetCategory].utilized += Number(b.amountUtilized);
      byCategory[b.budgetCategory].available += Number(b.amountAvailable);
    });

    return {
      totalAllocated,
      totalUtilized,
      totalCommitted,
      totalAvailable,
      utilizationRate,
      byCategory,
    };
  }

  /**
   * Generate budget code
   */
  private async generateBudgetCode(constituencyId: string, fiscalYear: number): Promise<string> {
    const count = await this.budgetRepository.count({
      where: { constituencyId, fiscalYear },
    });

    const sequence = String(count + 1).padStart(4, '0');
    const constCode = constituencyId.substring(0, 8).toUpperCase();
    const yearShort = String(fiscalYear).substring(2);

    return `BUD-${constCode}-${yearShort}-${sequence}`;
  }
}
