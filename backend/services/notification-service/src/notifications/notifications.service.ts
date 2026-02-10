import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationCategory,
  NotificationPriority,
} from '@shared/database';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { PushService } from '../push/push.service';

export interface CreateNotificationDto {
  type: NotificationType | NotificationType[];
  category: NotificationCategory;
  priority?: NotificationPriority;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  deviceToken?: string;
  subject: string;
  body: string;
  htmlBody?: string;
  data?: Record<string, any>;
  templateName?: string;
  templateData?: Record<string, any>;
  projectId?: string;
  paymentId?: string;
  documentId?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create and send notification(s)
   */
  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<Notification[]> {
    const types = Array.isArray(createDto.type)
      ? createDto.type
      : [createDto.type];

    const notifications: Notification[] = [];

    // Create a notification for each type
    for (const type of types) {
      const notification = this.notificationRepository.create({
        type,
        category: createDto.category,
        priority: createDto.priority || NotificationPriority.NORMAL,
        recipientId: createDto.recipientId,
        recipientEmail: createDto.recipientEmail,
        recipientPhone: createDto.recipientPhone,
        deviceToken: createDto.deviceToken,
        subject: createDto.subject,
        body: createDto.body,
        htmlBody: createDto.htmlBody,
        data: createDto.data,
        templateName: createDto.templateName,
        templateData: createDto.templateData,
        projectId: createDto.projectId,
        paymentId: createDto.paymentId,
        documentId: createDto.documentId,
        scheduledFor: createDto.scheduledFor,
        expiresAt: createDto.expiresAt,
        status: createDto.scheduledFor
          ? NotificationStatus.PENDING
          : NotificationStatus.PENDING,
      });

      const saved = await this.notificationRepository.save(notification);
      notifications.push(saved);

      // Queue for sending
      if (!createDto.scheduledFor || new Date() >= createDto.scheduledFor) {
        await this.queueNotification(saved);
      } else {
        // Schedule for future sending
        const delay = createDto.scheduledFor.getTime() - Date.now();
        await this.queueNotification(saved, delay);
      }
    }

    this.logger.log(
      `Created ${notifications.length} notification(s) for recipient ${createDto.recipientId}`,
    );

    return notifications;
  }

