import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import {
  AuditLog,
  Project,
  Payment,
  User,
  Document,
} from '@shared/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      Project,
      Payment,
      User,
      Document,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}