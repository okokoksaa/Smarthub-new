import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * JWT Payload Interface (Supabase format)
 */
export interface JwtPayload {
  sub: string; // User ID
  email?: string;
  aud?: string;
  role?: string;
  tenantScopeLevel?: string;
  iat?: number;
  exp?: number;
}

/**
 * User with roles for request attachment
 */
export interface UserWithRoles {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: string;
  tenantScopeLevel?: string;
  isActive: boolean;
  roles: string[];
}


/**
 * JWT Strategy
 * Validates Supabase JWT tokens and retrieves user with roles
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    const supabaseJwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET') || configService.get<string>('JWT_SECRET');

    if (!supabaseUrl || !supabaseJwtSecret) {
      throw new Error('SUPABASE_URL and SUPABASE_JWT_SECRET (or JWT_SECRET) must be set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use Supabase JWT secret or fall back to config
      secretOrKey: supabaseJwtSecret,
      // Supabase uses 'authenticated' as audience
      audience: 'authenticated',
      issuer: `${supabaseUrl}/auth/v1`,
    });

    this.supabase = createClient(
      supabaseUrl,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Validate JWT payload and return user with roles
   * This method is called by Passport after token verification
   */
  async validate(payload: JwtPayload): Promise<UserWithRoles> {
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    // Retrieve user from Supabase profiles table
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('id, email, first_name, last_name, is_active')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Profile might not exist yet - create it from auth user
      const { data: authUser } = await this.supabase.auth.admin.getUserById(userId);

      if (!authUser?.user) {
        throw new UnauthorizedException('User not found');
      }

      // Auto-create profile
      await this.supabase.from('profiles').upsert({
        id: userId,
        email: authUser.user.email,
        first_name: authUser.user.user_metadata?.first_name || '',
        last_name: authUser.user.user_metadata?.last_name || '',
        is_active: true,
      });

      // Return with the auth user info
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      return {
        id: userId,
        email: authUser.user.email || '',
        firstName: authUser.user.user_metadata?.first_name,
        lastName: authUser.user.user_metadata?.last_name,
        fullName: `${authUser.user.user_metadata?.first_name || ''} ${authUser.user.user_metadata?.last_name || ''}`.trim(),
        isActive: true,
        roles: (userRoles || []).map(r => r.role),
      };
    }

    if (!profile.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Retrieve user roles from user_roles table
    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = (userRoles || []).map(r => r.role);

    // Return user object with roles (will be attached to request.user)
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      isActive: profile.is_active,
      roles,
    };
  }
}
