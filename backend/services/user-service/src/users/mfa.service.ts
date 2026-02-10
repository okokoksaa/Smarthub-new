import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

/**
 * MFA Service
 * Handles Multi-Factor Authentication with TOTP
 */
@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly APP_NAME = 'CDF Smart Hub';
  private readonly BACKUP_CODES_COUNT = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate MFA secret and QR code
   */
  async setupMfa(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${user.email})`,
      issuer: this.APP_NAME,
      length: 32,
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store secret temporarily (not enabled yet)
    user.mfaSecret = secret.base32;

    await this.userRepository.save(user);

    this.logger.log(`MFA setup initiated for user: ${user.email}`);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMfa(
    userId: string,
    verificationCode: string,
    backupCodes: string[],
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'mfaSecret', 'mfaEnabled'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Call setupMfa first.');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Verify code
    const isValid = this.verifyToken(user.mfaSecret, verificationCode);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Hash and store backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashBackupCode(code)),
    );

    // Enable MFA
    user.mfaEnabled = true;
    user.mfaBackupCodes = JSON.stringify(hashedBackupCodes);

    await this.userRepository.save(user);

    this.logger.log(`MFA enabled for user: ${user.email}`);
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, verificationCode: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'mfaSecret', 'mfaEnabled'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Verify code
    const isValid = this.verifyToken(user.mfaSecret, verificationCode);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaBackupCodes = '[]';

    await this.userRepository.save(user);

    this.logger.log(`MFA disabled for user: ${user.email}`);
  }

  /**
   * Verify MFA token
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'mfaSecret', 'mfaEnabled', 'mfaBackupCodes'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    // Try TOTP verification first
    const isTotpValid = this.verifyToken(user.mfaSecret, token);

    if (isTotpValid) {
      this.logger.log(`MFA token verified for user: ${user.email}`);
      return true;
    }

    // Try backup codes
    const isBackupCodeValid = await this.verifyBackupCode(user, token);

    if (isBackupCodeValid) {
      this.logger.log(`MFA backup code used for user: ${user.email}`);
      return true;
    }

    this.logger.warn(`Invalid MFA token for user: ${user.email}`);
    return false;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(
    userId: string,
    verificationCode: string,
  ): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'mfaSecret', 'mfaEnabled'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Verify code
    const isValid = this.verifyToken(user.mfaSecret, verificationCode);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashBackupCode(code)),
    );

    // Update user
    user.mfaBackupCodes = JSON.stringify(hashedBackupCodes);

    await this.userRepository.save(user);

    this.logger.log(`Backup codes regenerated for user: ${user.email}`);

    return backupCodes;
  }

  /**
   * Verify TOTP token
   */
  private verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before and after current time
    });
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hash backup code
   */
  private async hashBackupCode(code: string): Promise<string> {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify backup code and consume it
   */
  private async verifyBackupCode(user: User, code: string): Promise<boolean> {
    if (!user.mfaBackupCodes) {
      return false;
    }

    let backupCodes: string[];
    try {
      backupCodes = JSON.parse(user.mfaBackupCodes);
    } catch (e) {
      return false;
    }

    if (backupCodes.length === 0) {
      return false;
    }

    const hashedCode = await this.hashBackupCode(code);

    const index = backupCodes.indexOf(hashedCode);

    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);
    user.mfaBackupCodes = JSON.stringify(backupCodes);

    await this.userRepository.save(user);

    return true;
  }
}
