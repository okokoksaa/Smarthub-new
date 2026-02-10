import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './entities/database.config';
import { UsersModule } from './users/users.module';

/**
 * User Service Main Module
 */
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database module
    TypeOrmModule.forRoot(DatabaseConfig),

    // Feature modules
    UsersModule,
  ],
})
export class AppModule {}
