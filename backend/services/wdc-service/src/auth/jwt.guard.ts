import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';

/**
 * JWT Authentication Guard
 * Validates JWT tokens and extracts user information
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'default-secret-key';

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      
      // Attach user information to request
      request.user = {
        id: payload.sub || payload.userId,
        username: payload.username,
        email: payload.email,
        roles: payload.roles || [],
        wardId: payload.wardId,
        constituencyId: payload.constituencyId,
        districtId: payload.districtId,
        provinceId: payload.provinceId,
      };

      this.logger.debug(`Authenticated user ${request.user.id} for ${request.method} ${request.url}`);
      
      return true;
    } catch (error) {
      this.logger.warn(`Invalid token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

/**
 * Public Route Decorator
 * Mark routes that don't require authentication
 */
import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('isPublic', true);