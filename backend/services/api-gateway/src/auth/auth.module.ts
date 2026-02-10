import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RolesController } from './roles.controller';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Authentication Module
 * Validates Supabase JWT tokens using Supabase's auth.getUser()
 * Note: Login/register is handled by Supabase directly on the frontend.
 * This module only handles role retrieval and management.
 */
@Module({
  imports: [ConfigModule],
  controllers: [RolesController],
  providers: [SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
