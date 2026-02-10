import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Document Events Listener
 * Listens to document events and triggers notifications
 */
@Injectable()
export class DocumentEventsListener {
  private readonly logger = new Logger(DocumentEventsListener.name);
  private readonly notificationServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.notificationServiceUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://notification-service/api/v1';
  }

  @OnEvent('document.uploaded')
  async handleDocumentUploaded(payload: any) {
    this.logger.log(`Document uploaded: ${payload.document.id}`);

    try {
      // Notify document uploader
      await this.sendNotification({
        type: ['IN_APP'],
        category: 'DOCUMENT_UPLOADED',
        priority: 'NORMAL',
        recipientId: payload.document.uploadedBy,
        subject: 'Document Uploaded Successfully',
        body: `Document "${payload.document.filename}" has been uploaded successfully (${payload.document.fileSizeMB} MB).`,
        documentId: payload.document.id,
        projectId: payload.document.projectId,
      });

      // Notify relevant stakeholders if project document
      if (payload.document.projectId) {
        await this.notifyProjectStakeholders(payload.document);
      }
    } catch (error) {
      this.logger.error(`Failed to send document upload notification: ${error.message}`);
    }
  }

  @OnEvent('document.version_uploaded')
  async handleVersionUploaded(payload: any) {
    this.logger.log(`Document version uploaded: ${payload.document.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'DOCUMENT_UPLOADED',
        priority: 'NORMAL',
        recipientId: payload.document.uploadedBy,
        subject: 'New Document Version Uploaded',
        body: `New version (v${payload.document.version}) of "${payload.document.filename}" has been uploaded.`,
        templateName: 'document-version-uploaded',
        templateData: {
          documentName: payload.document.filename,
          version: payload.document.version,
          previousVersion: payload.previousVersion.version,
        },
        documentId: payload.document.id,
        projectId: payload.document.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send version upload notification: ${error.message}`);
    }
  }

  @OnEvent('document.downloaded')
  async handleDocumentDownloaded(payload: any) {
    this.logger.log(`Document downloaded: ${payload.document.id} by ${payload.userId}`);

    // Track download for audit but don't notify
    // Could be used for analytics
  }

  @OnEvent('document.approval_decision')
  async handleApprovalDecision(payload: any) {
    this.logger.log(`Document ${payload.approved ? 'approved' : 'rejected'}: ${payload.document.id}`);

    try {
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: payload.approved ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
        priority: 'HIGH',
        recipientId: payload.document.uploadedBy,
        subject: `Document ${payload.approved ? 'Approved' : 'Rejected'}`,
        body: payload.approved
          ? `Document "${payload.document.filename}" has been approved.`
          : `Document "${payload.document.filename}" has been rejected. Reason: ${payload.document.rejectionReason}`,
        templateName: payload.approved ? 'document-approved' : 'document-rejected',
        templateData: {
          documentName: payload.document.filename,
          approverName: payload.approverName || 'System',
          notes: payload.document.approvalNotes || payload.document.rejectionReason,
        },
        documentId: payload.document.id,
        projectId: payload.document.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send approval decision notification: ${error.message}`);
    }
  }

  @OnEvent('document.updated')
  async handleDocumentUpdated(payload: any) {
    this.logger.log(`Document updated: ${payload.document.id}`);

    // Minimal notification for metadata updates
    try {
      await this.sendNotification({
        type: ['IN_APP'],
        category: 'DOCUMENT_UPLOADED',
        priority: 'LOW',
        recipientId: payload.document.uploadedBy,
        subject: 'Document Updated',
        body: `Document "${payload.document.filename}" metadata has been updated.`,
        documentId: payload.document.id,
        projectId: payload.document.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send document update notification: ${error.message}`);
    }
  }

  @OnEvent('document.deleted')
  async handleDocumentDeleted(payload: any) {
    this.logger.log(`Document deleted: ${payload.document.id}`);

    try {
      await this.sendNotification({
        type: ['IN_APP'],
        category: 'DOCUMENT_UPLOADED',
        priority: 'NORMAL',
        recipientId: payload.document.uploadedBy,
        subject: 'Document Deleted',
        body: `Document "${payload.document.filename}" has been deleted.`,
        documentId: payload.document.id,
        projectId: payload.document.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send document deletion notification: ${error.message}`);
    }
  }

  private async notifyProjectStakeholders(document: any): Promise<void> {
    if (!document.projectId) return;

    const projectServiceUrl = this.configService.get<string>('PROJECT_SERVICE_URL') || 'http://project-service/api/v1';

    try {
      // Get project details
      const projectResponse = await axios.get(`${projectServiceUrl}/projects/${document.projectId}`);
      const project = projectResponse.data;

      // Notify project creator if different from uploader
      if (project.createdBy !== document.uploadedBy) {
        await this.sendNotification({
          type: ['EMAIL', 'IN_APP'],
          category: 'DOCUMENT_UPLOADED',
          priority: 'NORMAL',
          recipientId: project.createdBy,
          subject: 'New Document Uploaded to Project',
          body: `A new document "${document.filename}" has been uploaded to project "${project.name}".`,
          templateName: 'document-uploaded',
          templateData: {
            documentName: document.filename,
            uploaderName: 'Team member',
            projectName: project.name,
          },
          documentId: document.id,
          projectId: document.projectId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify project stakeholders: ${error.message}`);
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
