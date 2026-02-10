import { SetMetadata } from '@nestjs/common';

/**
 * User Roles Enum
 */
export enum UserRole {
  ADMIN = 'admin',
  PROVINCIAL_ADMIN = 'provincial_admin',
  DISTRICT_ADMIN = 'district_admin',
  CONSTITUENCY_COORDINATOR = 'constituency_coordinator',
  WDC_CHAIRPERSON = 'wdc_chairperson',
  WDC_SECRETARY = 'wdc_secretary',
  WDC_MEMBER = 'wdc_member',
  COMMUNITY_MEMBER = 'community_member',
  APPLICANT = 'applicant',
}

/**
 * Roles Decorator
 * Specify required roles for route access
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

/**
 * Role Hierarchy for Access Control
 * Higher level roles inherit permissions from lower levels
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: Object.values(UserRole), // Admin has all permissions
  [UserRole.PROVINCIAL_ADMIN]: [
    UserRole.DISTRICT_ADMIN,
    UserRole.CONSTITUENCY_COORDINATOR,
    UserRole.WDC_CHAIRPERSON,
    UserRole.WDC_SECRETARY,
    UserRole.WDC_MEMBER,
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.DISTRICT_ADMIN]: [
    UserRole.CONSTITUENCY_COORDINATOR,
    UserRole.WDC_CHAIRPERSON,
    UserRole.WDC_SECRETARY,
    UserRole.WDC_MEMBER,
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.CONSTITUENCY_COORDINATOR]: [
    UserRole.WDC_CHAIRPERSON,
    UserRole.WDC_SECRETARY,
    UserRole.WDC_MEMBER,
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.WDC_CHAIRPERSON]: [
    UserRole.WDC_SECRETARY,
    UserRole.WDC_MEMBER,
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.WDC_SECRETARY]: [
    UserRole.WDC_MEMBER,
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.WDC_MEMBER]: [
    UserRole.COMMUNITY_MEMBER,
    UserRole.APPLICANT,
  ],
  [UserRole.COMMUNITY_MEMBER]: [
    UserRole.APPLICANT,
  ],
  [UserRole.APPLICANT]: [],
};

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRoles: string[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(requiredRole => 
    userRoles.some(userRole => {
      // Check direct role match
      if (userRole === requiredRole) return true;
      
      // Check role hierarchy
      const userRoleEnum = userRole as UserRole;
      const allowedRoles = ROLE_HIERARCHY[userRoleEnum] || [];
      return allowedRoles.includes(requiredRole);
    })
  );
}