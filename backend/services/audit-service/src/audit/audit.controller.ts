import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService, AuditQuery } from './audit.service';
import {
  AuditLog,
  AuditAction,
  AuditEntity,
} from '@shared/database';

export class CreateAuditLogDto {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  userId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditQueryDto {
  action?: AuditAction | AuditAction[];
  entity?: AuditEntity | AuditEntity[];
  userId?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  constituency?: string;
  page?: number;
  limit?: number;
}

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('log')
  @ApiOperation({ summary: 'Create audit log entry' })
  @ApiResponse({
    status: 201,
    description: 'Audit log entry created successfully',
    type: AuditLog,
  })
  async logAction(@Body() createDto: CreateAuditLogDto): Promise<AuditLog> {
    return this.auditService.logAction(
      createDto.action,
      createDto.entity,
      createDto.entityId,
      createDto.userId,
      createDto.details || {},
      createDto.ipAddress,
      createDto.userAgent,
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        logs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getAuditLogs(@Query() queryDto: AuditQueryDto): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Convert string dates to Date objects
    const query: AuditQuery = {
      ...queryDto,
      dateFrom: queryDto.dateFrom ? new Date(queryDto.dateFrom) : undefined,
      dateTo: queryDto.dateTo ? new Date(queryDto.dateTo) : undefined,
    };

    return this.auditService.getAuditLogs(query);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    type: AuditLog,
  })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLogById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AuditLog> {
    return this.auditService.getAuditLogById(id);
  }

  @Get('trail/:entity/:entityId')
  @ApiOperation({ summary: 'Get complete audit trail for an entity' })
  @ApiResponse({
    status: 200,
    description: 'Audit trail retrieved successfully',
    type: [AuditLog],
  })
  async getEntityAuditTrail(
    @Param('entity') entity: AuditEntity,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.getEntityAuditTrail(entity, entityId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive audit statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalEntries: { type: 'number' },
        entriesLast30Days: { type: 'number' },
        actionsBreakdown: { type: 'object' },
        entitiesBreakdown: { type: 'object' },
        topUsers: { type: 'array' },
        topIpAddresses: { type: 'array' },
        dailyActivity: { type: 'array' },
        riskEvents: { type: 'number' },
        integrityStatus: { type: 'object' },
      },
    },
  })
  async getAuditStatistics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<any> {
    const fromDate = dateFrom ? new Date(dateFrom) : undefined;
    const toDate = dateTo ? new Date(dateTo) : undefined;

    return this.auditService.getAuditStatistics(fromDate, toDate);
  }

  @Get('integrity/verify')
  @ApiOperation({ summary: 'Verify audit log integrity using hash chain' })
  @ApiResponse({
    status: 200,
    description: 'Integrity verification completed',
    schema: {
      type: 'object',
      properties: {
        totalEntries: { type: 'number' },
        verifiedEntries: { type: 'number' },
        integrityPercentage: { type: 'number' },
        lastVerificationDate: { type: 'string', format: 'date-time' },
        brokenChains: { type: 'array' },
      },
    },
  })
  async verifyIntegrity(): Promise<any> {
    return this.auditService.verifyAuditIntegrity();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search audit logs with advanced filters' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: [AuditLog],
  })
  async searchAuditLogs(
    @Query('q') searchTerm: string,
    @Query() filters: AuditQueryDto,
  ): Promise<AuditLog[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new BadRequestException('Search term is required');
    }

    const query: AuditQuery = {
      action: filters.action,
      entity: filters.entity,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };

    return this.auditService.searchAuditLogs(searchTerm, query);
  }

  @Get('user/:userId/activity')
  @ApiOperation({ summary: 'Get user activity summary' })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalActions: { type: 'number' },
        actionsByType: { type: 'object' },
        entitiesByType: { type: 'object' },
        dailyActivity: { type: 'array' },
        recentActions: { type: 'array' },
      },
    },
  })
  async getUserActivity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('days') days?: number,
  ): Promise<any> {
    const activityDays = days && days > 0 && days <= 365 ? days : 30;
    return this.auditService.getUserActivity(userId, activityDays);
  }

  @Get('entities/:entity/statistics')
  @ApiOperation({ summary: 'Get audit statistics for specific entity type' })
  @ApiResponse({
    status: 200,
    description: 'Entity audit statistics retrieved successfully',
  })
  async getEntityStatistics(
    @Param('entity') entity: AuditEntity,
    @Query('days') days?: number,
  ): Promise<any> {
    const queryDays = days && days > 0 && days <= 365 ? days : 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - queryDays);

    const query: AuditQuery = {
      entity,
      dateFrom: startDate,
      dateTo: endDate,
    };

    const result = await this.auditService.getAuditLogs(query);
    
    // Calculate entity-specific statistics
    const actionCounts: Record<string, number> = {};
    result.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      entity,
      totalLogs: result.total,
      periodDays: queryDays,
      actionBreakdown: actionCounts,
      logs: result.logs.slice(0, 10), // Recent 10 logs
    };
  }

  @Post('integrity/manual-check')
  @ApiOperation({ summary: 'Trigger manual integrity check' })
  @ApiResponse({
    status: 200,
    description: 'Manual integrity check completed',
  })
  async triggerManualIntegrityCheck(): Promise<{ 
    message: string; 
    integrityStatus: any;
  }> {
    const integrityStatus = await this.auditService.verifyAuditIntegrity();
    
    return {
      message: 'Manual integrity check completed',
      integrityStatus,
    };
  }
}