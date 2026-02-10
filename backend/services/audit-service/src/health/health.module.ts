import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AuditLog } from '@shared/database';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [HealthController],
})
export class HealthModule {}