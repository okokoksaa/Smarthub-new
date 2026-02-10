import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Milestone, MilestoneStatus } from '@shared/database';
import axios from 'axios';

/**
 * Milestone Monitoring Service
 * Monitors milestone deadlines and triggers alerts
 */
@Injectable()
export class MilestoneMonitorService {
  private readonly logger = new Logger(MilestoneMonitorService.name);
  private readonly notificationServiceUrl: string;

  constructor(
    @InjectRepository(Milestone)
    private readonly milestoneRepository: Repository<Milestone>,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.notificationServiceUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://notification-service/api/v1';
  }

  /**
   * Run milestone monitoring daily at 8 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async monitorMilestones() {
    this.logger.log('Running milestone monitoring check...');

    try {
      // Check for overdue milestones
      await this.checkOverdueMilestones();

      // Check for milestones due soon (within 7 days)
      await this.checkUpcomingMilestones();

      this.logger.log('Milestone monitoring completed');
    } catch (error) {
      this.logger.error(`Milestone monitoring failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for overdue milestones
   */
  private async checkOverdueMilestones(): Promise<void> {
    const now = new Date();

    const overdueMilestones = await this.milestoneRepository.find({
      where: {
        dueDate: LessThan(now),
        status: In([MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS]),
      },
      relations: ['project'],
    });

    this.logger.warn(`Found ${overdueMilestones.length} overdue milestones`);

    for (const milestone of overdueMilestones) {
      await this.sendOverdueAlert(milestone);
    }
  }

  /**
   * Check for milestones due within 7 days
   */
  private async checkUpcomingMilestones(): Promise<void> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingMilestones = await this.milestoneRepository
      .createQueryBuilder('milestone')
      .leftJoinAndSelect('milestone.project', 'project')
      .where('milestone.dueDate > :now', { now })
      .andWhere('milestone.dueDate <= :sevenDays', { sevenDays: sevenDaysFromNow })
      .andWhere('milestone.status IN (:...statuses)', {
        statuses: [MilestoneStatus.PENDING, MilestoneStatus.IN_PROGRESS],
      })
      .getMany();

    this.logger.log(`Found ${upcomingMilestones.length} upcoming milestones (due within 7 days)`);

