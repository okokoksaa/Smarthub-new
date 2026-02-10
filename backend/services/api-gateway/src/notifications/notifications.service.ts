import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'action_required';
  category: 'payment' | 'project' | 'approval' | 'system' | 'audit';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface SmsPayload {
  to: string;
  message: string;
}

/**
 * Notification Service
 * Handles in-app notifications, emails, and SMS
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Send in-app notification (stored in database)
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const { error } = await this.supabase.from('notifications').insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        category: payload.category,
        action_url: payload.actionUrl,
        metadata: payload.metadata,
        is_read: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        this.logger.error(`Failed to send notification: ${error.message}`);
      } else {
        this.logger.log(`Notification sent to user ${payload.userId}: ${payload.title}`);
      }
    } catch (err) {
      this.logger.error(`Notification error: ${err.message}`);
    }
  }

  /**
   * Send notifications to multiple users
   */
  async sendBulkNotifications(
    userIds: string[],
    notification: Omit<NotificationPayload, 'userId'>,
  ): Promise<void> {
    const promises = userIds.map((userId) =>
      this.sendNotification({ ...notification, userId }),
    );
    await Promise.allSettled(promises);
  }

  /**
   * Send notification to users with specific roles
   */
  async notifyByRole(
    roles: string[],
    notification: Omit<NotificationPayload, 'userId'>,
    constituencyId?: string,
  ): Promise<void> {
    try {
      // Get users with the specified roles
      let query = this.supabase
        .from('user_roles')
        .select('user_id')
        .in('role', roles);

      const { data: userRoles, error } = await query;

      if (error) {
        this.logger.error(`Failed to fetch users by role: ${error.message}`);
        return;
      }

      const userIds = [...new Set(userRoles?.map((r) => r.user_id) || [])];

      if (userIds.length > 0) {
        await this.sendBulkNotifications(userIds, notification);
        this.logger.log(`Notified ${userIds.length} users with roles: ${roles.join(', ')}`);
      }
    } catch (err) {
      this.logger.error(`Role notification error: ${err.message}`);
    }
  }

  /**
   * Payment-specific notifications
   */
  async notifyPanelAApproval(paymentId: string, projectName: string): Promise<void> {
    await this.notifyByRole(
      ['mp', 'cdfc_chair', 'finance_officer'],
      {
        title: 'Payment Requires Panel A Approval',
        message: `Payment for project "${projectName}" requires your approval.`,
        type: 'action_required',
        category: 'payment',
        actionUrl: `/payments/${paymentId}`,
        metadata: { paymentId },
      },
    );
  }

  async notifyPanelBApproval(paymentId: string, projectName: string): Promise<void> {
    await this.notifyByRole(
      ['plgo', 'ministry_official'],
      {
        title: 'Payment Requires Panel B Approval',
        message: `Payment for project "${projectName}" has Panel A approval and requires Panel B authorization.`,
        type: 'action_required',
        category: 'payment',
        actionUrl: `/payments/${paymentId}`,
        metadata: { paymentId },
      },
    );
  }

  async notifyPaymentApproved(paymentId: string, projectName: string, amount: number): Promise<void> {
    await this.notifyByRole(
      ['finance_officer', 'cdfc_chair'],
      {
        title: 'Payment Fully Approved',
        message: `Payment of K${amount.toLocaleString()} for "${projectName}" is approved and ready for disbursement.`,
        type: 'success',
        category: 'payment',
        actionUrl: `/payments/${paymentId}`,
        metadata: { paymentId, amount },
      },
    );
  }

  async notifyPaymentRejected(
    paymentId: string,
    projectName: string,
    reason: string,
    requesterId: string,
  ): Promise<void> {
    await this.sendNotification({
      userId: requesterId,
      title: 'Payment Request Rejected',
      message: `Your payment request for "${projectName}" was rejected. Reason: ${reason}`,
      type: 'error',
      category: 'payment',
      actionUrl: `/payments/${paymentId}`,
      metadata: { paymentId, reason },
    });
  }

  /**
   * Project-specific notifications
   */
  async notifyProjectApprovalNeeded(projectId: string, projectName: string): Promise<void> {
    await this.notifyByRole(
      ['tac_chair', 'tac_member', 'cdfc_chair'],
      {
        title: 'Project Requires Review',
        message: `Project "${projectName}" is awaiting committee review.`,
        type: 'action_required',
        category: 'project',
        actionUrl: `/projects/${projectId}`,
        metadata: { projectId },
      },
    );
  }

  async notifyProjectStatusChange(
    projectId: string,
    projectName: string,
    newStatus: string,
    stakeholderIds: string[],
  ): Promise<void> {
    await this.sendBulkNotifications(stakeholderIds, {
      title: 'Project Status Updated',
      message: `Project "${projectName}" status changed to: ${newStatus}`,
      type: 'info',
      category: 'project',
      actionUrl: `/projects/${projectId}`,
      metadata: { projectId, status: newStatus },
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(payload: EmailPayload): Promise<boolean> {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured, skipping email');
      return false;
    }

    try {
      // Using fetch to call SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: this.configService.get('EMAIL_FROM', 'noreply@cdfsmarthub.com') },
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.body },
            ...(payload.html ? [{ type: 'text/html', value: payload.html }] : []),
          ],
        }),
      });

      if (response.ok) {
        this.logger.log(`Email sent to ${payload.to}`);
        return true;
      } else {
        this.logger.error(`Email failed: ${response.statusText}`);
        return false;
      }
    } catch (err) {
      this.logger.error(`Email error: ${err.message}`);
      return false;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSms(payload: SmsPayload): Promise<boolean> {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      this.logger.warn('Africa\'s Talking credentials not configured, skipping SMS');
      return false;
    }

    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          username,
          to: payload.to,
          message: payload.message,
        }),
      });

      if (response.ok) {
        this.logger.log(`SMS sent to ${payload.to}`);
        return true;
      } else {
        this.logger.error(`SMS failed: ${response.statusText}`);
        return false;
      }
    } catch (err) {
      this.logger.error(`SMS error: ${err.message}`);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return 0;
    }

    return count || 0;
  }
}
