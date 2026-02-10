import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasRequiredRole } from './roles.decorator';

/**
 * Roles Guard
 * Enforces role-based access control
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    
    if (!requiredRoles) {
      // No roles specified, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles || [];
    
    if (!hasRequiredRole(userRoles, requiredRoles)) {
      this.logger.warn(
        `User ${user.id} with roles [${userRoles.join(', ')}] attempted to access endpoint requiring roles [${requiredRoles.join(', ')}]`
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(`User ${user.id} granted access with roles [${userRoles.join(', ')}]`);
    return true;
  }
}