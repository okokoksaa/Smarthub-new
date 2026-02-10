import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Milestone, Project } from '@shared/database';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

/**
 * Milestones Module
 * Handles project milestone tracking and management
 */
@Module({
  imports: [TypeOrmModule.forFeature([Milestone, Project])],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
