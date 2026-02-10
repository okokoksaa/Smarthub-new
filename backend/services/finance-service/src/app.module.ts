import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseConfig } from '@shared/database';
import { BudgetModule } from './budget/budget.module';
import { PaymentsModule } from './payments/payments.module';

/**
 * Finance Service Main Module
 */
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event Emitter module for financial events
    EventEmitterModule.forRoot(),

    // Database module
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => DatabaseConfig.getTypeOrmConfig(),
      inject: [ConfigService],
    }),

    // Feature modules
    BudgetModule,
    PaymentsModule,
  ],
})
export class AppModule {}
