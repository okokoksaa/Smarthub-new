import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import { Milestone, MilestoneStatus, Project } from '@shared/database';

describe('MilestonesService', () => {
  let service: MilestonesService;
  let milestoneRepository: Repository<Milestone>;
  let projectRepository: Repository<Project>;

  const mockProject = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    projectCode: 'PROJ-CONST001-2024-001',
    name: 'Health Clinic Construction',
  };

  const mockMilestone = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    projectId: mockProject.id,
    name: 'Foundation Work',
    description: 'Complete foundation and basement',
    status: MilestoneStatus.PENDING,
    order: 1,
    targetDate: new Date('2024-03-31'),
    actualCompletionDate: null,
    completionPercentage: 0,
    deliverables: ['Foundation plans', 'Material list'],
    verificationCriteria: ['Structural integrity test', 'Building inspector approval'],
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMilestoneRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
    })),
    count: jest.fn(),
  };

  const mockProjectRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        {
          provide: getRepositoryToken(Milestone),
          useValue: mockMilestoneRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
    milestoneRepository = module.get<Repository<Milestone>>(
      getRepositoryToken(Milestone),
    );
    projectRepository = module.get<Repository<Project>>(
      getRepositoryToken(Project),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createMilestoneDto = {
      projectId: mockProject.id,
      name: 'Foundation Work',
      description: 'Complete foundation and basement',
      targetDate: new Date('2024-03-31'),
      deliverables: ['Foundation plans', 'Material list'],
      verificationCriteria: ['Structural integrity test'],
    };

    it('should create a new milestone successfully', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMilestoneRepository.count.mockResolvedValue(3);
      mockMilestoneRepository.create.mockReturnValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      const result = await service.create(createMilestoneDto);

      expect(result).toEqual(mockMilestone);
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: createMilestoneDto.projectId },
      });
      expect(mockMilestoneRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createMilestoneDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should set order automatically based on existing milestones', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMilestoneRepository.count.mockResolvedValue(5);
      mockMilestoneRepository.create.mockReturnValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      await service.create(createMilestoneDto);

      const createCall = mockMilestoneRepository.create.mock.calls[0][0];
      expect(createCall.order).toBe(6); // count + 1
    });

    it('should set initial status to PENDING', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMilestoneRepository.count.mockResolvedValue(0);
      mockMilestoneRepository.create.mockReturnValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      await service.create(createMilestoneDto);

      const createCall = mockMilestoneRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe(MilestoneStatus.PENDING);
    });

    it('should initialize completion percentage to 0', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMilestoneRepository.count.mockResolvedValue(0);
      mockMilestoneRepository.create.mockReturnValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      await service.create(createMilestoneDto);

      const createCall = mockMilestoneRepository.create.mock.calls[0][0];
      expect(createCall.completionPercentage).toBe(0);
    });

    it('should handle deliverables array', async () => {
      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockMilestoneRepository.count.mockResolvedValue(0);
      mockMilestoneRepository.create.mockReturnValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      await service.create(createMilestoneDto);

      const createCall = mockMilestoneRepository.create.mock.calls[0][0];
      expect(createCall.deliverables).toEqual(createMilestoneDto.deliverables);
    });
  });

  describe('findAll', () => {
    it('should return all milestones for a project', async () => {
      const mockMilestones = [mockMilestone];
      const queryBuilder = mockMilestoneRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(mockMilestones);

      const result = await service.findAll(mockProject.id);

      expect(result).toEqual(mockMilestones);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'milestone.projectId = :projectId',
        { projectId: mockProject.id },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('milestone.order', 'ASC');
    });

    it('should filter by status', async () => {
      const queryBuilder = mockMilestoneRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(mockProject.id, MilestoneStatus.IN_PROGRESS);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'milestone.status = :status',
        { status: MilestoneStatus.IN_PROGRESS },
      );
    });

    it('should order by milestone order', async () => {
      const queryBuilder = mockMilestoneRepository.createQueryBuilder();
      queryBuilder.getMany.mockResolvedValue([]);

      await service.findAll(mockProject.id);

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('milestone.order', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return a milestone by id', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(mockMilestone);

      const result = await service.findOne(mockMilestone.id);

      expect(result).toEqual(mockMilestone);
      expect(mockMilestoneRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockMilestone.id },
        relations: ['project'],
      });
    });

    it('should throw NotFoundException if milestone not found', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Foundation Work',
      completionPercentage: 50,
    };

    it('should update milestone successfully', async () => {
      const updatedMilestone = { ...mockMilestone, ...updateDto };
      mockMilestoneRepository.findOne.mockResolvedValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(updatedMilestone);

      const result = await service.update(mockMilestone.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.completionPercentage).toBe(updateDto.completionPercentage);
    });

    it('should throw NotFoundException if milestone not found', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should prevent updating completed milestones', async () => {
      const completedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.COMPLETED,
      };
      mockMilestoneRepository.findOne.mockResolvedValue(completedMilestone);

      await expect(service.update(mockMilestone.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('startMilestone', () => {
    it('should start a pending milestone', async () => {
      const startedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
        actualStartDate: expect.any(Date),
      };

      mockMilestoneRepository.findOne.mockResolvedValue(mockMilestone);
      mockMilestoneRepository.save.mockResolvedValue(startedMilestone);

      const result = await service.startMilestone(mockMilestone.id);

      expect(result.status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(result.actualStartDate).toBeDefined();
    });

    it('should throw if milestone not pending', async () => {
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      };
      mockMilestoneRepository.findOne.mockResolvedValue(inProgressMilestone);

      await expect(service.startMilestone(mockMilestone.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeMilestone', () => {
    it('should complete a milestone', async () => {
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      };
      const completedMilestone = {
        ...inProgressMilestone,
        status: MilestoneStatus.COMPLETED,
        completionPercentage: 100,
        actualCompletionDate: expect.any(Date),
      };

      mockMilestoneRepository.findOne.mockResolvedValue(inProgressMilestone);
      mockMilestoneRepository.save.mockResolvedValue(completedMilestone);

      const result = await service.completeMilestone(mockMilestone.id);

      expect(result.status).toBe(MilestoneStatus.COMPLETED);
      expect(result.completionPercentage).toBe(100);
      expect(result.actualCompletionDate).toBeDefined();
    });

    it('should throw if milestone not in progress', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(mockMilestone);

      await expect(service.completeMilestone(mockMilestone.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('approveMilestone', () => {
    it('should approve a completed milestone', async () => {
      const completedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.COMPLETED,
      };
      const approvedMilestone = {
        ...completedMilestone,
        isApproved: true,
        approvedBy: 'user-id',
        approvedAt: expect.any(Date),
      };

      mockMilestoneRepository.findOne.mockResolvedValue(completedMilestone);
      mockMilestoneRepository.save.mockResolvedValue(approvedMilestone);

      const result = await service.approveMilestone(mockMilestone.id, 'user-id');

      expect(result.isApproved).toBe(true);
      expect(result.approvedBy).toBe('user-id');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw if milestone not completed', async () => {
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      };
      mockMilestoneRepository.findOne.mockResolvedValue(inProgressMilestone);

      await expect(service.approveMilestone(mockMilestone.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if milestone already approved', async () => {
      const approvedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.COMPLETED,
        isApproved: true,
      };
      mockMilestoneRepository.findOne.mockResolvedValue(approvedMilestone);

      await expect(service.approveMilestone(mockMilestone.id, 'user-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProgress', () => {
    it('should update milestone progress', async () => {
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      };
      const updatedMilestone = {
        ...inProgressMilestone,
        completionPercentage: 75,
        notes: 'Foundation 75% complete',
      };

      mockMilestoneRepository.findOne.mockResolvedValue(inProgressMilestone);
      mockMilestoneRepository.save.mockResolvedValue(updatedMilestone);

      const result = await service.updateProgress(mockMilestone.id, {
        completionPercentage: 75,
        notes: 'Foundation 75% complete',
      });

      expect(result.completionPercentage).toBe(75);
      expect(result.notes).toBe('Foundation 75% complete');
    });

    it('should validate completion percentage range (0-100)', async () => {
      const inProgressMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
      };
      mockMilestoneRepository.findOne.mockResolvedValue(inProgressMilestone);

      await expect(
        service.updateProgress(mockMilestone.id, { completionPercentage: 150 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateProgress(mockMilestone.id, { completionPercentage: -10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if milestone not in progress', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(mockMilestone);

      await expect(
        service.updateProgress(mockMilestone.id, { completionPercentage: 50 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorderMilestones', () => {
    it('should reorder milestones', async () => {
      const milestones = [
        { ...mockMilestone, id: 'milestone-1', order: 1 },
        { ...mockMilestone, id: 'milestone-2', order: 2 },
        { ...mockMilestone, id: 'milestone-3', order: 3 },
      ];

      const newOrder = ['milestone-3', 'milestone-1', 'milestone-2'];

      mockMilestoneRepository.findOne
        .mockResolvedValueOnce(milestones[2])
        .mockResolvedValueOnce(milestones[0])
        .mockResolvedValueOnce(milestones[1]);

      mockMilestoneRepository.save.mockResolvedValue(mockMilestone);

      await service.reorderMilestones(newOrder);

      expect(mockMilestoneRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should throw if any milestone not found', async () => {
      mockMilestoneRepository.findOne.mockResolvedValue(null);

      await expect(service.reorderMilestones(['non-existent-id'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProjectProgress', () => {
    it('should calculate project progress from milestones', async () => {
      const milestones = [
        { ...mockMilestone, completionPercentage: 100, status: MilestoneStatus.COMPLETED },
        { ...mockMilestone, completionPercentage: 50, status: MilestoneStatus.IN_PROGRESS },
        { ...mockMilestone, completionPercentage: 0, status: MilestoneStatus.PENDING },
      ];

      mockMilestoneRepository.find.mockResolvedValue(milestones);

      const result = await service.getProjectProgress(mockProject.id);

      expect(result.totalMilestones).toBe(3);
      expect(result.completedMilestones).toBe(1);
      expect(result.inProgressMilestones).toBe(1);
      expect(result.pendingMilestones).toBe(1);
      expect(result.overallProgress).toBe(50); // (100 + 50 + 0) / 3
    });

    it('should handle project with no milestones', async () => {
      mockMilestoneRepository.find.mockResolvedValue([]);

      const result = await service.getProjectProgress(mockProject.id);

      expect(result.totalMilestones).toBe(0);
      expect(result.overallProgress).toBe(0);
    });
  });

  describe('milestone lifecycle', () => {
    it('should follow complete milestone workflow', async () => {
      // 1. Create milestone (PENDING)
      let milestone = { ...mockMilestone, status: MilestoneStatus.PENDING };
      mockMilestoneRepository.findOne.mockResolvedValue(milestone);

      // 2. Start milestone (IN_PROGRESS)
      milestone = { ...milestone, status: MilestoneStatus.IN_PROGRESS };
      mockMilestoneRepository.save.mockResolvedValue(milestone);
      await service.startMilestone(milestone.id);

      // 3. Update progress
      milestone = { ...milestone, completionPercentage: 50 };
      mockMilestoneRepository.findOne.mockResolvedValue(milestone);
      mockMilestoneRepository.save.mockResolvedValue(milestone);
      await service.updateProgress(milestone.id, { completionPercentage: 50 });

      // 4. Complete milestone (COMPLETED)
      milestone = {
        ...milestone,
        status: MilestoneStatus.COMPLETED,
        completionPercentage: 100,
      };
      mockMilestoneRepository.findOne.mockResolvedValue({
        ...milestone,
        status: MilestoneStatus.IN_PROGRESS,
      });
      mockMilestoneRepository.save.mockResolvedValue(milestone);
      await service.completeMilestone(milestone.id);

      // 5. Approve milestone
      milestone = { ...milestone, isApproved: true };
      mockMilestoneRepository.findOne.mockResolvedValue({
        ...milestone,
        isApproved: false,
      });
      mockMilestoneRepository.save.mockResolvedValue(milestone);
      await service.approveMilestone(milestone.id, 'user-id');

      expect(milestone.status).toBe(MilestoneStatus.COMPLETED);
      expect(milestone.isApproved).toBe(true);
      expect(milestone.completionPercentage).toBe(100);
    });
  });

  describe('deliverables and verification', () => {
    it('should handle multiple deliverables', async () => {
      const milestoneWithDeliverables = {
        ...mockMilestone,
        deliverables: [
          'Foundation plans approved',
          'Materials procured',
          'Site prepared',
        ],
      };

      mockMilestoneRepository.findOne.mockResolvedValue(milestoneWithDeliverables);

      const result = await service.findOne(mockMilestone.id);

      expect(result.deliverables).toHaveLength(3);
    });

    it('should handle verification criteria', async () => {
      const milestoneWithCriteria = {
        ...mockMilestone,
        verificationCriteria: [
          'Structural engineer sign-off',
          'Building inspector approval',
          'Photos of completed work',
        ],
      };

      mockMilestoneRepository.findOne.mockResolvedValue(milestoneWithCriteria);

      const result = await service.findOne(mockMilestone.id);

      expect(result.verificationCriteria).toHaveLength(3);
    });
  });
});
