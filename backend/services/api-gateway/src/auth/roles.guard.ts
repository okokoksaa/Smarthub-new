import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Support array of roles from JwtStrategy
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles
      : (user.role ? [user.role] : []);

    // Super admin override
    if (userRoles.includes('super_admin')) {
      return true;
    }

    const roleAliases: Record<string, string[]> = {
      citizen: ['community_member'],
      community_member: ['citizen'],
    };

    const hasRole = requiredRoles.some((role) => {
      if (userRoles.includes(role)) return true;
      const aliases = roleAliases[role] || [];
      return aliases.some((alias) => userRoles.includes(alias));
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'none'}`
      );
    }

    return true;
  }
}
