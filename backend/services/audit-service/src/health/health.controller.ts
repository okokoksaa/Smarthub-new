import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@shared/database';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        database: { type: 'object' },
        version: { type: 'string' },
      },
    },
  })
  async getHealth(): Promise<any> {
    const startTime = Date.now();
    
    // Test database connection
    let databaseStatus = 'healthy';
    let databaseResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      await this.auditLogRepository.count();
      databaseResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      databaseStatus = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;

    return {
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime,
      database: {
        status: databaseStatus,
        responseTime: databaseResponseTime,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'audit-service',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with system metrics' })
  @ApiResponse({
    status: 200,
    description: 'Detailed service health status',
  })
  async getDetailedHealth(): Promise<any> {
    const healthInfo = await this.getHealth();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

    // Recent audit activity
    let recentAuditCount = 0;
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      recentAuditCount = await this.auditLogRepository.count({
        where: {
          createdAt: oneDayAgo as any,
        },
      });
    } catch (error) {
      // Ignore error for health check
    }

    return {
      ...healthInfo,
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
        memory: {
          rss: `${formatBytes(memoryUsage.rss)} MB`,
          heapTotal: `${formatBytes(memoryUsage.heapTotal)} MB`,
          heapUsed: `${formatBytes(memoryUsage.heapUsed)} MB`,
          external: `${formatBytes(memoryUsage.external)} MB`,
        },
        cpu: {
          usage: process.cpuUsage(),
        },
      },
      metrics: {
        recentAuditEntries: recentAuditCount,
      },
      checks: {
        database: healthInfo.database.status === 'healthy',
        memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9,
        uptime: process.uptime() > 60, // Service has been up for at least 1 minute
      },
    };
  }
}