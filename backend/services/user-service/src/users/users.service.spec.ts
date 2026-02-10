import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PasswordService } from './password.service';
import { User, UserRole, TenantScopeLevel, Gender } from '@shared/database';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let passwordService: PasswordService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    salt: 'salt',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CDFC_MEMBER,
    tenantScopeLevel: TenantScopeLevel.CONSTITUENCY,
    isActive: true,
    isVerified: false,
    isLocked: false,
    failedLoginAttempts: 0,
    mfaEnabled: false,
    phoneNumber: '+260977123456',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
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
    })),
    count: jest.fn(),
  };

  const mockPasswordService = {
    hashPassword: jest.fn().mockResolvedValue({
      hash: 'hashed_password',
      salt: 'salt',
    }),
    verifyPassword: jest.fn(),
    validatePasswordStrength: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    passwordService = module.get<PasswordService>(PasswordService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CDFC_MEMBER,
      tenantScopeLevel: TenantScopeLevel.CONSTITUENCY,
      phoneNumber: '+260977123456',
    };

    it('should create a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(passwordService.hashPassword).toHaveBeenCalledWith('TestPass123!');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should convert email to lowercase', async () => {
      const dtoWithUppercase = {
        ...createUserDto,
        email: 'TEST@EXAMPLE.COM',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.create(dtoWithUppercase);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should generate verification token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.create(createUserDto);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.verificationToken).toBeDefined();
      expect(createCall.verificationToken.length).toBeGreaterThan(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [mockUser];
      const queryBuilder = mockUserRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([mockUsers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        users: mockUsers,
        total: 1,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter by role', async () => {
      const queryBuilder = mockUserRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ role: UserRole.CDFC_MEMBER });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.role = :role', {
        role: UserRole.CDFC_MEMBER,
      });
    });

    it('should filter by active status', async () => {
      const queryBuilder = mockUserRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', {
        isActive: true,
      });
    });

    it('should search by name', async () => {
      const queryBuilder = mockUserRepository.createQueryBuilder();
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'John' });

      expect(queryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findByEmail('nonexistent@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      firstName: 'Jane',
      phoneNumber: '+260977654321',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);

      expect(result.firstName).toBe('Jane');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = { ...mockUser, id: 'different-id' };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // First call for finding user
        .mockResolvedValueOnce(existingUser); // Second call for checking email

      await expect(
        service.update(mockUser.id, { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(deactivatedUser);

      await service.remove(mockUser.id);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const unverifiedUser = { ...mockUser, isVerified: false };
      mockUserRepository.findOne.mockResolvedValue(unverifiedUser);
      mockUserRepository.save.mockResolvedValue({
        ...unverifiedUser,
        isVerified: true,
        emailVerifiedAt: new Date(),
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.isVerified).toBe(true);
      expect(result.emailVerifiedAt).toBeDefined();
    });

    it('should throw BadRequestException if token invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('lockAccount', () => {
    it('should lock account successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        isLocked: true,
        lockedAt: new Date(),
        lockedReason: 'Suspicious activity',
      });

      const result = await service.lockAccount(mockUser.id, 'Suspicious activity');

      expect(result.isLocked).toBe(true);
      expect(result.lockedReason).toBe('Suspicious activity');
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account successfully', async () => {
      const lockedUser = { ...mockUser, isLocked: true };
      mockUserRepository.findOne.mockResolvedValue(lockedUser);
      mockUserRepository.save.mockResolvedValue({
        ...lockedUser,
        isLocked: false,
        failedLoginAttempts: 0,
      });

      const result = await service.unlockAccount(mockUser.id);

      expect(result.isLocked).toBe(false);
      expect(result.failedLoginAttempts).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return user statistics', async () => {
      const users = [
        { ...mockUser, role: UserRole.CDFC_MEMBER, isActive: true },
        { ...mockUser, role: UserRole.WDC_MEMBER, isActive: false },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.getStatistics();

      expect(result.total).toBe(2);
      expect(result.active).toBe(1);
      expect(result.byRole).toBeDefined();
    });
  });
});
