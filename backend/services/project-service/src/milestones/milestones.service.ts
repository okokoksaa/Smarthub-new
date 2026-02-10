import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Milestone, MilestoneStatus, Project } from '@shared/database';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { CompleteMilestoneDto, VerifyMilestoneDto } from './dto/complete-milestone.dto';

/**
 * Milestones Service
 * Handles project milestone management and tracking
 */
@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  constructor(
    @InjectRepository(Milestone)
    private readonly milestoneRepository: Repository<Milestone>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new milestone
   */
  async create(createMilestoneDto: CreateMilestoneDto, userId: string): Promise<Milestone> {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: createMilestoneDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if sequence number is unique for this project
    const existingMilestone = await this.milestoneRepository.findOne({
      where: {
        projectId: createMilestoneDto.projectId,
        sequenceNumber: createMilestoneDto.sequenceNumber,
      },
    });

    if (existingMilestone) {
      throw new BadRequestException(
        `Milestone with sequence number ${createMilestoneDto.sequenceNumber} already exists`,
      );
    }

    // Validate percentage weight
    const totalWeight = await this.getTotalPercentageWeight(createMilestoneDto.projectId);
    if (totalWeight + createMilestoneDto.percentageWeight > 100) {
      throw new BadRequestException(
        `Total percentage weight would exceed 100%. Current: ${totalWeight}%, Adding: ${createMilestoneDto.percentageWeight}%`,
      );
    }

    // Create milestone
    const milestone = this.milestoneRepository.create({
      ...createMilestoneDto,
      status: MilestoneStatus.PENDING,
      isCompleted: false,
      isDelayed: false,
      actualCost: 0,
      verified: false,
      createdBy: userId,
      updatedBy: userId,
    });

    const savedMilestone = await this.milestoneRepository.save(milestone);

    this.logger.log(
      `Milestone created: ${savedMilestone.title} (Project: ${savedMilestone.projectId})`,
    );

    // Emit event
    this.eventEmitter.emit('milestone.created', { milestone: savedMilestone });

    return savedMilestone;
  }

  /**
   * Find all milestones for a project
   */
  async findByProject(projectId: string): Promise<Milestone[]> {
    const milestones = await this.milestoneRepository.find({
      where: { projectId },
      order: { sequenceNumber: 'ASC' },
      relations: ['verifier'],
    });

    // Update delayed status
    const now = new Date();
    for (const milestone of milestones) {
      if (!milestone.isCompleted && milestone.dueDate < now) {
        milestone.isDelayed = true;
        await this.milestoneRepository.save(milestone);
      }
    }

    return milestones;
  }

  /**
   * Find milestone by ID
   */
  async findOne(id: string): Promise<Milestone> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id },
      relations: ['project', 'verifier'],
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return milestone;
  }

  /**
   * Update milestone
   */
  async update(
    id: string,
    updateMilestoneDto: UpdateMilestoneDto,
    userId: string,
  ): Promise<Milestone> {
    const milestone = await this.findOne(id);

    if (milestone.isCompleted) {
      throw new BadRequestException('Cannot update completed milestones');
    }

    // If updating percentage weight, validate total
    if (updateMilestoneDto.percentageWeight !== undefined) {
      const currentWeight = await this.getTotalPercentageWeight(milestone.projectId);
      const weightDifference = updateMilestoneDto.percentageWeight - milestone.percentageWeight;

      if (currentWeight + weightDifference > 100) {
        throw new BadRequestException(
          `Total percentage weight would exceed 100%. Current: ${currentWeight}%, Change: ${weightDifference}%`,
        );
      }
    }

    // Update milestone
    Object.assign(milestone, updateMilestoneDto);
    milestone.updatedBy = userId;

    const updatedMilestone = await this.milestoneRepository.save(milestone);

    this.logger.log(`Milestone updated: ${updatedMilestone.title} (${updatedMilestone.id})`);

    // Emit event
    this.eventEmitter.emit('milestone.updated', { milestone: updatedMilestone });

    return updatedMilestone;
  }

  /**
   * Delete milestone
   */
  async remove(id: string): Promise<void> {
    const milestone = await this.findOne(id);

    if (milestone.isCompleted) {
      throw new BadRequestException('Cannot delete completed milestones');
    }

    await this.milestoneRepository.remove(milestone);

    this.logger.log(`Milestone deleted: ${milestone.title} (${milestone.id})`);

    // Emit event
    this.eventEmitter.emit('milestone.deleted', { milestone });
  }

  /**
   * Start milestone
   */
  async start(id: string, userId: string): Promise<Milestone> {
    const milestone = await this.findOne(id);

    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Only pending milestones can be started');
    }

    milestone.status = MilestoneStatus.IN_PROGRESS;
    milestone.updatedBy = userId;

    const updatedMilestone = await this.milestoneRepository.save(milestone);

    this.logger.log(`Milestone started: ${updatedMilestone.title}`);

    // Emit event
    this.eventEmitter.emit('milestone.started', { milestone: updatedMilestone });

    return updatedMilestone;
  }

  /**
   * Complete milestone
   */
  async complete(
    id: string,
    completeDto: CompleteMilestoneDto,
    userId: string,
  ): Promise<Milestone> {
    const milestone = await this.findOne(id);

    if (milestone.isCompleted) {
      throw new BadRequestException('Milestone is already completed');
    }

    milestone.status = MilestoneStatus.COMPLETED;
    milestone.isCompleted = true;
    milestone.completionDate = new Date(completeDto.completionDate);

    if (completeDto.actualCost !== undefined) {
      milestone.actualCost = completeDto.actualCost;
    }

    if (completeDto.evidenceDocuments) {
      milestone.evidenceDocuments = completeDto.evidenceDocuments.map((doc) => ({
        ...doc,
        uploadedAt: new Date(),
      }));
    }

    if (completeDto.notes) {
      milestone.notes = completeDto.notes;
    }

    milestone.updatedBy = userId;

    const updatedMilestone = await this.milestoneRepository.save(milestone);

    this.logger.log(`Milestone completed: ${updatedMilestone.title}`);

    // Update project progress
    await this.updateProjectProgress(milestone.projectId);

    // Emit event
    this.eventEmitter.emit('milestone.completed', { milestone: updatedMilestone });

    return updatedMilestone;
  }

  /**
   * Verify milestone
   */
  async verify(
    id: string,
    verifyDto: VerifyMilestoneDto,
    userId: string,
  ): Promise<Milestone> {
    const milestone = await this.findOne(id);

    if (!milestone.isCompleted) {
      throw new BadRequestException('Only completed milestones can be verified');
    }

    if (milestone.verified) {
      throw new BadRequestException('Milestone is already verified');
    }

    milestone.verified = true;
    milestone.verifiedBy = userId;
    milestone.verifiedAt = new Date();
    milestone.verificationNotes = verifyDto.verificationNotes;
    milestone.updatedBy = userId;

    const updatedMilestone = await this.milestoneRepository.save(milestone);

    this.logger.log(`Milestone verified: ${updatedMilestone.title}`);

    // Emit event
    this.eventEmitter.emit('milestone.verified', { milestone: updatedMilestone });

    return updatedMilestone;
  }

  /**
   * Get milestone statistics for a project
   */
  async getProjectStats(projectId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    delayed: number;
    completionRate: number;
    totalBudgeted: number;
    totalActual: number;
  }> {
    const milestones = await this.findByProject(projectId);

    const total = milestones.length;
    const completed = milestones.filter((m) => m.isCompleted).length;
    const inProgress = milestones.filter((m) => m.status === MilestoneStatus.IN_PROGRESS).length;
    const pending = milestones.filter((m) => m.status === MilestoneStatus.PENDING).length;
    const delayed = milestones.filter((m) => m.isDelayed).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const totalBudgeted = milestones.reduce((sum, m) => sum + Number(m.budgetedAmount), 0);
    const totalActual = milestones.reduce((sum, m) => sum + Number(m.actualCost), 0);

    return {
      total,
      completed,
      inProgress,
      pending,
      delayed,
      completionRate,
      totalBudgeted,
      totalActual,
    };
  }

  /**
   * Get total percentage weight for a project
   */
  private async getTotalPercentageWeight(projectId: string): Promise<number> {
    const milestones = await this.milestoneRepository.find({
      where: { projectId },
    });

    return milestones.reduce((sum, m) => sum + Number(m.percentageWeight), 0);
  }

  /**
   * Update project progress based on completed milestones
   */
  private async updateProjectProgress(projectId: string): Promise<void> {
    const milestones = await this.milestoneRepository.find({
      where: { projectId },
    });

    const completedWeight = milestones
      .filter((m) => m.isCompleted)
      .reduce((sum, m) => sum + Number(m.percentageWeight), 0);

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (project) {
      project.progressPercentage = completedWeight;
      await this.projectRepository.save(project);

      this.logger.log(
        `Project progress updated: ${project.projectCode} - ${completedWeight}%`,
      );
    }
  }
}
