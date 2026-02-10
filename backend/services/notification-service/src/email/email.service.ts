import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.logger.log(`Email service initialized with host: ${host}`);
  }

  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    try {
      let html = options.html;
      let text = options.text;

      // Render template if provided
      if (options.template) {
        const rendered = await this.renderTemplate(
          options.template,
          options.context || {},
        );
        html = rendered.html;
        text = rendered.text;
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          'CDF Smart Hub <noreply@cdf.gov.zm>',
        ),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text,
        html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);

      return { messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<{ html: string; text: string }> {
    const template = await this.loadTemplate(templateName);
    const html = template(context);

    // Generate plain text version by stripping HTML tags
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    return { html, text };
  }

  private async loadTemplate(
    templateName: string,
  ): Promise<handlebars.TemplateDelegate> {
    // Check cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    // Load template file
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      'email',
      `${templateName}.hbs`,
    );

    try {
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);

      // Cache compiled template
      this.templateCache.set(templateName, compiled);

      this.logger.log(`Template loaded: ${templateName}`);

      return compiled;
    } catch (error) {
      this.logger.error(
        `Failed to load template ${templateName}: ${error.message}`,
      );
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `SMTP connection verification failed: ${error.message}`,
      );
      return false;
    }
  }

  // Predefined email methods for common scenarios

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to CDF Smart Hub',
      template: 'welcome',
      context: { userName },
    });
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to,
      subject: 'Password Reset Request - CDF Smart Hub',
      template: 'password-reset',
      context: { userName, resetLink, resetToken },
    });
  }

  async sendProjectApprovalEmail(
    to: string,
    projectName: string,
    approverName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Project Approved: ${projectName}`,
      template: 'project-approved',
      context: { projectName, approverName },
    });
  }

  async sendPaymentApprovalEmail(
    to: string,
    paymentAmount: number,
    projectName: string,
    panel: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Payment Approval Required - ${projectName}`,
      template: 'payment-approval',
      context: {
        paymentAmount: paymentAmount.toLocaleString('en-ZM', {
          style: 'currency',
          currency: 'ZMW',
        }),
        projectName,
        panel,
      },
    });
  }

  async sendPaymentExecutedEmail(
    to: string,
    paymentAmount: number,
    projectName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Payment Executed - ${projectName}`,
      template: 'payment-executed',
      context: {
        paymentAmount: paymentAmount.toLocaleString('en-ZM', {
          style: 'currency',
          currency: 'ZMW',
        }),
        projectName,
      },
    });
  }

  async sendDocumentUploadedEmail(
    to: string,
    documentName: string,
    uploaderName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `New Document Uploaded: ${documentName}`,
      template: 'document-uploaded',
      context: { documentName, uploaderName },
    });
  }

  async sendMilestoneCompletedEmail(
    to: string,
    milestoneName: string,
    projectName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Milestone Completed: ${milestoneName}`,
      template: 'milestone-completed',
      context: { milestoneName, projectName },
    });
  }

  async sendSystemAlertEmail(
    to: string | string[],
    alertTitle: string,
    alertMessage: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `System Alert: ${alertTitle}`,
      template: 'system-alert',
      context: { alertTitle, alertMessage },
    });
  }
}
