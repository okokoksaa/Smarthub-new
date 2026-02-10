import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AuditLog,
  AuditAction,
  AuditEntity,
  User,
  Project,
  Payment,
} from '@shared/database';

export interface AuditQuery {
  action?: AuditAction | AuditAction[];
  entity?: AuditEntity | AuditEntity[];
  userId?: string;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  ipAddress?: string;
  constituency?: string;
  page?: number;
  limit?: number;
}

export interface AuditStatistics {
  totalEntries: number;
  entriesLast30Days: number;
  actionsBreakdown: Record<string, number>;
  entitiesBreakdown: Record<string, number>;
  topUsers: Array<{ userId: string; userName: string; actionCount: number }>;
  topIpAddresses: Array<{ ipAddress: string; actionCount: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  riskEvents: number;
  integrityStatus: {
    totalEntries: number;
    verifiedEntries: number;
    integrityPercentage: number;
    lastVerificationDate: Date;
    brokenChains: Array<{
      entryId: string;
      expectedHash: string;
      actualHash: string;
      timestamp: Date;
    }>;
  };
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create new audit log entry
   */
  async logAction(
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    userId: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    // Get previous entry for hash chaining
    const previousEntry = await this.auditLogRepository.findOne({
      order: { createdAt: 'DESC', id: 'DESC' },
    });

    // Calculate current entry hash
    const currentData = {
      action,
      entity,
      entityId,
      userId,
      details,
      timestamp: new Date().toISOString(),
      ipAddress,
    };

    const currentDataString = JSON.stringify(currentData, Object.keys(currentData).sort());
    const currentHash = this.calculateHash(currentDataString);

    // Calculate chain hash (includes previous entry hash)
    const chainData = previousEntry 
      ? `${previousEntry.hashChain}:${currentHash}`
      : `genesis:${currentHash}`;
    const chainHash = this.calculateHash(chainData);

    // Create audit entry
    const auditEntry = this.auditLogRepository.create({
      action,
      entity,
      entityId,
      userId,
      details,
      ipAddress,
      userAgent,
      dataHash: currentHash,
      hashChain: chainHash,
      previousEntryId: previousEntry?.id,
    });

    const saved = await this.auditLogRepository.save(auditEntry);

    this.logger.log(
      `Audit logged: ${action} on ${entity}:${entityId} by user:${userId}`,
    );

    return saved;
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(query: AuditQuery): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 1000);
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // Apply filters
    if (query.action) {
      const actions = Array.isArray(query.action) ? query.action : [query.action];
      queryBuilder.andWhere('audit.action IN (:...actions)', { actions });
    }

    if (query.entity) {
      const entities = Array.isArray(query.entity) ? query.entity : [query.entity];
      queryBuilder.andWhere('audit.entity IN (:...entities)', { entities });
    }

    if (query.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: query.userId });
    }

    if (query.entityId) {
      queryBuilder.andWhere('audit.entityId = :entityId', { entityId: query.entityId });
    }

    if (query.dateFrom && query.dateTo) {
      queryBuilder.andWhere('audit.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
      });
    } else if (query.dateFrom) {
      queryBuilder.andWhere('audit.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    } else if (query.dateTo) {
      queryBuilder.andWhere('audit.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.ipAddress) {
      queryBuilder.andWhere('audit.ipAddress = :ipAddress', { ipAddress: query.ipAddress });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total, page, limit };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!auditLog) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return auditLog;
  }

  /**
   * Get audit trail for specific entity
   */
  async getEntityAuditTrail(entity: AuditEntity, entityId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entity, entityId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get comprehensive audit statistics
   */
  async getAuditStatistics(dateFrom?: Date, dateTo?: Date): Promise<AuditStatistics> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (dateFrom && dateTo) {
      queryBuilder.where('audit.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    const allLogs = await queryBuilder.getMany();
    const totalEntries = allLogs.length;

    // Entries in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = await this.auditLogRepository.count({
      where: { createdAt: Between(thirtyDaysAgo, new Date()) },
    });

    // Actions breakdown
    const actionsBreakdown: Record<string, number> = {};
    allLogs.forEach(log => {
      actionsBreakdown[log.action] = (actionsBreakdown[log.action] || 0) + 1;
    });

    // Entities breakdown
    const entitiesBreakdown: Record<string, number> = {};
    allLogs.forEach(log => {
      entitiesBreakdown[log.entity] = (entitiesBreakdown[log.entity] || 0) + 1;
    });

    // Top users
    const userCounts: Record<string, number> = {};
    allLogs.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });

    const topUserIds = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId]) => userId);

    const topUsersData = await this.userRepository.find({
      where: { id: In(topUserIds) },
    });

    const topUsers = topUserIds.map(userId => {
      const userData = topUsersData.find(u => u.id === userId);
      return {
        userId,
        userName: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown User',
        actionCount: userCounts[userId],
      };
    });

    // Top IP addresses
    const ipCounts: Record<string, number> = {};
    allLogs.forEach(log => {
      if (log.ipAddress) {
        ipCounts[log.ipAddress] = (ipCounts[log.ipAddress] || 0) + 1;
      }
    });

    const topIpAddresses = Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ipAddress, actionCount]) => ({ ipAddress, actionCount }));

    // Daily activity (last 30 days)
    const dailyActivity = await this.getDailyActivity(30);

    // Risk events (high-risk actions)
    const riskActions = [
      AuditAction.DELETE,
      AuditAction.ADMIN_ACTION,
      AuditAction.BULK_UPDATE,
      AuditAction.PERMISSION_CHANGE,
    ];
    const riskEvents = allLogs.filter(log => riskActions.includes(log.action)).length;

    // Integrity verification
    const integrityStatus = await this.verifyAuditIntegrity();

    return {
      totalEntries,
      entriesLast30Days: recentLogs,
      actionsBreakdown,
      entitiesBreakdown,
      topUsers,
      topIpAddresses,
      dailyActivity,
      riskEvents,
      integrityStatus,
    };
  }

  /**
   * Verify audit log integrity using hash chain
   */
  async verifyAuditIntegrity(): Promise<AuditStatistics['integrityStatus']> {
    const logs = await this.auditLogRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    const brokenChains: Array<{
      entryId: string;
      expectedHash: string;
      actualHash: string;
      timestamp: Date;
    }> = [];

    let verifiedEntries = 0;

    for (let i = 0; i < logs.length; i++) {
      const current = logs[i];
      const previous = i > 0 ? logs[i - 1] : null;

      // Verify current entry's data hash
      const currentData = {
        action: current.action,
        entity: current.entity,
        entityId: current.entityId,
        userId: current.userId,
        details: current.details,
        timestamp: current.createdAt.toISOString(),
        ipAddress: current.ipAddress,
      };

      const currentDataString = JSON.stringify(currentData, Object.keys(currentData).sort());
      const expectedDataHash = this.calculateHash(currentDataString);

      if (current.dataHash !== expectedDataHash) {
        brokenChains.push({
          entryId: current.id,
          expectedHash: expectedDataHash,
          actualHash: current.dataHash,
          timestamp: current.createdAt,
        });
        continue;
      }

      // Verify chain hash
      const chainData = previous 
        ? `${previous.hashChain}:${current.dataHash}`
        : `genesis:${current.dataHash}`;
      const expectedChainHash = this.calculateHash(chainData);

      if (current.hashChain !== expectedChainHash) {
        brokenChains.push({
          entryId: current.id,
          expectedHash: expectedChainHash,
          actualHash: current.hashChain,
          timestamp: current.createdAt,
        });
        continue;
      }

      verifiedEntries++;
    }

    const integrityPercentage = logs.length > 0 ? (verifiedEntries / logs.length) * 100 : 100;

    return {
      totalEntries: logs.length,
      verifiedEntries,
      integrityPercentage: Math.round(integrityPercentage * 100) / 100,
      lastVerificationDate: new Date(),
      brokenChains,
    };
  }

  /**
   * Get daily activity for the last N days
   */
  private async getDailyActivity(days: number): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyActivity: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.auditLogRepository.count({
        where: {
          createdAt: Between(currentDate, nextDate),
        },
      });

      dailyActivity.push({
        date: currentDate.toISOString().split('T')[0],
        count,
      });
    }

    return dailyActivity;
  }

  /**
   * Search audit logs with advanced filters
   */
  async searchAuditLogs(searchTerm: string, filters: AuditQuery = {}): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .where(
        '(audit.entityId ILIKE :searchTerm OR CAST(audit.details AS TEXT) ILIKE :searchTerm OR user.email ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('audit.createdAt', 'DESC')
      .take(100);

    // Apply additional filters
    if (filters.action) {
      const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
      queryBuilder.andWhere('audit.action IN (:...actions)', { actions });
    }

    if (filters.entity) {
      const entities = Array.isArray(filters.entity) ? filters.entity : [filters.entity];
      queryBuilder.andWhere('audit.entity IN (:...entities)', { entities });
    }

    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere('audit.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, days: number = 30): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    entitiesByType: Record<string, number>;
    dailyActivity: Array<{ date: string; count: number }>;
    recentActions: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.auditLogRepository.find({
      where: {
        userId,
        createdAt: Between(startDate, new Date()),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // Actions by type
    const actionsByType: Record<string, number> = {};
    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    });

    // Entities by type
    const entitiesByType: Record<string, number> = {};
    logs.forEach(log => {
      entitiesByType[log.entity] = (entitiesByType[log.entity] || 0) + 1;
    });

    // Daily activity
    const dailyActivity = await this.getUserDailyActivity(userId, days);

    return {
      totalActions: logs.length,
      actionsByType,
      entitiesByType,
      dailyActivity,
      recentActions: logs.slice(0, 20),
    };
  }

  /**
   * Get user's daily activity
   */
  private async getUserDailyActivity(
    userId: string,
    days: number,
  ): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyActivity: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.auditLogRepository.count({
        where: {
          userId,
          createdAt: Between(currentDate, nextDate),
        },
      });

      dailyActivity.push({
        date: currentDate.toISOString().split('T')[0],
        count,
      });
    }

    return dailyActivity;
  }

  /**
   * Calculate SHA-256 hash
   */
  private calculateHash(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Cleanup old audit logs (retention policy)
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs(): Promise<void> {
    const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'); // 7 years default
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedLogs = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleanup: Deleted ${deletedLogs.affected} audit logs older than ${retentionDays} days`,
    );
  }

  /**
   * Daily integrity check
   * Runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async dailyIntegrityCheck(): Promise<void> {
    this.logger.log('Starting daily audit integrity check...');

    const integrityStatus = await this.verifyAuditIntegrity();

    if (integrityStatus.integrityPercentage < 100) {
      this.logger.error(
        `Audit integrity compromised! ${integrityStatus.brokenChains.length} broken chains detected`,
      );
      
      // In a real implementation, this should trigger alerts to administrators
      // You might want to send notifications or integrate with monitoring systems
    } else {
      this.logger.log('Audit integrity check passed - all entries verified');
    }
  }
}