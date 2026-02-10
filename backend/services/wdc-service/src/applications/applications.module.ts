import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { WdcApplication, WdcApplicationDocument } from './entities/application.entity';

/**
 * Applications Module
 * Handles WDC application management
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([WdcApplication, WdcApplicationDocument]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}