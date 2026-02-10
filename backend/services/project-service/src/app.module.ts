import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseConfig } from '@shared/database';
import { ProjectsModule } from './projects/projects.module';
import { MilestonesModule } from './milestones/milestones.module';

/**
 * Project Service Main Module
 */
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event Emitter module for lifecycle events
    EventEmitterModule.forRoot(),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => DatabaseConfig.getTypeOrmConfig(),
      inject: [ConfigService],
    }),

    // Feature modules
    ProjectsModule,
    MilestonesModule,
  ],
})
export class AppModule {}
