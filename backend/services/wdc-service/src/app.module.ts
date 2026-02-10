import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from './applications/applications.module';
import { MeetingsModule } from './meetings/meetings.module';
import { MinutesModule } from './minutes/minutes.module';
import { PollsModule } from './polls/polls.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { SignoffsController } from './signoffs/signoffs.controller';

/**
 * WDC Service Application Module
 * Main module for Ward Development Committee operations
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database connection
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'cdf_smarthub',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Always use migrations in production
        logging: process.env.DB_LOGGING === 'true',
        ssl: process.env.DB_SSL_ENABLED === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
          min: parseInt(process.env.DB_POOL_MIN, 10) || 5,
        },
      }),
    }),

    // Authentication and Authorization
    AuthModule,

    // Feature modules
    ApplicationsModule,
    MeetingsModule,
    MinutesModule,
    PollsModule,
    HealthModule,
  ],
  controllers: [SignoffsController],
  providers: [],
})
export class AppModule {}
