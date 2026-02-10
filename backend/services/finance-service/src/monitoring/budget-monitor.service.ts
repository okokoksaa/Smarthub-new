import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Budget } from '@shared/database';
import axios from 'axios';

/**
 * Budget Monitoring Service
 * Monitors budget levels and triggers alerts
 */
@Injectable()
export class BudgetMonitorService {
  private readonly logger = new Logger(BudgetMonitorService.name);
  private readonly notificationServiceUrl: string;

  // Thresholds for budget alerts
  private readonly LOW_BUDGET_THRESHOLD = 0.2; // 20%
  private readonly CRITICAL_BUDGET_THRESHOLD = 0.1; // 10%

  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.notificationServiceUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://notification-service/api/v1';
  }

  /**
   * Run budget monitoring every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async monitorBudgets() {
    this.logger.log('Running budget monitoring check...');

    try {
      // Get all active budgets
      const budgets = await this.budgetRepository.find({
        relations: ['constituency', 'fiscalYear'],
      });

      for (const budget of budgets) {
        await this.checkBudgetLevel(budget);
      }

      this.logger.log(`Budget monitoring completed for ${budgets.length} budgets`);
    } catch (error) {
      this.logger.error(`Budget monitoring failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Check specific budget level and trigger alerts if needed
   */
  async checkBudgetLevel(budget: Budget): Promise<void> {
    const remainingPercentage = budget.remaining / budget.totalAllocated;

    // Critical budget level (10% or less)
    if (remainingPercentage <= this.CRITICAL_BUDGET_THRESHOLD && remainingPercentage > 0) {
      await this.sendCriticalBudgetAlert(budget);
    }
    // Low budget level (20% or less)
    else if (remainingPercentage <= this.LOW_BUDGET_THRESHOLD && remainingPercentage > 0) {
      await this.sendLowBudgetAlert(budget);
    }
    // Budget exceeded
    else if (budget.remaining < 0) {
      await this.sendBudgetExceededAlert(budget);
    }
  }

  /**
   * Send critical budget alert (10% or less remaining)
   */
  private async sendCriticalBudgetAlert(budget: Budget): Promise<void> {
    this.logger.warn(
      `CRITICAL: Budget ${budget.id} has only ${this.formatCurrency(budget.remaining)} remaining (${(budget.remaining / budget.totalAllocated * 100).toFixed(1)}%)`,
    );

    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      // Get constituency MP and relevant officials
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: {
          constituencyId: budget.constituencyId,
          roles: ['MP', 'CDFC_MEMBER', 'PS'],
        },
      });

      const officials = response.data.users || [];

      for (const official of officials) {
        await this.sendNotification({
          type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
          category: 'BUDGET_LOW',
          priority: 'URGENT',
          recipientId: official.id,
          recipientEmail: official.email,
          recipientPhone: official.phone,
          subject: `CRITICAL: Budget Alert - ${budget.constituency?.name || 'Constituency'}`,
          body: `CRITICAL BUDGET ALERT: Only ${this.formatCurrency(budget.remaining)} (${(budget.remaining / budget.totalAllocated * 100).toFixed(1)}%) remaining for ${budget.constituency?.name || 'constituency'} in fiscal year ${budget.fiscalYear?.year || 'current'}.`,
          templateName: 'budget-critical',
          templateData: {
            constituencyName: budget.constituency?.name || 'Constituency',
            remainingBudget: this.formatCurrency(budget.remaining),
            percentage: (budget.remaining / budget.totalAllocated * 100).toFixed(1),
            totalBudget: this.formatCurrency(budget.totalAllocated),
            fiscalYear: budget.fiscalYear?.year || new Date().getFullYear(),
          },
        });
      }

      // Emit event
      this.eventEmitter.emit('budget.critical', { budget });
    } catch (error) {
      this.logger.error(`Failed to send critical budget alert: ${error.message}`);
    }
  }

  /**
   * Send low budget alert (20% or less remaining)
   */
  private async sendLowBudgetAlert(budget: Budget): Promise<void> {
    this.logger.warn(
      `LOW: Budget ${budget.id} has ${this.formatCurrency(budget.remaining)} remaining (${(budget.remaining / budget.totalAllocated * 100).toFixed(1)}%)`,
    );

    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: {
          constituencyId: budget.constituencyId,
          roles: ['MP', 'CDFC_MEMBER'],
        },
      });

      const officials = response.data.users || [];

      for (const official of officials) {
        await this.sendNotification({
          type: ['EMAIL', 'IN_APP'],
          category: 'BUDGET_LOW',
          priority: 'HIGH',
          recipientId: official.id,
          recipientEmail: official.email,
          subject: `Budget Alert - ${budget.constituency?.name || 'Constituency'}`,
          body: `Budget alert: ${this.formatCurrency(budget.remaining)} (${(budget.remaining / budget.totalAllocated * 100).toFixed(1)}%) remaining for ${budget.constituency?.name || 'constituency'}.`,
          templateName: 'budget-low',
          templateData: {
            constituencyName: budget.constituency?.name || 'Constituency',
            remainingBudget: this.formatCurrency(budget.remaining),
            percentage: (budget.remaining / budget.totalAllocated * 100).toFixed(1),
            totalBudget: this.formatCurrency(budget.totalAllocated),
            fiscalYear: budget.fiscalYear?.year || new Date().getFullYear(),
          },
        });
      }

      // Emit event
      this.eventEmitter.emit('budget.low', { budget });
    } catch (error) {
      this.logger.error(`Failed to send low budget alert: ${error.message}`);
    }
  }

  /**
   * Send budget exceeded alert
   */
  private async sendBudgetExceededAlert(budget: Budget): Promise<void> {
    this.logger.error(
      `EXCEEDED: Budget ${budget.id} has been exceeded by ${this.formatCurrency(Math.abs(budget.remaining))}`,
    );

    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      // Notify all senior officials
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: {
          roles: ['PS', 'CDFC_MEMBER', 'TAC_MEMBER'],
        },
      });

      const officials = response.data.users || [];

      for (const official of officials) {
        await this.sendNotification({
          type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
          category: 'BUDGET_EXCEEDED',
          priority: 'URGENT',
          recipientId: official.id,
          recipientEmail: official.email,
          recipientPhone: official.phone,
          subject: `URGENT: Budget Exceeded - ${budget.constituency?.name || 'Constituency'}`,
          body: `URGENT: Budget for ${budget.constituency?.name || 'constituency'} has been EXCEEDED by ${this.formatCurrency(Math.abs(budget.remaining))}. Immediate action required.`,
          templateName: 'budget-exceeded',
          templateData: {
            constituencyName: budget.constituency?.name || 'Constituency',
            exceededAmount: this.formatCurrency(Math.abs(budget.remaining)),
            totalBudget: this.formatCurrency(budget.totalAllocated),
            fiscalYear: budget.fiscalYear?.year || new Date().getFullYear(),
          },
        });
      }

      // Emit event
      this.eventEmitter.emit('budget.exceeded', { budget });
    } catch (error) {
      this.logger.error(`Failed to send budget exceeded alert: ${error.message}`);
    }
  }

  /**
   * Manual budget check for specific constituency
   */
  async checkConstituencyBudget(constituencyId: string, fiscalYearId: string): Promise<void> {
    const budget = await this.budgetRepository.findOne({
      where: {
        constituencyId,
        fiscalYearId,
      },
      relations: ['constituency', 'fiscalYear'],
    });

    if (budget) {
      await this.checkBudgetLevel(budget);
    }
  }

  /**
   * Get budget health summary
   */
  async getBudgetHealthSummary(): Promise<{
    total: number;
    healthy: number;
    low: number;
    critical: number;
    exceeded: number;
  }> {
    const budgets = await this.budgetRepository.find();

    const summary = {
      total: budgets.length,
      healthy: 0,
      low: 0,
      critical: 0,
      exceeded: 0,
    };

    for (const budget of budgets) {
      const remainingPercentage = budget.remaining / budget.totalAllocated;

      if (budget.remaining < 0) {
        summary.exceeded++;
      } else if (remainingPercentage <= this.CRITICAL_BUDGET_THRESHOLD) {
        summary.critical++;
      } else if (remainingPercentage <= this.LOW_BUDGET_THRESHOLD) {
        summary.low++;
      } else {
        summary.healthy++;
      }
    }

    return summary;
  }

  private async sendNotification(data: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/notifications`, data);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  private formatCurrency(amount: number): string {
    return `K${amount.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
