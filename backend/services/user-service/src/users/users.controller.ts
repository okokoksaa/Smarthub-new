import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { PasswordService } from './password.service';
import { MfaService } from './mfa.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ChangePasswordDto,
  ResetPasswordDto,
  RequestPasswordResetDto,
} from './dto/change-password.dto';
import {
  EnableMfaDto,
  VerifyMfaDto,
  DisableMfaDto,
  RegenerateBackupCodesDto,
} from './dto/mfa.dto';
import { UserRole } from '../entities/user.entity';

/**
 * Users Controller
 * Handles all user management endpoints
 */
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly mfaService: MfaService,
  ) {}

  // ==================== User CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      role,
      isActive: isActive !== undefined ? isActive === true : undefined,
      search,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email or National ID already in use' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiResponse({ status: 204, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  // ==================== Email Verification ====================

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyEmail(@Body('token') token: string) {
    return this.usersService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  resendVerification(@Body('email') email: string) {
    return this.usersService.resendVerification(email);
  }

  // ==================== Account Management ====================

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock user account' })
  @ApiResponse({ status: 200, description: 'Account locked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  lockAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.usersService.lockAccount(id, reason);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock user account' })
  @ApiResponse({ status: 200, description: 'Account unlocked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  unlockAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unlockAccount(id);
  }

  // ==================== Password Management ====================

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.passwordService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.passwordService.initiatePasswordReset(dto.email);
    return {
      message: 'If your email exists in our system, you will receive a password reset link',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }

  // ==================== MFA Management ====================

  @Post('mfa/setup')
  @ApiOperation({ summary: 'Setup MFA for user' })
  @ApiResponse({
    status: 200,
    description: 'MFA setup initiated. Returns secret and QR code.',
  })
  @ApiResponse({ status: 400, description: 'MFA already enabled' })
  setupMfa(@Request() req: any) {
    return this.mfaService.setupMfa(req.user.id);
  }

  @Post('mfa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable MFA after verification' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async enableMfa(@Request() req: any, @Body() enableMfaDto: EnableMfaDto) {
    await this.mfaService.enableMfa(
      req.user.id,
      enableMfaDto.verificationCode,
      enableMfaDto.backupCodes,
    );
    return { message: 'MFA enabled successfully' };
  }

  @Post('mfa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async disableMfa(@Request() req: any, @Body() disableMfaDto: DisableMfaDto) {
    await this.mfaService.disableMfa(req.user.id, disableMfaDto.verificationCode);
    return { message: 'MFA disabled successfully' };
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify MFA token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async verifyMfa(@Request() req: any, @Body() verifyMfaDto: VerifyMfaDto) {
    const isValid = await this.mfaService.verifyMfaToken(req.user.id, verifyMfaDto.code);
    return { valid: isValid };
  }

  @Post('mfa/regenerate-backup-codes')
  @ApiOperation({ summary: 'Regenerate MFA backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification code or MFA not enabled' })
  regenerateBackupCodes(
    @Request() req: any,
    @Body() dto: RegenerateBackupCodesDto,
  ) {
    return this.mfaService.regenerateBackupCodes(req.user.id, dto.verificationCode);
  }
}
