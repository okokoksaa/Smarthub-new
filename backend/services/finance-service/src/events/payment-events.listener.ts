import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Payment Events Listener
 * Listens to payment events and triggers notifications
 */
@Injectable()
export class PaymentEventsListener {
  private readonly logger = new Logger(PaymentEventsListener.name);
  private readonly notificationServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.notificationServiceUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://notification-service/api/v1';
  }

  @OnEvent('payment.created')
  async handlePaymentCreated(payload: any) {
    this.logger.log(`Payment created: ${payload.payment.id}`);

    try {
      // Notify payment creator
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'PAYMENT_CREATED',
        priority: 'NORMAL',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Request Created',
        body: `Payment request for ${this.formatCurrency(payload.payment.amount)} has been created for project "${payload.projectName}".`,
        templateName: 'payment-created',
        templateData: {
          paymentAmount: this.formatCurrency(payload.payment.amount),
          projectName: payload.projectName,
        },
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });

      // Notify Panel A members for approval
      await this.notifyPanelAMembers(payload.payment, payload.projectName);
    } catch (error) {
      this.logger.error(`Failed to send payment created notification: ${error.message}`);
    }
  }

  @OnEvent('payment.panel_a_approved')
  async handlePanelAApproved(payload: any) {
    this.logger.log(`Payment Panel A approved: ${payload.payment.id}`);

    try {
      // Notify payment creator
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'PAYMENT_PANEL_A_APPROVAL',
        priority: 'HIGH',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Approved by Panel A (CDFC)',
        body: `Payment of ${this.formatCurrency(payload.payment.amount)} for "${payload.projectName}" has been approved by Panel A.`,
        templateName: 'payment-panel-a-approved',
        templateData: {
          paymentAmount: this.formatCurrency(payload.payment.amount),
          projectName: payload.projectName,
          approverName: payload.approverName,
        },
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });

      // Notify Panel B members for second approval
      await this.notifyPanelBMembers(payload.payment, payload.projectName);
    } catch (error) {
      this.logger.error(`Failed to send Panel A approval notification: ${error.message}`);
    }
  }

  @OnEvent('payment.panel_b_approved')
  async handlePanelBApproved(payload: any) {
    this.logger.log(`Payment Panel B approved: ${payload.payment.id}`);

    try {
      // Notify payment creator - payment now ready for execution
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'IN_APP'],
        category: 'PAYMENT_PANEL_B_APPROVAL',
        priority: 'HIGH',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Fully Approved - Ready for Execution',
        body: `Payment of ${this.formatCurrency(payload.payment.amount)} for "${payload.projectName}" has been approved by both Panel A and Panel B.`,
        templateName: 'payment-fully-approved',
        templateData: {
          paymentAmount: this.formatCurrency(payload.payment.amount),
          projectName: payload.projectName,
          approverName: payload.approverName,
        },
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send Panel B approval notification: ${error.message}`);
    }
  }

  @OnEvent('payment.rejected')
  async handlePaymentRejected(payload: any) {
    this.logger.log(`Payment rejected: ${payload.payment.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'IN_APP'],
        category: 'PAYMENT_REJECTED',
        priority: 'HIGH',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Request Rejected',
        body: `Payment of ${this.formatCurrency(payload.payment.amount)} for "${payload.projectName}" has been rejected by ${payload.panel}. Reason: ${payload.reason}`,
        templateName: 'payment-rejected',
        templateData: {
          paymentAmount: this.formatCurrency(payload.payment.amount),
          projectName: payload.projectName,
          panel: payload.panel,
          rejectedBy: payload.rejectedBy,
          reason: payload.reason,
        },
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send payment rejection notification: ${error.message}`);
    }
  }

  @OnEvent('payment.executed')
  async handlePaymentExecuted(payload: any) {
    this.logger.log(`Payment executed: ${payload.payment.id}`);

    try {
      // Notify payment creator
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        category: 'PAYMENT_EXECUTED',
        priority: 'HIGH',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Executed Successfully',
        body: `Payment of ${this.formatCurrency(payload.payment.amount)} for "${payload.projectName}" has been executed successfully.`,
        templateName: 'payment-executed',
        templateData: {
          paymentAmount: this.formatCurrency(payload.payment.amount),
          projectName: payload.projectName,
          referenceNumber: payload.payment.referenceNumber,
        },
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });

      // Notify stakeholders
      await this.notifyPaymentStakeholders(payload.payment, payload.projectName);
    } catch (error) {
      this.logger.error(`Failed to send payment execution notification: ${error.message}`);
    }
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: any) {
    this.logger.log(`Payment completed: ${payload.payment.id}`);

    try {
      await this.sendNotification({
        type: ['IN_APP'],
        category: 'PAYMENT_EXECUTED',
        priority: 'NORMAL',
        recipientId: payload.payment.createdBy,
        subject: 'Payment Completed',
        body: `Payment of ${this.formatCurrency(payload.payment.amount)} for "${payload.projectName}" has been completed.`,
        paymentId: payload.payment.id,
        projectId: payload.payment.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send payment completion notification: ${error.message}`);
    }
  }

  private async notifyPanelAMembers(payment: any, projectName: string): Promise<void> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: { role: 'CDFC_MEMBER' },
      });

      const panelAMembers = response.data.users || [];

      for (const member of panelAMembers) {
        await this.sendNotification({
          type: ['EMAIL', 'SMS', 'IN_APP'],
          category: 'PAYMENT_PANEL_A_APPROVAL',
          priority: 'HIGH',
          recipientId: member.id,
          recipientEmail: member.email,
          recipientPhone: member.phone,
          subject: 'Payment Approval Required - Panel A',
          body: `Payment of ${this.formatCurrency(payment.amount)} for project "${projectName}" requires Panel A (CDFC) approval.`,
          templateName: 'payment-approval',
          templateData: {
            paymentAmount: this.formatCurrency(payment.amount),
            projectName,
            panel: 'Panel A (CDFC)',
          },
          paymentId: payment.id,
          projectId: payment.projectId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify Panel A members: ${error.message}`);
    }
  }

  private async notifyPanelBMembers(payment: any, projectName: string): Promise<void> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: { role: 'TAC_MEMBER' },
      });

      const panelBMembers = response.data.users || [];

      for (const member of panelBMembers) {
        await this.sendNotification({
          type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
          category: 'PAYMENT_PANEL_B_APPROVAL',
          priority: 'URGENT',
          recipientId: member.id,
          recipientEmail: member.email,
          recipientPhone: member.phone,
          subject: 'URGENT: Payment Approval Required - Panel B',
          body: `Payment of ${this.formatCurrency(payment.amount)} for project "${projectName}" requires Panel B (TAC) approval. Panel A has already approved.`,
          templateName: 'payment-approval',
          templateData: {
            paymentAmount: this.formatCurrency(payment.amount),
            projectName,
            panel: 'Panel B (TAC)',
          },
          paymentId: payment.id,
          projectId: payment.projectId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify Panel B members: ${error.message}`);
    }
  }

  private async notifyPaymentStakeholders(payment: any, projectName: string): Promise<void> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      // Notify relevant stakeholders (MPs, PS, etc.)
      const roles = ['MP', 'PS', 'CDFC_MEMBER', 'TAC_MEMBER'];

      for (const role of roles) {
        const response = await axios.get(`${userServiceUrl}/users`, {
          params: { role },
        });

        const users = response.data.users || [];

        for (const user of users) {
          await this.sendNotification({
            type: ['IN_APP'],
            category: 'PAYMENT_EXECUTED',
            priority: 'NORMAL',
            recipientId: user.id,
            subject: 'Payment Executed',
            body: `Payment of ${this.formatCurrency(payment.amount)} for project "${projectName}" has been executed.`,
            paymentId: payment.id,
            projectId: payment.projectId,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Failed to notify payment stakeholders: ${error.message}`);
    }
  }

  private async sendNotification(data: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/notifications`, data);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // Don't throw - notifications are non-critical
    }
  }

  private formatCurrency(amount: number): string {
    return `K${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
