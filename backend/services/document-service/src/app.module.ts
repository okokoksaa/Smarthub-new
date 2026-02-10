import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DocumentsModule } from './documents/documents.module';
import { StorageModule } from './storage/storage.module';
import { HealthController } from './health/health.controller';
import databaseConfig from './config/database.config';
import minioConfig from './config/minio.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, minioConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),

    // Event emitter for async operations
    EventEmitterModule.forRoot(),

    // Feature modules
    DocumentsModule,
    StorageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
