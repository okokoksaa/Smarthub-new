import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No valid authorization header');
    }

    const token = authHeader.slice(7);

    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('first_name, last_name, is_active')
      .eq('id', user.id)
      .single();

    if (profile && profile.is_active === false) {
      throw new UnauthorizedException('Account is inactive');
    }

    const { data: userRoles } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    request.user = {
      id: user.id,
      email: user.email || '',
      firstName: profile?.first_name || user.user_metadata?.first_name,
      lastName: profile?.last_name || user.user_metadata?.last_name,
      fullName: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
      isActive: profile?.is_active ?? true,
      roles: (userRoles || []).map((r: any) => r.role),
    };

    return true;
  }
}
