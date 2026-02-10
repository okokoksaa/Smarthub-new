import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  Project,
  ProjectStatus,
  ProjectType,
  ProjectPriority,
  Sector,
} from '@shared/database';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: Repository<Project>;

  const mockProject = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    projectCode: 'PROJ-CONST001-2024-001',
    name: 'Health Clinic Construction',
    description: 'Building a new health clinic',
    projectType: ProjectType.CAPITAL_INVESTMENT,
    sector: Sector.HEALTH,
    priority: ProjectPriority.HIGH,
    status: ProjectStatus.PLANNING,
    constituencyId: 'const-001',
    wardId: 'ward-001',
    estimatedBudget: 1000000,
    budgetAllocated: 0,
    amountDisbursed: 0,
    amountUtilized: 0,
    startDate: new Date('2024-01-01'),
    expectedEndDate: new Date('2024-12-31'),
    actualEndDate: null,
    cdfcApproved: false,
    tacApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
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
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProjectDto = {
      name: 'Health Clinic Construction',
      description: 'Building a new health clinic',
      projectType: ProjectType.CAPITAL_INVESTMENT,
      sector: Sector.HEALTH,
      priority: ProjectPriority.HIGH,
      constituencyId: 'const-001',
      wardId: 'ward-001',
      estimatedBudget: 1000000,
      startDate: new Date('2024-01-01'),
      expectedEndDate: new Date('2024-12-31'),
    };

    it('should create a new project successfully', async () => {
      mockProjectRepository.count.mockResolvedValue(0);
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto);

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.create).toHaveBeenCalled();
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should generate unique project code', async () => {
      mockProjectRepository.count.mockResolvedValue(5);
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.projectCode).toMatch(/^PROJ-[A-Z0-9]+-\d{4}-\d{3}$/);
    });

    it('should set initial status to PLANNING', async () => {
      mockProjectRepository.count.mockResolvedValue(0);
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe(ProjectStatus.PLANNING);
    });

    it('should initialize budget fields to zero', async () => {
      mockProjectRepository.count.mockResolvedValue(0);
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.budgetAllocated).toBe(0);
      expect(createCall.amountDisbursed).toBe(0);
      expect(createCall.amountUtilized).toBe(0);
    });

    it('should validate end date after start date', async () => {
      const invalidDto = {
        ...createProjectDto,
        startDate: new Date('2024-12-31'),
        expectedEndDate: new Date('2024-01-01'),
      };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should set approval flags to false by default', async () => {
      mockProjectRepository.count.mockResolvedValue(0);
      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      await service.create(createProjectDto);

      const createCall = mockProjectRepository.create.mock.calls[0][0];
      expect(createCall.cdfcApproved).toBe(false);
      expect(createCall.tacApproved).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const mockProjects = [mockProject];
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockProjects, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        projects: mockProjects,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: ProjectStatus.IN_PROGRESS });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.status = :status',
        { status: ProjectStatus.IN_PROGRESS },
      );
    });

    it('should filter by constituency', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ constituencyId: 'const-001' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.constituencyId = :constituencyId',
        { constituencyId: 'const-001' },
      );
    });

    it('should filter by sector', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ sector: Sector.HEALTH });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.sector = :sector',
        { sector: Sector.HEALTH },
      );
    });

    it('should filter by priority', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ priority: ProjectPriority.HIGH });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'project.priority = :priority',
        { priority: ProjectPriority.HIGH },
      );
    });

    it('should search by name or description', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'health' });

      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const queryBuilder = mockProjectRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 20 });

      expect(queryBuilder.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(mockProject.id);

      expect(result).toEqual(mockProject);
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        relations: ['milestones'],
      });
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Health Clinic',
      estimatedBudget: 1500000,
    };

    it('should update project successfully', async () => {
      const updatedProject = { ...mockProject, ...updateDto };
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(mockProject.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.estimatedBudget).toBe(updateDto.estimatedBudget);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent updating approved projects', async () => {
      const approvedProject = { ...mockProject, cdfcApproved: true, tacApproved: true };
      mockProjectRepository.findOne.mockResolvedValue(approvedProject);

      await expect(service.update(mockProject.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow status updates for approved projects', async () => {
      const approvedProject = { ...mockProject, cdfcApproved: true, tacApproved: true };
      mockProjectRepository.findOne.mockResolvedValue(approvedProject);
      mockProjectRepository.save.mockResolvedValue(approvedProject);

      await service.update(mockProject.id, { status: ProjectStatus.IN_PROGRESS });

      expect(mockProjectRepository.save).toHaveBeenCalled();
    });
  });

  describe('submitForApproval', () => {
    it('should submit project for approval', async () => {
      const submittedProject = { ...mockProject, status: ProjectStatus.PENDING_APPROVAL };
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(submittedProject);

      const result = await service.submitForApproval(mockProject.id);

      expect(result.status).toBe(ProjectStatus.PENDING_APPROVAL);
    });

    it('should throw if project already submitted', async () => {
      const submittedProject = { ...mockProject, status: ProjectStatus.PENDING_APPROVAL };
      mockProjectRepository.findOne.mockResolvedValue(submittedProject);

      await expect(service.submitForApproval(mockProject.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if project already approved', async () => {
      const approvedProject = { ...mockProject, status: ProjectStatus.APPROVED };
      mockProjectRepository.findOne.mockResolvedValue(approvedProject);

      await expect(service.submitForApproval(mockProject.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cdfcApprove', () => {
    it('should approve project by CDFC', async () => {
      const pendingProject = { ...mockProject, status: ProjectStatus.PENDING_APPROVAL };
      const approvedProject = { ...pendingProject, cdfcApproved: true };

      mockProjectRepository.findOne.mockResolvedValue(pendingProject);
      mockProjectRepository.save.mockResolvedValue(approvedProject);

      const result = await service.cdfcApprove(mockProject.id, 'user-id');

      expect(result.cdfcApproved).toBe(true);
      expect(result.cdfcApprovedBy).toBe('user-id');
      expect(result.cdfcApprovedAt).toBeDefined();
    });

    it('should set status to APPROVED if TAC also approved', async () => {
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
        tacApproved: true,
      };
      const approvedProject = {
        ...pendingProject,
        cdfcApproved: true,
        status: ProjectStatus.APPROVED,
      };

      mockProjectRepository.findOne.mockResolvedValue(pendingProject);
      mockProjectRepository.save.mockResolvedValue(approvedProject);

      const result = await service.cdfcApprove(mockProject.id, 'user-id');

      expect(result.status).toBe(ProjectStatus.APPROVED);
    });

    it('should throw if project not pending approval', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      await expect(service.cdfcApprove(mockProject.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('tacApprove', () => {
    it('should approve project by TAC', async () => {
      const pendingProject = { ...mockProject, status: ProjectStatus.PENDING_APPROVAL };
      const approvedProject = { ...pendingProject, tacApproved: true };

      mockProjectRepository.findOne.mockResolvedValue(pendingProject);
      mockProjectRepository.save.mockResolvedValue(approvedProject);

      const result = await service.tacApprove(mockProject.id, 'user-id');

      expect(result.tacApproved).toBe(true);
      expect(result.tacApprovedBy).toBe('user-id');
      expect(result.tacApprovedAt).toBeDefined();
    });

    it('should set status to APPROVED if CDFC also approved', async () => {
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
        cdfcApproved: true,
      };
      const approvedProject = {
        ...pendingProject,
        tacApproved: true,
        status: ProjectStatus.APPROVED,
      };

      mockProjectRepository.findOne.mockResolvedValue(pendingProject);
      mockProjectRepository.save.mockResolvedValue(approvedProject);

      const result = await service.tacApprove(mockProject.id, 'user-id');

      expect(result.status).toBe(ProjectStatus.APPROVED);
    });

    it('should require CDFC approval before TAC approval', async () => {
      const pendingProject = {
        ...mockProject,
        status: ProjectStatus.PENDING_APPROVAL,
        cdfcApproved: false,
      };

      mockProjectRepository.findOne.mockResolvedValue(pendingProject);

      await expect(service.tacApprove(mockProject.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startProject', () => {
    it('should start an approved project', async () => {
      const approvedProject = {
        ...mockProject,
        status: ProjectStatus.APPROVED,
        cdfcApproved: true,
        tacApproved: true,
      };
      const startedProject = {
        ...approvedProject,
        status: ProjectStatus.IN_PROGRESS,
        actualStartDate: expect.any(Date),
      };

      mockProjectRepository.findOne.mockResolvedValue(approvedProject);
      mockProjectRepository.save.mockResolvedValue(startedProject);

      const result = await service.startProject(mockProject.id);

      expect(result.status).toBe(ProjectStatus.IN_PROGRESS);
      expect(result.actualStartDate).toBeDefined();
    });

    it('should throw if project not approved', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      await expect(service.startProject(mockProject.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeProject', () => {
    it('should complete a project', async () => {
      const inProgressProject = { ...mockProject, status: ProjectStatus.IN_PROGRESS };
      const completedProject = {
        ...inProgressProject,
        status: ProjectStatus.COMPLETED,
        actualEndDate: expect.any(Date),
        completionPercentage: 100,
      };

      mockProjectRepository.findOne.mockResolvedValue(inProgressProject);
      mockProjectRepository.save.mockResolvedValue(completedProject);

      const result = await service.completeProject(mockProject.id);

      expect(result.status).toBe(ProjectStatus.COMPLETED);
      expect(result.actualEndDate).toBeDefined();
      expect(result.completionPercentage).toBe(100);
    });

    it('should throw if project not in progress', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      await expect(service.completeProject(mockProject.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return project statistics', async () => {
      const projects = [
        { ...mockProject, status: ProjectStatus.IN_PROGRESS },
        { ...mockProject, status: ProjectStatus.COMPLETED },
        { ...mockProject, status: ProjectStatus.PLANNING },
      ];

      mockProjectRepository.find.mockResolvedValue(projects);

      const result = await service.getStatistics();

      expect(result.total).toBe(3);
      expect(result.byStatus).toBeDefined();
      expect(result.bySector).toBeDefined();
      expect(result.byPriority).toBeDefined();
    });

    it('should calculate budget totals correctly', async () => {
      const projects = [
        { ...mockProject, estimatedBudget: 1000000, budgetAllocated: 800000 },
        { ...mockProject, estimatedBudget: 500000, budgetAllocated: 500000 },
      ];

      mockProjectRepository.find.mockResolvedValue(projects);

      const result = await service.getStatistics();

      expect(result.totalEstimatedBudget).toBe(1500000);
      expect(result.totalAllocatedBudget).toBe(1300000);
    });
  });

  describe('project lifecycle', () => {
    it('should follow complete approval workflow', async () => {
      // 1. Create project (PLANNING)
      let project = { ...mockProject, status: ProjectStatus.PLANNING };
      mockProjectRepository.findOne.mockResolvedValue(project);

      // 2. Submit for approval (PENDING_APPROVAL)
      project = { ...project, status: ProjectStatus.PENDING_APPROVAL };
      mockProjectRepository.save.mockResolvedValue(project);
      await service.submitForApproval(project.id);

      // 3. CDFC approval
      project = { ...project, cdfcApproved: true };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.save.mockResolvedValue(project);
      await service.cdfcApprove(project.id, 'cdfc-user');

      // 4. TAC approval (status becomes APPROVED)
      project = { ...project, tacApproved: true, status: ProjectStatus.APPROVED };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.save.mockResolvedValue(project);
      await service.tacApprove(project.id, 'tac-user');

      expect(project.cdfcApproved).toBe(true);
      expect(project.tacApproved).toBe(true);
      expect(project.status).toBe(ProjectStatus.APPROVED);
    });
  });
});