  /**
   * Queue notification for processing
   */
  private async queueNotification(
    notification: Notification,
    delay: number = 0,
  ): Promise<void> {
    const priority = this.getPriorityValue(notification.priority);

    await this.notificationQueue.add(
      'send-notification',
      { notificationId: notification.id },
      {
        priority,
        delay,
        attempts: notification.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  /**
   * Process and send notification
   */
  async sendNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    // Check if expired
    if (notification.isExpired) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = 'Notification expired';
      notification.failedAt = new Date();
      await this.notificationRepository.save(notification);
      return;
    }

    // Check if already sent
    if (notification.isSent) {
      this.logger.warn(`Notification ${notificationId} already sent`);
      return;
    }

    // Update status to SENDING
    notification.status = NotificationStatus.SENDING;
    await this.notificationRepository.save(notification);

    try {
      let result: any;

      switch (notification.type) {
        case NotificationType.EMAIL:
          result = await this.sendEmail(notification);
          break;

        case NotificationType.SMS:
          result = await this.sendSms(notification);
          break;

        case NotificationType.PUSH:
          result = await this.sendPush(notification);
          break;

        case NotificationType.IN_APP:
          result = await this.sendInApp(notification);
          break;

        default:
          throw new Error(`Unknown notification type: ${notification.type}`);
      }

      // Update notification as sent
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      notification.externalId = result.messageId || result.messageSid;
      notification.provider = result.provider;
      await this.notificationRepository.save(notification);

      this.logger.log(`Notification ${notificationId} sent successfully`);

      // Emit event
      this.eventEmitter.emit('notification.sent', { notification });
    } catch (error) {
      await this.handleNotificationError(notification, error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<any> {
    if (!notification.recipientEmail) {
      throw new BadRequestException('Recipient email required for email notifications');
    }

    let result: any;

    if (notification.templateName && notification.templateData) {
      // Use template
      const rendered = await this.emailService.renderTemplate(
        notification.templateName,
        notification.templateData,
      );

      result = await this.emailService.sendEmail({
        to: notification.recipientEmail,
        subject: notification.subject,
        html: rendered.html,
        text: rendered.text,
      });
    } else {
      // Use provided content
      result = await this.emailService.sendEmail({
        to: notification.recipientEmail,
        subject: notification.subject,
        text: notification.body,
        html: notification.htmlBody,
      });
    }

    return { ...result, provider: 'smtp' };
  }

  /**
   * Send SMS notification
   */
  private async sendSms(notification: Notification): Promise<any> {
    if (!notification.recipientPhone) {
      throw new BadRequestException('Recipient phone required for SMS notifications');
    }

    const result = await this.smsService.sendSms({
      to: notification.recipientPhone,
      body: notification.body,
    });

    return { ...result, provider: 'twilio' };
  }

  /**
   * Send push notification
   */
  private async sendPush(notification: Notification): Promise<any> {
    if (!notification.deviceToken) {
      throw new BadRequestException('Device token required for push notifications');
    }

    const result = await this.pushService.sendPushNotification({
      token: notification.deviceToken,
      title: notification.subject,
      body: notification.body,
      data: notification.data,
    });

    return {
      messageId: result.messageIds[0],
      provider: 'firebase',
    };
  }

  /**
   * Send in-app notification (just mark as sent, handled by frontend polling)
   */
  private async sendInApp(notification: Notification): Promise<any> {
    // In-app notifications are just stored in DB and polled by frontend
    return { messageId: notification.id, provider: 'in-app' };
  }

  /**
   * Handle notification sending error
   */
  private async handleNotificationError(
    notification: Notification,
    error: any,
  ): Promise<void> {
    notification.status = NotificationStatus.FAILED;
    notification.errorMessage = error.message || 'Unknown error';
    notification.failedAt = new Date();
    notification.retryCount += 1;

    // Calculate next retry time (exponential backoff)
    if (notification.canRetry) {
      const retryDelay = Math.pow(2, notification.retryCount) * 5000; // 5s, 10s, 20s, 40s...
      notification.nextRetryAt = new Date(Date.now() + retryDelay);
      notification.status = NotificationStatus.PENDING;

      // Re-queue for retry
      await this.queueNotification(notification, retryDelay);
    }

    await this.notificationRepository.save(notification);

    this.logger.error(
      `Failed to send notification ${notification.id}: ${error.message}`,
      error.stack,
    );

    // Emit event
    this.eventEmitter.emit('notification.failed', { notification, error });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    params?: {
      type?: NotificationType;
      category?: NotificationCategory;
      status?: NotificationStatus;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (params?.type) {
      queryBuilder.andWhere('notification.type = :type', { type: params.type });
    }

    if (params?.category) {
      queryBuilder.andWhere('notification.category = :category', {
        category: params.category,
      });
    }

    if (params?.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: params.status,
      });
    }

    if (params?.unreadOnly) {
      queryBuilder.andWhere('notification.readAt IS NULL');
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        recipientId: userId,
        readAt: null as any,
      },
    });

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      notification.status = NotificationStatus.READ;
      await this.notificationRepository.save(notification);

      this.eventEmitter.emit('notification.read', { notification });
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        readAt: new Date(),
        status: NotificationStatus.READ,
      })
      .where('recipientId = :userId', { userId })
      .andWhere('readAt IS NULL')
      .execute();

    return { updated: result.affected || 0 };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    successRate: number;
  }> {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      queryBuilder.where('notification.recipientId = :userId', { userId });
    }

    const notifications = await queryBuilder.getMany();

    const total = notifications.length;

    // By type
    const byType: Record<string, number> = {};
    notifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    // By status
    const byStatus: Record<string, number> = {};
    notifications.forEach((n) => {
      byStatus[n.status] = (byStatus[n.status] || 0) + 1;
    });

    // By category
    const byCategory: Record<string, number> = {};
    notifications.forEach((n) => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });

    // Success rate
    const sentCount =
      (byStatus[NotificationStatus.SENT] || 0) +
      (byStatus[NotificationStatus.DELIVERED] || 0) +
      (byStatus[NotificationStatus.READ] || 0);
    const successRate = total > 0 ? (sentCount / total) * 100 : 0;

    return {
      total,
      byType,
      byStatus,
      byCategory,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Retry failed notification
   */
  async retryNotification(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    if (!notification.canRetry) {
      throw new BadRequestException('Notification cannot be retried');
    }

    notification.status = NotificationStatus.PENDING;
    notification.errorMessage = null;
    await this.notificationRepository.save(notification);

    await this.queueNotification(notification);
  }

  /**
   * Get priority value for queue
   */
  private getPriorityValue(priority: NotificationPriority): number {
    const priorityMap = {
      [NotificationPriority.URGENT]: 1,
      [NotificationPriority.HIGH]: 2,
      [NotificationPriority.NORMAL]: 3,
      [NotificationPriority.LOW]: 4,
    };

    return priorityMap[priority] || 3;
  }
}
