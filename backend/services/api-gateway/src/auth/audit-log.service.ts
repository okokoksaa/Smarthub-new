import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit Log Service
 * Records security-relevant events for compliance and monitoring
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.supabase.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        details: entry.details || {},
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        created_at: new Date().toISOString(),
      });

      this.logger.debug(`Audit: ${entry.action} on ${entry.resource} by ${entry.userId}`);
    } catch (err) {
      this.logger.error(`Audit log error: ${err.message}`);
    }
  }

  /**
   * Log login event
   */
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      details: { success: true },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(email: string, reason: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId: 'anonymous',
      action: 'LOGIN_FAILED',
      resource: 'auth',
      details: { email, reason },
      ipAddress,
    });
  }

  /**
   * Log logout event
   */
  async logLogout(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
      ipAddress,
    });
  }

  /**
   * Log role change
   */
  async logRoleChange(
    userId: string,
    targetUserId: string,
    oldRoles: string[],
    newRoles: string[],
  ): Promise<void> {
    await this.log({
      userId,
      action: 'ROLE_CHANGE',
      resource: 'user',
      resourceId: targetUserId,
      details: { oldRoles, newRoles },
    });
  }

  /**
   * Log payment approval
   */
  async logPaymentApproval(
    userId: string,
    paymentId: string,
    panel: 'A' | 'B',
    approved: boolean,
    reason?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: approved ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
      resource: 'payment',
      resourceId: paymentId,
      details: { panel, reason },
    });
  }

  /**
   * Log data export
   */
  async logDataExport(userId: string, exportType: string, recordCount: number): Promise<void> {
    await this.log({
      userId,
      action: 'DATA_EXPORT',
      resource: exportType,
      details: { recordCount },
    });
  }
}
