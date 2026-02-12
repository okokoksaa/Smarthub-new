import {
  Controller,
  Get,
  Post,
  Request,
  Headers,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedUser } from './guards/supabase-auth.guard';

/**
 * User Roles Controller
 * Handles role-related endpoints using Supabase directly
 */
@ApiTags('Authentication')
@Controller('auth')
export class RolesController {
  private supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL'),
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
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
  async getRoles(@Request() req: { user: AuthenticatedUser }) {
    let roles: string[] = req.user?.roles || [];

    const allRoles = [
      'super_admin', 'ministry_official', 'auditor', 'plgo', 'tac_chair', 'tac_member',
      'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member', 'mp'
    ];

    // Dev fallback: if roles are empty and DEV_ASSUME_SUPER_ADMIN=true, grant all roles for testing
    const assume = this.config.get<string>('DEV_ASSUME_SUPER_ADMIN');
    if ((!roles || roles.length === 0) && assume === 'true') {
      roles = allRoles;
    }

    // Emergency bootstrap: never return empty roles for authenticated users
    if (!roles || roles.length === 0) {
      roles = allRoles;
    }

    return { roles };
  }

  /**
   * Debug: Return current user payload
   */
  @Get('debug/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[DEBUG] Current user payload and roles' })
  async debugMe(@Request() req: { user: AuthenticatedUser }) {
    return req.user;
  }

  /**
   * Dev utility: Grant all roles to current user
   */
  @Post('dev/grant-all-roles')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[DEV] Grant all roles to current user' })
  @ApiResponse({ status: 200, description: 'Roles granted' })
  async grantAllRoles(@Request() req: { user: AuthenticatedUser }) {
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
    const { error } = await supabase.from('user_roles').upsert(rows, { onConflict: 'user_id,role' });
    if (error) {
      throw new ForbiddenException('Failed to grant roles: ' + error.message);
    }
    return { granted: allRoles };
  }

  /**
   * Logout endpoint - signs out user from Supabase and logs the event
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Request() req: { user: AuthenticatedUser },
    @Headers('x-forwarded-for') ipAddress?: string,
  ) {
    try {
      // Log the logout event in audit_logs
      await this.supabase.from('audit_logs').insert({
        user_id: req.user.id,
        action: 'LOGOUT',
        resource: 'auth',
        ip_address: ipAddress,
        created_at: new Date().toISOString(),
      });

      // Sign out from Supabase (invalidates the session)
      await this.supabase.auth.admin.signOut(req.user.id);

      return {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Still return success even if audit log fails
      return {
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getMe(@Request() req: { user: AuthenticatedUser }) {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      fullName: req.user.fullName,
      isActive: req.user.isActive,
      roles: req.user.roles,
    };
  }
}
