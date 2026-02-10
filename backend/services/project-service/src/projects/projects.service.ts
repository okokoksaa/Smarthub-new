import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, MoreThan, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Project, ProjectStatus, ProjectType } from '@shared/database';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApproveProjectDto } from './dto/approve-project.dto';
import { UpdateProgressDto, CompleteProjectDto } from './dto/update-progress.dto';
import {
  WdcSignoffDto,
  PlgoApprovalDto,
  MinistryApprovalDto,
  RejectProjectDto,
} from './dto/workflow.dto';
import { CreateMonitoringEvaluationDto } from './dto/monitoring-evaluation.dto';

/**
 * Projects Service
 * Handles complete CDF project lifecycle management
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    // Generate unique project code
    const projectCode = await this.generateProjectCode(
      createProjectDto.constituencyId,
      createProjectDto.fiscalYear,
    );

    // Validate dates
    if (createProjectDto.startDate && createProjectDto.endDate) {
      const startDate = new Date(createProjectDto.startDate);
      const endDate = new Date(createProjectDto.endDate);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // Build metadata
    const metadata: any = {};
    if (createProjectDto.tags) {
      metadata.tags = createProjectDto.tags;
    }
    if (createProjectDto.sdgAlignment) {
      metadata.sdgAlignment = createProjectDto.sdgAlignment;
    }

    // Create project entity
    const project = this.projectRepository.create({
      ...createProjectDto,
      projectCode,
      status: ProjectStatus.DRAFT,
      progressPercentage: 0,
      actualCost: 0,
      budgetAllocated: 0,
      amountDisbursed: 0,
      actualBeneficiaries: 0,
      isCompleted: false,
      isOverdue: false,
      isOverBudget: false,
      cdfcApproved: false,
      tacApproved: false,
      metadata,
      createdBy: userId,
      updatedBy: userId,
    });

    // Save project
    const savedProject = await this.projectRepository.save(project);

    this.logger.log(`Project created: ${savedProject.projectCode} (${savedProject.id})`);

    // Emit event
    this.eventEmitter.emit('project.created', { project: savedProject });

    return savedProject;
  }

  /**
   * Find all projects with pagination and filtering
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    status?: ProjectStatus;
    projectType?: ProjectType;
    constituencyId?: string;
    wardId?: string;
    fiscalYear?: number;
    search?: string;
  }): Promise<{ projects: Project[]; total: number; page: number; totalPages: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.constituency', 'constituency')
      .leftJoinAndSelect('project.ward', 'ward')
      .leftJoinAndSelect('project.projectManager', 'projectManager')
      .orderBy('project.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (params?.status) {
      queryBuilder.andWhere('project.status = :status', { status: params.status });
    }

    if (params?.projectType) {
      queryBuilder.andWhere('project.projectType = :projectType', {
        projectType: params.projectType,
      });
    }

    if (params?.constituencyId) {
      queryBuilder.andWhere('project.constituencyId = :constituencyId', {
        constituencyId: params.constituencyId,
      });
    }

    if (params?.wardId) {
      queryBuilder.andWhere('project.wardId = :wardId', { wardId: params.wardId });
    }

    if (params?.fiscalYear) {
      queryBuilder.andWhere('project.fiscalYear = :fiscalYear', {
        fiscalYear: params.fiscalYear,
      });
    }

    if (params?.search) {
      queryBuilder.andWhere(
        '(project.title ILIKE :search OR project.description ILIKE :search OR project.projectCode ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    // Execute query
    const [projects, total] = await queryBuilder.getManyAndCount();

    return {
      projects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find project by ID
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'constituency',
        'ward',
        'projectManager',
        'monitoringOfficer',
        'contractor',
        'cdfcApprover',
        'tacApprover',
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Find project by code
   */
  async findByCode(projectCode: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { projectCode },
      relations: ['constituency', 'ward', 'projectManager'],
    });

    if (!project) {
      throw new NotFoundException(`Project with code ${projectCode} not found`);
    }

    return project;
  }

  /**
   * Update project
   */
  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findOne(id);

    // Check if project can be updated
    if (project.status === ProjectStatus.COMPLETED || project.status === ProjectStatus.CLOSED) {
      throw new BadRequestException('Cannot update completed or closed projects');
    }

    // Validate dates if provided
    const startDate = updateProjectDto.startDate
      ? new Date(updateProjectDto.startDate)
      : project.startDate;
    const endDate = updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : project.endDate;

    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Update metadata
    if (updateProjectDto.tags || updateProjectDto.sdgAlignment) {
      project.metadata = project.metadata || {};
      if (updateProjectDto.tags) {
        project.metadata.tags = updateProjectDto.tags;
      }
      if (updateProjectDto.sdgAlignment) {
        project.metadata.sdgAlignment = updateProjectDto.sdgAlignment;
      }
    }

    // Update project
    Object.assign(project, updateProjectDto);
    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(`Project updated: ${updatedProject.projectCode} (${updatedProject.id})`);

    // Emit event
    this.eventEmitter.emit('project.updated', { project: updatedProject });

    return updatedProject;
  }

  /**
   * Delete project (soft delete by setting status to CANCELLED)
   */
  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    // Can only delete draft or submitted projects
    if (
      ![ProjectStatus.DRAFT, ProjectStatus.SUBMITTED, ProjectStatus.REJECTED].includes(
        project.status,
      )
    ) {
      throw new BadRequestException(
        'Can only delete draft, submitted, or rejected projects',
      );
    }

    project.status = ProjectStatus.CANCELLED;
    project.updatedBy = userId;

    await this.projectRepository.save(project);

    this.logger.log(`Project cancelled: ${project.projectCode} (${project.id})`);

    // Emit event
    this.eventEmitter.emit('project.cancelled', { project });
  }

  /**
   * Submit project for approval
   */
  async submit(id: string, userId: string): Promise<Project> {
    const project = await this.findOne(id);

    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException('Only draft projects can be submitted');
    }

    // Validate required fields
    if (!project.proposalDocumentUrl) {
      throw new BadRequestException('Proposal document is required for submission');
    }

    project.status = ProjectStatus.SUBMITTED;
    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(`Project submitted: ${updatedProject.projectCode}`);

    // Emit event
    this.eventEmitter.emit('project.submitted', { project: updatedProject });

    return updatedProject;
  }

  /**
   * CDFC approval
   */
  async cdfcApprove(
    id: string,
    approvalDto: ApproveProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (project.status !== ProjectStatus.SUBMITTED && project.status !== ProjectStatus.UNDER_REVIEW) {
      throw new BadRequestException('Project must be submitted or under review for CDFC approval');
    }

    if (!approvalDto.approved) {
      // Rejection
      project.status = ProjectStatus.REJECTED;
      project.rejectionReason = approvalDto.notes;
      project.rejectionDate = new Date();
    } else {
      // Approval
      project.cdfcApproved = true;
      project.cdfcApprovedAt = new Date();
      project.cdfcApprovedBy = userId;
      project.status = ProjectStatus.UNDER_REVIEW;
    }

    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(
      `Project ${approvalDto.approved ? 'approved' : 'rejected'} by CDFC: ${updatedProject.projectCode}`,
    );

    // Emit event
    this.eventEmitter.emit('project.cdfc_decision', {
      project: updatedProject,
      approved: approvalDto.approved,
    });

    return updatedProject;
  }

  /**
   * TAC approval
   */
  async tacApprove(
    id: string,
    approvalDto: ApproveProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (!project.cdfcApproved) {
      throw new BadRequestException('Project must be CDFC approved before TAC approval');
    }

    if (!approvalDto.approved) {
      // Rejection
      project.status = ProjectStatus.REJECTED;
      project.rejectionReason = approvalDto.notes;
      project.rejectionDate = new Date();
    } else {
      // Approval
      project.tacApproved = true;
      project.tacApprovedAt = new Date();
      project.tacApprovedBy = userId;
      project.status = ProjectStatus.APPROVED;
    }

    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(
      `Project ${approvalDto.approved ? 'approved' : 'rejected'} by TAC: ${updatedProject.projectCode}`,
    );

    // Emit event
    this.eventEmitter.emit('project.tac_decision', {
      project: updatedProject,
      approved: approvalDto.approved,
    });

    return updatedProject;
  }

  /**
   * Start project execution
   */
  async startExecution(id: string, userId: string): Promise<Project> {
    const project = await this.findOne(id);

    if (project.status !== ProjectStatus.BUDGETED) {
      throw new BadRequestException('Only budgeted projects can be started');
    }

    project.status = ProjectStatus.IN_PROGRESS;
    project.actualStartDate = new Date();
    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(`Project execution started: ${updatedProject.projectCode}`);

    // Emit event
    this.eventEmitter.emit('project.started', { project: updatedProject });

    return updatedProject;
  }

  /**
   * Update project progress
   */
  async updateProgress(
    id: string,
    progressDto: UpdateProgressDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only update progress for in-progress projects');
    }

    project.progressPercentage = progressDto.progressPercentage;

    if (progressDto.actualCost !== undefined) {
      project.actualCost = progressDto.actualCost;
      project.isOverBudget = project.actualCost > project.estimatedCost;
    }

    if (progressDto.actualBeneficiaries !== undefined) {
      project.actualBeneficiaries = progressDto.actualBeneficiaries;
    }

    if (progressDto.qualityRating !== undefined) {
      project.qualityRating = progressDto.qualityRating;
    }

    if (progressDto.notes) {
      project.inspectionNotes = progressDto.notes;
    }

    project.lastInspectionDate = new Date();
    project.updatedBy = userId;

    // Check if overdue
    if (project.endDate && new Date() > project.endDate) {
      project.isOverdue = true;
    }

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(
      `Project progress updated: ${updatedProject.projectCode} - ${updatedProject.progressPercentage}%`,
    );

    // Emit event
    this.eventEmitter.emit('project.progress_updated', { project: updatedProject });

    return updatedProject;
  }

  /**
   * Complete project
   */
  async complete(
    id: string,
    completeDto: CompleteProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (project.status !== ProjectStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress projects can be completed');
    }

    if (project.progressPercentage < 100) {
      throw new BadRequestException('Project must be 100% complete');
    }

    project.status = ProjectStatus.COMPLETED;
    project.isCompleted = true;
    project.actualEndDate = new Date(completeDto.actualEndDate);
    project.progressPercentage = 100;

    if (completeDto.actualCost !== undefined) {
      project.actualCost = completeDto.actualCost;
      project.isOverBudget = project.actualCost > project.estimatedCost;
    }

    if (completeDto.actualBeneficiaries !== undefined) {
      project.actualBeneficiaries = completeDto.actualBeneficiaries;
    }

    if (completeDto.completionCertificateUrl) {
      project.completionCertificateUrl = completeDto.completionCertificateUrl;
    }

    if (completeDto.notes) {
      project.inspectionNotes = completeDto.notes;
    }

    project.updatedBy = userId;

    const updatedProject = await this.projectRepository.save(project);

    this.logger.log(`Project completed: ${updatedProject.projectCode}`);

    // Emit event
    this.eventEmitter.emit('project.completed', { project: updatedProject });

    return updatedProject;
  }

  /**
   * WDC sign-off stored in metadata
   */
  async addWdcSignoff(id: string, dto: WdcSignoffDto, userId?: string) {
    const project = await this.findOne(id);
    project.metadata = project.metadata || {};
    project.metadata.wdcSignoff = {
      chair_signed: dto.chair_signed,
      meeting_minutes_url: dto.meeting_minutes_url,
      signed_by: userId,
      signed_at: new Date().toISOString(),
    };
    project.updatedBy = userId;
    const saved = await this.projectRepository.save(project);
    return saved;
  }

  /**
   * PLGO approval
   */
  async plgoApprove(id: string, dto: PlgoApprovalDto, userId?: string) {
    const project = await this.findOne(id);
    if (!dto.approved) {
      project.status = ProjectStatus.REJECTED;
      project.rejectionReason = dto.notes;
      project.rejectionDate = new Date();
    } else {
      // advance status or mark as under review by ministry
      project.status = ProjectStatus.UNDER_REVIEW;
    }
    project.updatedBy = userId;
    return this.projectRepository.save(project);
  }

  /**
   * Ministry approval
   */
  async ministryApprove(id: string, dto: MinistryApprovalDto, userId?: string) {
    const project = await this.findOne(id);
    if (!dto.approved) {
      project.status = ProjectStatus.REJECTED;
      project.rejectionReason = dto.notes;
      project.rejectionDate = new Date();
    } else {
      project.status = ProjectStatus.APPROVED;
    }
    project.updatedBy = userId;
    return this.projectRepository.save(project);
  }

  /**
   * Explicit reject endpoint
   */
  async reject(id: string, dto: RejectProjectDto, userId?: string) {
    const project = await this.findOne(id);
    project.status = ProjectStatus.REJECTED;
    project.rejectionReason = dto.reason;
    project.rejectionDate = new Date();
    project.updatedBy = userId;
    return this.projectRepository.save(project);
  }

  /**
   * Record Monitoring & Evaluation
   */
  async recordMonitoringEvaluation(
    id: string,
    dto: CreateMonitoringEvaluationDto,
    userId?: string,
  ) {
    const project = await this.findOne(id);
    project.metadata = project.metadata || {};
    const reports = Array.isArray(project.metadata.mEReports)
      ? project.metadata.mEReports
      : [];
    reports.push({ ...dto, recorded_by: userId, recorded_at: new Date().toISOString() });
    project.metadata.mEReports = reports;
    project.updatedBy = userId;
    return this.projectRepository.save(project);
  }

  /**
   * Simple workflow status summary
   */
  async getWorkflowStatus(id: string) {
    const project = await this.findOne(id);
    return {
      id: project.id,
      status: project.status,
      cdfcApproved: project.cdfcApproved,
      tacApproved: project.tacApproved,
      wdcSignoff: !!project.metadata?.wdcSignoff,
      progress: project.progressPercentage,
    };
  }

  /**
   * Get project statistics
   */
  async getStatistics(constituencyId?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalBudget: number;
    totalDisbursed: number;
    averageProgress: number;
    completionRate: number;
  }> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    if (constituencyId) {
      queryBuilder.where('project.constituencyId = :constituencyId', { constituencyId });
    }

    const projects = await queryBuilder.getMany();

    const total = projects.length;

    // By status
    const byStatus: Record<string, number> = {};
    projects.forEach((p) => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    // By type
    const byType: Record<string, number> = {};
    projects.forEach((p) => {
      byType[p.projectType] = (byType[p.projectType] || 0) + 1;
    });

    // Financial
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budgetAllocated), 0);
    const totalDisbursed = projects.reduce((sum, p) => sum + Number(p.amountDisbursed), 0);

    // Progress
    const averageProgress =
      projects.length > 0
        ? projects.reduce((sum, p) => sum + Number(p.progressPercentage), 0) / projects.length
        : 0;

    // Completion rate
    const completed = projects.filter((p) => p.isCompleted).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      byStatus,
      byType,
      totalBudget,
      totalDisbursed,
      averageProgress,
      completionRate,
    };
  }

  /**
   * Generate unique project code
   */
  private async generateProjectCode(constituencyId: string, fiscalYear: number): Promise<string> {
    // Format: CDF-[CONST_CODE]-[YEAR]-[SEQUENCE]
    const count = await this.projectRepository.count({
      where: { constituencyId, fiscalYear },
    });

    const sequence = String(count + 1).padStart(4, '0');
    const constCode = constituencyId.substring(0, 8).toUpperCase();
    const yearShort = String(fiscalYear).substring(2);

    return `CDF-${constCode}-${yearShort}-${sequence}`;
  }
}
