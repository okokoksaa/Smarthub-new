import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Module
 * Provides health check endpoints for the WDC service
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}