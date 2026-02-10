import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Project Events Listener
 * Listens to project events and triggers notifications
 */
@Injectable()
export class ProjectEventsListener {
  private readonly logger = new Logger(ProjectEventsListener.name);
  private readonly notificationServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.notificationServiceUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://notification-service/api/v1';
  }

  @OnEvent('project.created')
  async handleProjectCreated(payload: any) {
    this.logger.log(`Project created: ${payload.project.id}`);

    try {
      // Notify project creator
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'PROJECT_CREATED',
        priority: 'NORMAL',
        recipientId: payload.project.createdBy,
        subject: 'Project Created Successfully',
        body: `Your project "${payload.project.name}" has been created and submitted for review.`,
        templateName: 'project-created',
        templateData: {
          projectName: payload.project.name,
          projectId: payload.project.id,
        },
        projectId: payload.project.id,
      });

      // Notify CDFC members for approval
      await this.notifyCDFCMembers(payload.project);
    } catch (error) {
      this.logger.error(`Failed to send project created notification: ${error.message}`);
    }
  }

  @OnEvent('project.cdfc_approved')
  async handleCDFCApproved(payload: any) {
    this.logger.log(`Project CDFC approved: ${payload.project.id}`);

    try {
      // Notify project creator
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'IN_APP'],
        category: 'PROJECT_APPROVED',
        priority: 'HIGH',
        recipientId: payload.project.createdBy,
        subject: 'Project Approved by CDFC',
        body: `Your project "${payload.project.name}" has been approved by CDFC.`,
        templateName: 'project-cdfc-approved',
        templateData: {
          projectName: payload.project.name,
          approverName: payload.approverName,
        },
        projectId: payload.project.id,
      });

      // Notify TAC members for second approval
      await this.notifyTACMembers(payload.project);
    } catch (error) {
      this.logger.error(`Failed to send CDFC approval notification: ${error.message}`);
    }
  }

  @OnEvent('project.tac_approved')
  async handleTACApproved(payload: any) {
    this.logger.log(`Project TAC approved: ${payload.project.id}`);

    try {
      // Notify project creator - project is now active
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        category: 'PROJECT_APPROVED',
        priority: 'HIGH',
        recipientId: payload.project.createdBy,
        subject: 'Project Fully Approved - Now Active',
        body: `Your project "${payload.project.name}" has been approved by both CDFC and TAC. The project is now active.`,
        templateName: 'project-fully-approved',
        templateData: {
          projectName: payload.project.name,
          approverName: payload.approverName,
        },
        projectId: payload.project.id,
      });
    } catch (error) {
      this.logger.error(`Failed to send TAC approval notification: ${error.message}`);
    }
  }

  @OnEvent('project.rejected')
  async handleProjectRejected(payload: any) {
    this.logger.log(`Project rejected: ${payload.project.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'IN_APP'],
        category: 'PROJECT_REJECTED',
        priority: 'HIGH',
        recipientId: payload.project.createdBy,
        subject: 'Project Rejected',
        body: `Your project "${payload.project.name}" has been rejected. Reason: ${payload.reason}`,
        templateName: 'project-rejected',
        templateData: {
          projectName: payload.project.name,
          rejectedBy: payload.rejectedBy,
          reason: payload.reason,
        },
        projectId: payload.project.id,
      });
    } catch (error) {
      this.logger.error(`Failed to send project rejection notification: ${error.message}`);
    }
  }

  @OnEvent('project.updated')
  async handleProjectUpdated(payload: any) {
    this.logger.log(`Project updated: ${payload.project.id}`);

    try {
      // Notify stakeholders if major update
      if (payload.majorUpdate) {
        await this.sendNotification({
          type: ['IN_APP'],
          category: 'PROJECT_UPDATED',
          priority: 'NORMAL',
          recipientId: payload.project.createdBy,
          subject: 'Project Updated',
          body: `Project "${payload.project.name}" has been updated.`,
          projectId: payload.project.id,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send project update notification: ${error.message}`);
    }
  }

  @OnEvent('milestone.completed')
  async handleMilestoneCompleted(payload: any) {
    this.logger.log(`Milestone completed: ${payload.milestone.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'MILESTONE_COMPLETED',
        priority: 'NORMAL',
        recipientId: payload.project.createdBy,
        subject: 'Milestone Completed',
        body: `Milestone "${payload.milestone.name}" for project "${payload.project.name}" has been completed.`,
        templateName: 'milestone-completed',
        templateData: {
          milestoneName: payload.milestone.name,
          projectName: payload.project.name,
        },
        projectId: payload.project.id,
      });
    } catch (error) {
      this.logger.error(`Failed to send milestone completion notification: ${error.message}`);
    }
  }

  @OnEvent('milestone.overdue')
  async handleMilestoneOverdue(payload: any) {
    this.logger.log(`Milestone overdue: ${payload.milestone.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'IN_APP'],
        category: 'MILESTONE_OVERDUE',
        priority: 'HIGH',
        recipientId: payload.project.createdBy,
        subject: 'Milestone Overdue',
        body: `Milestone "${payload.milestone.name}" for project "${payload.project.name}" is overdue.`,
        templateName: 'milestone-overdue',
        templateData: {
          milestoneName: payload.milestone.name,
          projectName: payload.project.name,
          dueDate: payload.milestone.dueDate,
        },
        projectId: payload.project.id,
      });
    } catch (error) {
      this.logger.error(`Failed to send milestone overdue notification: ${error.message}`);
    }
  }

  private async notifyCDFCMembers(project: any): Promise<void> {
    // Get CDFC members from user service
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: { role: 'CDFC_MEMBER' },
      });

      const cdfcMembers = (response.data as any)?.users || [];

      // Send notification to each CDFC member
      for (const member of cdfcMembers) {
        await this.sendNotification({
          type: ['EMAIL', 'IN_APP'],
          category: 'PROJECT_CREATED',
          priority: 'NORMAL',
          recipientId: member.id,
          recipientEmail: member.email,
          subject: 'New Project Awaiting CDFC Approval',
          body: `A new project "${project.name}" has been submitted and requires CDFC approval.`,
          templateName: 'project-approval-request',
          templateData: {
            projectName: project.name,
            projectId: project.id,
            panel: 'CDFC',
          },
          projectId: project.id,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify CDFC members: ${error.message}`);
    }
  }

  private async notifyTACMembers(project: any): Promise<void> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: { role: 'TAC_MEMBER' },
      });

      const tacMembers = (response.data as any)?.users || [];

      for (const member of tacMembers) {
        await this.sendNotification({
          type: ['EMAIL', 'IN_APP'],
          category: 'PROJECT_CREATED',
          priority: 'HIGH',
          recipientId: member.id,
          recipientEmail: member.email,
          subject: 'Project Awaiting TAC Approval',
          body: `Project "${project.name}" has been approved by CDFC and now requires TAC approval.`,
          templateName: 'project-approval-request',
          templateData: {
            projectName: project.name,
            projectId: project.id,
            panel: 'TAC',
          },
          projectId: project.id,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify TAC members: ${error.message}`);
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
}