    for (const milestone of upcomingMilestones) {
      await this.sendUpcomingAlert(milestone);
    }
  }

  /**
   * Send overdue milestone alert
   */
  private async sendOverdueAlert(milestone: Milestone): Promise<void> {
    const daysOverdue = Math.floor(
      (new Date().getTime() - milestone.dueDate.getTime()) / (24 * 60 * 60 * 1000),
    );

    this.logger.warn(
      `Milestone ${milestone.id} is ${daysOverdue} days overdue for project ${milestone.project.name}`,
    );

    try {
      // Notify project creator
      await this.sendNotification({
        type: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
        category: 'MILESTONE_OVERDUE',
        priority: 'URGENT',
        recipientId: milestone.project.createdBy,
        subject: `OVERDUE: Milestone "${milestone.name}"`,
        body: `Milestone "${milestone.name}" for project "${milestone.project.name}" is ${daysOverdue} days overdue.`,
        templateName: 'milestone-overdue',
        templateData: {
          milestoneName: milestone.name,
          projectName: milestone.project.name,
          dueDate: milestone.dueDate.toISOString().split('T')[0],
          daysOverdue,
        },
        projectId: milestone.projectId,
      });

      // Notify supervisors (MPs, CDFC members)
      await this.notifySupervisors(milestone, daysOverdue);

      // Emit event
      this.eventEmitter.emit('milestone.overdue', { milestone, daysOverdue });
    } catch (error) {
      this.logger.error(`Failed to send overdue alert for milestone ${milestone.id}: ${error.message}`);
    }
  }

  /**
   * Send upcoming milestone alert
   */
  private async sendUpcomingAlert(milestone: Milestone): Promise<void> {
    const daysUntilDue = Math.ceil(
      (milestone.dueDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000),
    );

    this.logger.log(
      `Milestone ${milestone.id} is due in ${daysUntilDue} days for project ${milestone.project.name}`,
    );

    try {
      await this.sendNotification({
        type: ['EMAIL', 'IN_APP'],
        category: 'MILESTONE_CREATED',
        priority: daysUntilDue <= 3 ? 'HIGH' : 'NORMAL',
        recipientId: milestone.project.createdBy,
        subject: `Reminder: Milestone "${milestone.name}" Due Soon`,
        body: `Milestone "${milestone.name}" for project "${milestone.project.name}" is due in ${daysUntilDue} days.`,
        templateName: 'milestone-reminder',
        templateData: {
          milestoneName: milestone.name,
          projectName: milestone.project.name,
          dueDate: milestone.dueDate.toISOString().split('T')[0],
          daysUntilDue,
        },
        projectId: milestone.projectId,
      });
    } catch (error) {
      this.logger.error(`Failed to send upcoming alert for milestone ${milestone.id}: ${error.message}`);
    }
  }

  /**
   * Notify supervisors about overdue milestones
   */
  private async notifySupervisors(milestone: Milestone, daysOverdue: number): Promise<void> {
    const userServiceUrl = this.configService.get<string>('USER_SERVICE_URL') || 'http://user-service/api/v1';

    try {
      // Get MPs and CDFC members for the project's constituency
      const response = await axios.get(`${userServiceUrl}/users`, {
        params: {
          constituencyId: milestone.project.constituencyId,
          roles: ['MP', 'CDFC_MEMBER'],
        },
      });

      const supervisors = response.data.users || [];

      for (const supervisor of supervisors) {
        await this.sendNotification({
          type: ['EMAIL', 'IN_APP'],
          category: 'MILESTONE_OVERDUE',
          priority: 'HIGH',
          recipientId: supervisor.id,
          recipientEmail: supervisor.email,
          subject: `Overdue Milestone in ${milestone.project.name}`,
          body: `Milestone "${milestone.name}" in project "${milestone.project.name}" is ${daysOverdue} days overdue.`,
          templateName: 'milestone-overdue-supervisor',
          templateData: {
            milestoneName: milestone.name,
            projectName: milestone.project.name,
            daysOverdue,
            dueDate: milestone.dueDate.toISOString().split('T')[0],
          },
          projectId: milestone.projectId,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to notify supervisors: ${error.message}`);
    }
  }

  /**
   * Get milestone health summary
   */
  async getMilestoneHealthSummary(): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    upcomingSoon: number;
  }> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allMilestones = await this.milestoneRepository.find();

    const summary = {
      total: allMilestones.length,
      completed: 0,
      inProgress: 0,
      pending: 0,
      overdue: 0,
      upcomingSoon: 0,
    };

    for (const milestone of allMilestones) {
      // Status counts
      if (milestone.status === MilestoneStatus.COMPLETED) {
        summary.completed++;
      } else if (milestone.status === MilestoneStatus.IN_PROGRESS) {
        summary.inProgress++;
      } else if (milestone.status === MilestoneStatus.PENDING) {
        summary.pending++;
      }

      // Overdue check (not completed and past due date)
      if (
        milestone.status !== MilestoneStatus.COMPLETED &&
        milestone.dueDate < now
      ) {
        summary.overdue++;
      }

      // Upcoming soon check (not completed and due within 7 days)
      if (
        milestone.status !== MilestoneStatus.COMPLETED &&
        milestone.dueDate > now &&
        milestone.dueDate <= sevenDaysFromNow
      ) {
        summary.upcomingSoon++;
      }
    }

    return summary;
  }

  /**
   * Manual check for specific project's milestones
   */
  async checkProjectMilestones(projectId: string): Promise<void> {
    const milestones = await this.milestoneRepository.find({
      where: { projectId },
      relations: ['project'],
    });

    const now = new Date();

    for (const milestone of milestones) {
      if (
        milestone.dueDate < now &&
        milestone.status !== MilestoneStatus.COMPLETED
      ) {
        await this.sendOverdueAlert(milestone);
      }
    }
  }

  private async sendNotification(data: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/notifications`, data);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
}
