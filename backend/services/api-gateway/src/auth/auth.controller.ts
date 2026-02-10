import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { User } from '@shared/database';

/**
 * Authentication Controller
 * Handles user authentication endpoints
 */
@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard) // Apply rate limiting to all auth endpoints
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly config: ConfigService) {}

  /**
   * User login endpoint
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' },
        tokenType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(loginDto);
  }

  /**
   * User registration endpoint
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      message: 'Registration successful. Please verify your email.',
    };
  }

  /**
   * Refresh token endpoint
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number' },
        tokenType: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string): Promise<AuthTokens> {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        fullName: { type: 'string' },
        role: { type: 'string' },
        tenantScopeLevel: { type: 'string' },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' },
        mfaEnabled: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: { user: User }) {
    const user = req.user;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      tenantScopeLevel: user.tenantScopeLevel,
      isActive: user.isActive,
      isVerified: user.isVerified,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt,
    };
  }

  /**
   * Logout endpoint
   * Note: With JWT, logout is primarily handled client-side by removing the token
   * This endpoint can be used for audit logging and token blacklisting if needed
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: { user: User }) {
    // TODO: Add token to blacklist if implementing token revocation
    // TODO: Log logout event in audit log

    return {
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current user's roles
   */
  @Get('roles')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user roles' })
  @ApiResponse({
    status: 200,
    description: 'Current user roles',
    schema: {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getRoles(@Request() req: { user: any }) {
    let roles: string[] = req.user?.roles || [];

    // Dev fallback: if roles are empty and DEV_ASSUME_SUPER_ADMIN=true, grant all roles for local testing
    const assume = this.config.get<string>('DEV_ASSUME_SUPER_ADMIN');
    if ((!roles || roles.length === 0) && assume === 'true') {
      roles = [
        'super_admin', 'ministry_official', 'auditor', 'plgo', 'tac_chair', 'tac_member',
        'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member', 'mp'
      ];
    }

    return { roles };
  }

  /**
   * Dev utility: Grant all roles to current user
   */
  @Post('dev/grant-all-roles')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[DEV] Grant all roles to current user' })
  @ApiResponse({ status: 200, description: 'Roles granted' })
  async grantAllRoles(@Request() req: { user: any }) {
    const enabled = this.config.get<string>('DEV_SELF_GRANT_ENABLED') === 'true';
    if (!enabled) {
      throw new ForbiddenException('Self grant disabled');
    }

    const allRoles = [
      'super_admin', 'ministry_official', 'auditor', 'plgo', 'tac_chair', 'tac_member',
      'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member', 'mp'
    ];

    const supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const rows = allRoles.map((role) => ({ user_id: req.user.id, role }));
    // Insert rows; rely on unique(user_id, role) to avoid duplicates
    const { error } = await supabase.from('user_roles').insert(rows);
    if (error) {
      throw new ForbiddenException('Failed to grant roles');
    }
    return { granted: allRoles };
  }

  /**
   * Debug: Return current user payload from JWT strategy
   */
  @Get('debug/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[DEBUG] Current user payload and roles' })
  async debugMe(@Request() req: { user: any }) {
    return req.user;
  }
}
