import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

export interface SmsOptions {
  to: string;
  body: string;
  from?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
      this.logger.log('Twilio SMS service initialized');
    } else {
      this.logger.warn(
        'Twilio credentials not configured. SMS functionality disabled.',
      );
    }
  }

  async sendSms(options: SmsOptions): Promise<{ messageSid: string }> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    try {
      // Ensure phone number is in E.164 format (+260...)
      const to = this.formatPhoneNumber(options.to);
      const from = options.from || this.fromNumber;

      // Twilio has a 160 character limit for a single SMS
      // If longer, it will be split into multiple messages
      const message = await this.twilioClient.messages.create({
        body: options.body,
        from,
        to,
      });

      this.logger.log(`SMS sent successfully: ${message.sid} to ${to}`);

      return { messageSid: message.sid };
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      throw error;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // If starts with 0, replace with country code (Zambia: +260)
    if (cleaned.startsWith('0')) {
      cleaned = '260' + cleaned.substring(1);
    }

    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  async getMessageStatus(messageSid: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    if (!this.twilioClient) {
      throw new Error('Twilio not configured');
    }

    try {
      const message = await this.twilioClient.messages(messageSid).fetch();

      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get message status: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Predefined SMS methods for common scenarios

  async sendPasswordResetSms(
    to: string,
    resetCode: string,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Your password reset code is ${resetCode}. Valid for 15 minutes.`;
    return this.sendSms({ to, body });
  }

  async sendMfaCodeSms(
    to: string,
    code: string,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Your verification code is ${code}. Do not share this code.`;
    return this.sendSms({ to, body });
  }

  async sendProjectApprovalSms(
    to: string,
    projectName: string,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Project "${projectName}" has been approved.`;
    return this.sendSms({ to, body });
  }

  async sendPaymentApprovalSms(
    to: string,
    projectName: string,
    amount: number,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Payment approval required for project "${projectName}". Amount: K${amount.toLocaleString()}`;
    return this.sendSms({ to, body });
  }

  async sendPaymentExecutedSms(
    to: string,
    projectName: string,
    amount: number,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Payment of K${amount.toLocaleString()} for project "${projectName}" has been executed.`;
    return this.sendSms({ to, body });
  }

  async sendMilestoneOverdueSms(
    to: string,
    milestoneName: string,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Milestone "${milestoneName}" is overdue. Please update status.`;
    return this.sendSms({ to, body });
  }

  async sendBudgetLowSms(
    to: string,
    constituencyName: string,
    remainingBudget: number,
  ): Promise<{ messageSid: string }> {
    const body = `CDF Smart Hub: Budget alert for ${constituencyName}. Remaining: K${remainingBudget.toLocaleString()}`;
    return this.sendSms({ to, body });
  }

  async sendSystemAlertSms(
    to: string | string[],
    alertMessage: string,
  ): Promise<void> {
    const body = `CDF Smart Hub ALERT: ${alertMessage}`;
    const recipients = Array.isArray(to) ? to : [to];

    await Promise.all(
      recipients.map((recipient) => this.sendSms({ to: recipient, body })),
    );
  }
}
