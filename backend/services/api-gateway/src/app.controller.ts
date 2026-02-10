import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

/**
 * App Controller
 * Provides health check and system information endpoints
 */
@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check endpoint
   */
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.appService.getHealth();
  }

  /**
   * System information endpoint
   */
  @Public()
  @Get('info')
  @ApiOperation({ summary: 'System information' })
  @ApiResponse({ status: 200, description: 'System information retrieved' })
  getInfo() {
    return this.appService.getInfo();
  }
}
