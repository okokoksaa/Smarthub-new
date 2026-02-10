import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * User with roles interface for request attachment
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  isActive: boolean;
  roles: string[];
}

/**
 * Supabase Authentication Guard
 * Validates tokens using Supabase's auth.getUser() method
 * This bypasses JWT secret issues by using Supabase's built-in validation
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Validate token with Supabase - this uses the service role key
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        console.error('Supabase auth error:', error?.message);
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Fetch user profile
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id, email, first_name, last_name, is_active')
        .eq('id', user.id)
        .single();

      // Check if profile exists and is active
      if (profile && !profile.is_active) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Fetch user roles from user_roles table
      const { data: userRoles, error: rolesError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError.message);
      }

      const roles = (userRoles || []).map(r => r.role);

      // Build authenticated user object
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || '',
        firstName: profile?.first_name || user.user_metadata?.first_name,
        lastName: profile?.last_name || user.user_metadata?.last_name,
        fullName: profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          : `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        isActive: profile?.is_active ?? true,
        roles,
      };

      // Attach user to request
      request.user = authenticatedUser;

      console.log(`Auth successful for ${user.email} with roles: [${roles.join(', ')}]`);

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      console.error('Auth guard error:', err);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
