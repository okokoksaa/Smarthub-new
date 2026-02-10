import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, TenantScopeLevel } from '@shared/database';
import { JwtPayload } from './strategies/jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Authentication Tokens Response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Login Response with User Data
 */
export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phoneNumber?: string;
    role: string;
    tenantScopeLevel: string;
    isActive: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Authentication Service
 * Handles user authentication, password hashing, and token generation
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    // Find user with password hash
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: [
        'id',
        'email',
        'passwordHash',
        'firstName',
        'lastName',
        'role',
        'tenantScopeLevel',
        'isActive',
        'isLocked',
        'isVerified',
        'emailVerifiedAt',
        'failedLoginAttempts',
        'mfaEnabled',
      ],
    });

    if (!user) {
      this.logger.warn(`Login attempt for non-existent user: ${email}`);
      return null;
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      this.logger.warn(`Login attempt for locked account: ${email}`);
      throw new UnauthorizedException('Account is locked. Please contact support.');
    }

    // Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive account: ${email}`);
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.incrementFailedLoginAttempts(user.id);
      this.logger.warn(`Failed login attempt for user: ${email}`);
      return null;
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id);

    // Update last login timestamp
    await this.updateLastLogin(user.id);

    return user;
  }

  /**
   * Login user and generate tokens
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified()) {
      throw new UnauthorizedException('Email not verified. Please verify your email first.');
    }

    // Check if MFA is required (disabled for development)
    // if (user.requiresMfa() && !loginDto.mfaCode) {
    //   throw new UnauthorizedException('MFA code required');
    // }

    // Validate MFA code if provided
    if (loginDto.mfaCode && user.mfaEnabled) {
      const isMfaValid = await this.validateMfaCode(user.id, loginDto.mfaCode);
      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return tokens with user data (excluding sensitive fields)
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        tenantScopeLevel: user.tenantScopeLevel,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    } as LoginResponse;
  }

  /**
   * Register new user
   */
  async register(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const { hash } = await this.hashPassword(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email.toLowerCase(),
      passwordHash: hash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phoneNumber: registerDto.phoneNumber,
      // Assign default role and tenantScopeLevel to prevent privilege escalation
      role: UserRole.CITIZEN,
      tenantScopeLevel: TenantScopeLevel.NATIONAL, // Default to broadest scope, adjust as per business logic
      isActive: true,
      isVerified: false,
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    this.logger.log(`New user registered: ${savedUser.email}`);

    // TODO: Send verification email

    return savedUser;
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantScopeLevel: user.tenantScopeLevel,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token with longer expiration
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    // Parse expiration time
    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRATION', '1h'),
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Hash password with bcrypt
   */
  private async hashPassword(password: string): Promise<{ hash: string }> {
    const hash = await bcrypt.hash(password, 10);
    return { hash };
  }

  /**
   * Verify password
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedLoginAttempts(userId: string): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'failedLoginAttempts', 1);
    await this.userRepository.update(userId, { lastFailedLogin: new Date() });
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      failedLoginAttempts: 0,
      lastFailedLogin: null,
    });
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastActivityAt: new Date(),
    });
  }

  /**
   * Validate MFA code
   * TODO: Implement TOTP validation
   */
  private async validateMfaCode(userId: string, code: string): Promise<boolean> {
    // Placeholder - implement actual TOTP validation
    return true;
  }

  /**
   * Parse expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }
}
