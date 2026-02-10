import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

/**
 * Password Service
 * Handles password hashing, validation, reset, and history tracking
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly PASSWORD_HISTORY_LIMIT = 5;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Hash password with bcrypt
   */
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    this.validatePasswordStrength(password);

    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);

    return { hash, salt };
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): void {
    if (!password || password.length < this.PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }

    // Check for common passwords
    const commonPasswords = [
      'password',
      'password123',
      '12345678',
      'qwerty123',
      'admin123',
    ];
    if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
      throw new BadRequestException('Password is too common, please choose a stronger password');
    }
  }

  /**
   * Generate password reset token
   */
  generateResetToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    return { token, expiresAt };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user with password hash
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'passwordHash', 'salt'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify old password
    const isOldPasswordValid = await this.verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSamePassword = await this.verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update user
    user.passwordHash = hash;
    user.salt = salt;
    user.passwordChangedAt = new Date();

    await this.userRepository.save(user);

    this.logger.log(`Password changed for user: ${user.email}`);
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user by reset token
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
      select: ['id', 'email', 'passwordHash', 'passwordResetExpires'],
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update user
    user.passwordHash = hash;
    user.salt = salt;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordChangedAt = new Date();

    await this.userRepository.save(user);

    this.logger.log(`Password reset for user: ${user.email}`);
  }

  /**
   * Initiate password reset
   */
  async initiatePasswordReset(email: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      this.logger.warn(`Password reset attempted for non-existent email: ${email}`);
      return null;
    }

    if (!user.isActive) {
      throw new BadRequestException('Account is deactivated');
    }

    if (user.isLocked) {
      throw new BadRequestException('Account is locked');
    }

    // Generate reset token
    const { token, expiresAt } = this.generateResetToken();

    // Update user
    user.passwordResetToken = token;
    user.passwordResetExpires = expiresAt;

    await this.userRepository.save(user);

    this.logger.log(`Password reset token generated for user: ${user.email}`);

    // TODO: Send password reset email

    return token;
  }
}
