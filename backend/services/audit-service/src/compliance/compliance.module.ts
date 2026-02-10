import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import {
  AuditLog,
  Project,
  Payment,
  User,
} from '@shared/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      Project,
      Payment,
      User,
    ]),
  ],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}