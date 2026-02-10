import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/jwt.guard';

/**
 * Health Controller
 * Provides health check endpoints
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  /**
   * Health check endpoint
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'wdc-service',
      version: '1.0.0',
      checks: {
        database: 'up',
      },
    };
  }
}