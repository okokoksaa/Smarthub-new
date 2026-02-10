import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@shared/database';

/**
 * Roles Decorator
 * Specify which roles can access a route
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
