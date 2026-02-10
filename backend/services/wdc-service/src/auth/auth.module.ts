import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt.guard';
import { WardAccessGuard } from './ward-access.guard';
import { RolesGuard } from './roles.guard';

/**
 * Authentication Module
 * Provides authentication and authorization guards globally
 */
@Global()
@Module({
  providers: [
    JwtAuthGuard,
    WardAccessGuard,
    RolesGuard,
    // Apply JWT authentication globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply ward-level access control globally
    {
      provide: APP_GUARD,
      useClass: WardAccessGuard,
    },
    // Apply role-based access control globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [JwtAuthGuard, WardAccessGuard, RolesGuard],
})
export class AuthModule {}