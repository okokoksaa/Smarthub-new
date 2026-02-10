import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PasswordService } from './password.service';
import * as crypto from 'crypto';

/**
 * Users Service
 * Handles all user management operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check for duplicate national ID if provided
    if (createUserDto.nationalIdNumber) {
      const existingNrcUser = await this.userRepository.findOne({
        where: { nationalIdNumber: createUserDto.nationalIdNumber },
      });

      if (existingNrcUser) {
        throw new ConflictException('User with this National ID already exists');
      }
    }

    // Hash password
    const { hash, salt } = await this.passwordService.hashPassword(createUserDto.password);

    // Generate verification token
    const verificationToken = this.generateToken();

    // Create user entity
    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      passwordHash: hash,
      salt,
      verificationToken,
      isVerified: false,
      isActive: true,
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`User created: ${savedUser.email} (${savedUser.id})`);

    // TODO: Send verification email

    return savedUser;
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.role',
        'user.tenantScopeLevel',
        'user.isActive',
        'user.isVerified',
        'user.isLocked',
        'user.createdAt',
        'user.lastLoginAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (params?.role) {
      queryBuilder.andWhere('user.role = :role', { role: params.role });
    }

    if (params?.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: params.isActive });
    }

    if (params?.search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    // Execute query
    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'middleName',
        'nationalIdNumber',
        'dateOfBirth',
        'gender',
        'phoneNumber',
        'alternativePhone',
        'physicalAddress',
        'role',
        'tenantScopeLevel',
        'profilePhotoUrl',
        'bio',
        'mfaEnabled',
        'isVerified',
        'emailVerifiedAt',
        'isActive',
        'isLocked',
        'lockedAt',
        'lockedReason',
        'failedLoginAttempts',
        'lastLoginAt',
        'lastLoginIp',
        'lastActivityAt',
        'languagePreference',
        'timezone',
        'notificationPreferences',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check for email conflict if email is being changed
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Check for NRC conflict if NRC is being changed
    if (updateUserDto.nationalIdNumber && updateUserDto.nationalIdNumber !== user.nationalIdNumber) {
      const existingNrcUser = await this.userRepository.findOne({
        where: { nationalIdNumber: updateUserDto.nationalIdNumber },
      });
      if (existingNrcUser) {
        throw new ConflictException('National ID already in use');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);

    if (updateUserDto.email) {
      user.email = updateUserDto.email.toLowerCase();
    }

    const updatedUser = await this.userRepository.save(user);

    this.logger.log(`User updated: ${updatedUser.email} (${updatedUser.id})`);

    return updatedUser;
  }

  /**
   * Delete user (soft delete by setting isActive = false)
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    user.isActive = false;
    await this.userRepository.save(user);

    this.logger.log(`User deactivated: ${user.email} (${user.id})`);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;

    const verifiedUser = await this.userRepository.save(user);

    this.logger.log(`Email verified: ${verifiedUser.email} (${verifiedUser.id})`);

    return verifiedUser;
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<void> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate new verification token
    user.emailVerificationToken = this.generateToken();
    await this.userRepository.save(user);

    // TODO: Send verification email

    this.logger.log(`Verification email resent: ${user.email}`);
  }

  /**
   * Lock user account
   */
  async lockAccount(id: string, reason: string): Promise<User> {
    const user = await this.findOne(id);

    user.isLocked = true;
    user.lockedAt = new Date();
    user.lockedReason = reason;

    const lockedUser = await this.userRepository.save(user);

    this.logger.warn(`Account locked: ${lockedUser.email} - Reason: ${reason}`);

    return lockedUser;
  }

  /**
   * Unlock user account
   */
  async unlockAccount(id: string): Promise<User> {
    const user = await this.findOne(id);

    user.isLocked = false;
    user.lockedAt = null;
    user.lockedReason = null;
    user.failedLoginAttempts = 0;

    const unlockedUser = await this.userRepository.save(user);

    this.logger.log(`Account unlocked: ${unlockedUser.email}`);

    return unlockedUser;
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    verified: number;
    locked: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, verified, locked] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { isVerified: true } }),
      this.userRepository.count({ where: { isLocked: true } }),
    ]);

    // Count by role
    const roleStats = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const byRole: Record<string, number> = {};
    roleStats.forEach((stat) => {
      byRole[stat.role] = parseInt(stat.count, 10);
    });

    return {
      total,
      active,
      verified,
      locked,
      byRole,
    };
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
