import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * App Service
 * Provides application-level services
 */
@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Health check
   * Returns service health status
   */
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
      supabase: {
        url: this.configService.get<string>('SUPABASE_URL'),
        configured: !!this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
      },
      database: {
        configured: !!(
          this.configService.get<string>('SUPABASE_DB_URL') ||
          this.configService.get<string>('DATABASE_URL') ||
          this.configService.get<string>('DB_HOST')
        ),
        source: this.configService.get<string>('SUPABASE_DB_URL')
          ? 'SUPABASE_DB_URL'
          : this.configService.get<string>('DATABASE_URL')
            ? 'DATABASE_URL'
            : this.configService.get<string>('DB_HOST')
              ? 'DB_HOST/DB_*'
              : 'unconfigured',
      },
    };
  }

  /**
   * Get system information
   */
  getInfo() {
    return {
      service: 'CDF Smart Hub API Gateway',
      version: '1.0.0',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      nodeVersion: process.version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
