import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Ward Access Guard
 * Ensures users can only access data from their assigned ward
 */
@Injectable()
export class WardAccessGuard implements CanActivate {
  private readonly logger = new Logger(WardAccessGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if ward access check is disabled for this route
    const skipWardCheck = this.reflector.get<boolean>('skipWardCheck', context.getHandler());
    if (skipWardCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // If no user, let the JWT guard handle authentication
      return true;
    }

    // Check if user has admin/provincial access
    if (this.hasAdminAccess(user)) {
      this.logger.debug(`Admin user ${user.id} granted access to ${request.method} ${request.url}`);
      return true;
    }

    // Extract wardId from request (query params, body, or route params)
    const requestedWardId = this.extractWardId(request);
    
    if (!requestedWardId) {
      // If no ward specified in request, allow (data will be filtered by service layer)
      return true;
    }

    // Check if user has access to the requested ward
    if (user.wardId !== requestedWardId) {
      this.logger.warn(
        `User ${user.id} (ward: ${user.wardId}) attempted to access ward ${requestedWardId}`
      );
      throw new ForbiddenException('You do not have access to this ward');
    }

    this.logger.debug(`User ${user.id} granted access to ward ${requestedWardId}`);
    return true;
  }

  private hasAdminAccess(user: any): boolean {
    const adminRoles = ['admin', 'provincial_admin', 'district_admin'];
    return user.roles?.some((role: string) => adminRoles.includes(role));
  }

  private extractWardId(request: any): string | null {
    // Check route parameters
    if (request.params?.wardId) {
      return request.params.wardId;
    }

    // Check query parameters
    if (request.query?.wardId) {
      return request.query.wardId;
    }

    // Check request body
    if (request.body?.wardId) {
      return request.body.wardId;
    }

    return null;
  }
}

/**
 * Skip Ward Check Decorator
 * Mark routes that should skip ward-level access control
 */
import { SetMetadata } from '@nestjs/common';
export const SkipWardCheck = () => SetMetadata('skipWardCheck', true);