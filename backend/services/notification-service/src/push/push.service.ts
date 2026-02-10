import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationOptions {
  token: string | string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');

    if (!serviceAccountPath && !projectId) {
      this.logger.warn(
        'Firebase not configured. Push notification functionality disabled.',
      );
      return;
    }

    try {
      let credential: admin.credential.Credential;

      if (serviceAccountPath) {
        // Load from service account file
        const serviceAccount = require(serviceAccountPath);
        credential = admin.credential.cert(serviceAccount);
      } else {
        // Use application default credentials (for GCP)
        credential = admin.credential.applicationDefault();
      }

      this.firebaseApp = admin.initializeApp({
        credential,
        projectId,
      });

      this.logger.log('Firebase Cloud Messaging initialized');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendPushNotification(
    options: PushNotificationOptions,
  ): Promise<{ successCount: number; failureCount: number; messageIds: string[] }> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not configured');
    }

    try {
      const tokens = Array.isArray(options.token)
        ? options.token
        : [options.token];

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: options.title,
          body: options.body,
          imageUrl: options.imageUrl,
        },
        data: options.data,
        webpush: options.clickAction
          ? {
              fcmOptions: {
                link: options.clickAction,
              },
            }
          : undefined,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: options.clickAction,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendMulticast(message);

      this.logger.log(
        `Push notifications sent: ${response.successCount} succeeded, ${response.failureCount} failed`,
      );

      // Log failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(
              `Failed to send to token ${tokens[idx]}: ${resp.error?.message}`,
            );
          }
        });
      }

      const messageIds = response.responses
        .filter((r) => r.success)
        .map((r) => r.messageId);

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        messageIds,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ messageId: string }> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not configured');
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
        },
      };

      const messageId = await admin.messaging().send(message);

      this.logger.log(`Push notification sent to topic ${topic}: ${messageId}`);

      return { messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send to topic ${topic}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async subscribeToTopic(
    tokens: string | string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not configured');
    }

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

      const response = await admin
        .messaging()
        .subscribeToTopic(tokenArray, topic);

      this.logger.log(
        `Subscribed ${response.successCount} tokens to topic ${topic}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic ${topic}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unsubscribeFromTopic(
    tokens: string | string[],
    topic: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.firebaseApp) {
      throw new Error('Firebase not configured');
    }

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

      const response = await admin
        .messaging()
        .unsubscribeFromTopic(tokenArray, topic);

      this.logger.log(
        `Unsubscribed ${response.successCount} tokens from topic ${topic}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from topic ${topic}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Predefined push notification methods

  async sendProjectNotification(
    tokens: string | string[],
    projectName: string,
    action: string,
  ): Promise<void> {
    await this.sendPushNotification({
      token: tokens,
      title: 'Project Update',
      body: `Project "${projectName}" has been ${action}`,
      data: {
        type: 'project',
        action,
      },
    });
  }

  async sendPaymentNotification(
    tokens: string | string[],
    projectName: string,
    action: string,
    amount?: number,
  ): Promise<void> {
    const amountText = amount
      ? ` (K${amount.toLocaleString()})`
      : '';

    await this.sendPushNotification({
      token: tokens,
      title: 'Payment Update',
      body: `Payment for "${projectName}"${amountText} - ${action}`,
      data: {
        type: 'payment',
        action,
      },
    });
  }

  async sendDocumentNotification(
    tokens: string | string[],
    documentName: string,
    action: string,
  ): Promise<void> {
    await this.sendPushNotification({
      token: tokens,
      title: 'Document Update',
      body: `Document "${documentName}" has been ${action}`,
      data: {
        type: 'document',
        action,
      },
    });
  }

  async sendMilestoneNotification(
    tokens: string | string[],
    milestoneName: string,
    status: string,
  ): Promise<void> {
    await this.sendPushNotification({
      token: tokens,
      title: 'Milestone Update',
      body: `Milestone "${milestoneName}" is ${status}`,
      data: {
        type: 'milestone',
        status,
      },
    });
  }

  async sendSystemAlert(
    tokens: string | string[],
    alertTitle: string,
    alertMessage: string,
  ): Promise<void> {
    await this.sendPushNotification({
      token: tokens,
      title: `Alert: ${alertTitle}`,
      body: alertMessage,
      data: {
        type: 'system_alert',
      },
    });
  }
}
