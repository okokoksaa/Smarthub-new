import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AuditLog,
  Project,
  Payment,
  User,
  PaymentStatus,
  ProjectStatus,
  AuditAction,
} from '@shared/database';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'financial' | 'operational' | 'security' | 'regulatory';
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  category: string;
  description: string;
  entityType: string;
  entityId: string;
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  notes?: string;
  evidenceData: Record<string, any>;
}

export interface ComplianceScore {
  overall: number;
  byCategory: Record<string, number>;
  violationCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'declining' | 'stable';
  lastAssessment: Date;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  private complianceRules: ComplianceRule[] = [
    {
      id: 'dual-approval',
      name: 'Dual Approval Required',
      description: 'All payments above threshold must have dual approval',
      severity: 'critical',
      category: 'financial',
      enabled: true,
      parameters: { threshold: 10000 },
    },
    {
      id: 'documentation-required',
      name: 'Project Documentation Required',
      description: 'All projects must have supporting documentation',
      severity: 'high',
      category: 'operational',
      enabled: true,
    },
    {
      id: 'approval-timeline',
      name: 'Approval Timeline Compliance',
      description: 'Payments must be processed within 30 days',
      severity: 'medium',
      category: 'operational',
      enabled: true,
      parameters: { maxDays: 30 },
    },
    {
      id: 'budget-threshold',
      name: 'Budget Threshold Compliance',
      description: 'Projects cannot exceed allocated budget by more than 10%',
      severity: 'high',
      category: 'financial',
      enabled: true,
      parameters: { maxOverrun: 0.1 },
    },
    {
      id: 'audit-trail-integrity',
      name: 'Audit Trail Integrity',
      description: 'Audit logs must maintain hash chain integrity',
      severity: 'critical',
      category: 'security',
      enabled: true,
    },
    {
      id: 'user-access-review',
      name: 'User Access Review',
      description: 'User permissions must be reviewed regularly',
      severity: 'medium',
      category: 'security',
      enabled: true,
      parameters: { reviewIntervalDays: 90 },
    },
  ];

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Run comprehensive compliance assessment
   */
  async runComplianceAssessment(): Promise<{
    score: ComplianceScore;
    violations: ComplianceViolation[];
    summary: Record<string, any>;
  }> {
    this.logger.log('Starting comprehensive compliance assessment...');

    const violations: ComplianceViolation[] = [];

    // Run each compliance rule
    for (const rule of this.complianceRules.filter(r => r.enabled)) {
      try {
        const ruleViolations = await this.checkComplianceRule(rule);
        violations.push(...ruleViolations);
      } catch (error) {
        this.logger.error(`Error checking rule ${rule.id}: ${error.message}`);
      }
    }

    // Calculate compliance score
    const score = await this.calculateComplianceScore(violations);

    // Generate summary
    const summary = this.generateComplianceSummary(violations, score);

    this.logger.log(`Compliance assessment completed: ${violations.length} violations found`);

    return { score, violations, summary };
  }

  /**
   * Check specific compliance rule
   */
  async checkComplianceRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    switch (rule.id) {
      case 'dual-approval':
        return this.checkDualApprovalRule(rule);
      case 'documentation-required':
        return this.checkDocumentationRule(rule);
      case 'approval-timeline':
        return this.checkApprovalTimelineRule(rule);
      case 'budget-threshold':
        return this.checkBudgetThresholdRule(rule);
      case 'audit-trail-integrity':
        return this.checkAuditTrailIntegrityRule(rule);
      case 'user-access-review':
        return this.checkUserAccessReviewRule(rule);
      default:
        this.logger.warn(`Unknown compliance rule: ${rule.id}`);
        return [];
    }
  }

  /**
   * Check dual approval compliance
   */
  private async checkDualApprovalRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const threshold = rule.parameters?.threshold || 10000;
    
    const violations: ComplianceViolation[] = [];
    
    // Find payments above threshold that are paid but missing approvals
    const payments = await this.paymentRepository.find({
      where: { status: PaymentStatus.PAID },
      relations: ['project'],
    });

    for (const payment of payments) {
      if (Number(payment.amount) >= threshold) {
        if (!payment.panelAApprovedAt || !payment.panelBApprovedAt) {
          violations.push({
            id: `dual-approval-${payment.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            description: `Payment ${payment.voucherNumber} of ${payment.amount} ZMW was processed without proper dual approval`,
            entityType: 'Payment',
            entityId: payment.id,
            detectedAt: new Date(),
            status: 'open',
            evidenceData: {
              paymentId: payment.id,
              amount: Number(payment.amount),
              threshold,
              panelAApproved: !!payment.panelAApprovedAt,
              panelBApproved: !!payment.panelBApprovedAt,
              paidAt: payment.paidAt,
            },
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check documentation compliance
   */
  private async checkDocumentationRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    const projects = await this.projectRepository.find({
      where: { status: ProjectStatus.IN_PROGRESS },
      relations: ['documents'],
    });

    for (const project of projects) {
      if (!project.documents || project.documents.length === 0) {
        violations.push({
          id: `documentation-${project.id}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          category: rule.category,
          description: `Project ${project.name} lacks required supporting documentation`,
          entityType: 'Project',
          entityId: project.id,
          detectedAt: new Date(),
          status: 'open',
          evidenceData: {
            projectId: project.id,
            projectName: project.name,
            documentCount: project.documents?.length || 0,
          },
        });
      }
    }

    return violations;
  }

  /**
   * Check approval timeline compliance
   */
  private async checkApprovalTimelineRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const maxDays = rule.parameters?.maxDays || 30;
    const violations: ComplianceViolation[] = [];
    
    const payments = await this.paymentRepository.find({
      where: { status: PaymentStatus.PAID },
    });

    for (const payment of payments) {
      if (payment.paidAt) {
        const processingDays = Math.ceil(
          (payment.paidAt.getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (processingDays > maxDays) {
          violations.push({
            id: `timeline-${payment.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            description: `Payment ${payment.voucherNumber} took ${processingDays} days to process (max: ${maxDays} days)`,
            entityType: 'Payment',
            entityId: payment.id,
            detectedAt: new Date(),
            status: 'open',
            evidenceData: {
              paymentId: payment.id,
              processingDays,
              maxDays,
              createdAt: payment.createdAt,
              paidAt: payment.paidAt,
            },
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check budget threshold compliance
   */
  private async checkBudgetThresholdRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const maxOverrun = rule.parameters?.maxOverrun || 0.1;
    const violations: ComplianceViolation[] = [];
    
    const projects = await this.projectRepository.find({
      relations: ['payments'],
    });

    for (const project of projects) {
      if (project.payments && project.payments.length > 0) {
        const totalSpent = project.payments
          .filter(p => p.status === PaymentStatus.PAID)
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const budget = Number(project.totalBudget);
        const overrunPercentage = (totalSpent - budget) / budget;

        if (overrunPercentage > maxOverrun) {
          violations.push({
            id: `budget-${project.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            description: `Project ${project.name} has exceeded budget by ${(overrunPercentage * 100).toFixed(1)}% (max: ${(maxOverrun * 100)}%)`,
            entityType: 'Project',
            entityId: project.id,
            detectedAt: new Date(),
            status: 'open',
            evidenceData: {
              projectId: project.id,
              budget,
              totalSpent,
              overrunPercentage,
              maxOverrun,
            },
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check audit trail integrity
   */
  private async checkAuditTrailIntegrityRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];
    
    const logs = await this.auditLogRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
      take: 1000, // Check last 1000 entries for performance
    });

    let brokenChains = 0;
    
    for (let i = 1; i < logs.length; i++) {
      const current = logs[i];
      const previous = logs[i - 1];
      
      // Check if chain is broken
      if (current.previousEntryId !== previous.id) {
        brokenChains++;
      }
    }

    if (brokenChains > 0) {
      violations.push({
        id: `audit-integrity-${Date.now()}`,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        category: rule.category,
        description: `Audit trail integrity compromised: ${brokenChains} broken chain links detected`,
        entityType: 'AuditLog',
        entityId: 'audit-trail',
        detectedAt: new Date(),
        status: 'open',
        evidenceData: {
          brokenChains,
          totalEntriesChecked: logs.length,
        },
      });
    }

    return violations;
  }

  /**
   * Check user access review compliance
   */
  private async checkUserAccessReviewRule(rule: ComplianceRule): Promise<ComplianceViolation[]> {
    const reviewIntervalDays = rule.parameters?.reviewIntervalDays || 90;
    const violations: ComplianceViolation[] = [];
    
    const users = await this.userRepository.find({
      where: { isActive: true },
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - reviewIntervalDays);

    for (const user of users) {
      // Check if user has had recent access review (using lastLoginAt as proxy)
      if (!user.lastLoginAt || user.lastLoginAt < cutoffDate) {
        violations.push({
          id: `access-review-${user.id}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          category: rule.category,
          description: `User ${user.email} access has not been reviewed in ${reviewIntervalDays} days`,
          entityType: 'User',
          entityId: user.id,
          detectedAt: new Date(),
          status: 'open',
          evidenceData: {
            userId: user.id,
            email: user.email,
            lastLoginAt: user.lastLoginAt,
            reviewIntervalDays,
          },
        });
      }
    }

    return violations;
  }

  /**
   * Calculate overall compliance score
   */
  private async calculateComplianceScore(violations: ComplianceViolation[]): Promise<ComplianceScore> {
    const totalRules = this.complianceRules.filter(r => r.enabled).length;
    const violatedRules = new Set(violations.map(v => v.ruleId)).size;
    
    // Weight violations by severity
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalWeight = violations.reduce((sum, v) => sum + severityWeights[v.severity as keyof typeof severityWeights], 0);
    const maxPossibleWeight = totalRules * severityWeights.critical;
    
    const overall = maxPossibleWeight > 0 ? Math.max(0, 100 - (totalWeight / maxPossibleWeight * 100)) : 100;

    // Calculate by category
    const byCategory: Record<string, number> = {};
    const categories = ['financial', 'operational', 'security', 'regulatory'];
    
    for (const category of categories) {
      const categoryRules = this.complianceRules.filter(r => r.enabled && r.category === category);
      const categoryViolations = violations.filter(v => v.category === category);
      
      if (categoryRules.length > 0) {
        const categoryWeight = categoryViolations.reduce(
          (sum, v) => sum + severityWeights[v.severity as keyof typeof severityWeights], 0
        );
        const maxCategoryWeight = categoryRules.length * severityWeights.critical;
        byCategory[category] = Math.max(0, 100 - (categoryWeight / maxCategoryWeight * 100));
      } else {
        byCategory[category] = 100;
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overall >= 90) riskLevel = 'low';
    else if (overall >= 70) riskLevel = 'medium';
    else if (overall >= 50) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      overall: Math.round(overall * 100) / 100,
      byCategory,
      violationCount: violations.length,
      riskLevel,
      trend: 'stable', // Would need historical data to calculate trend
      lastAssessment: new Date(),
    };
  }

  /**
   * Generate compliance summary
   */
  private generateComplianceSummary(violations: ComplianceViolation[], score: ComplianceScore): Record<string, any> {
    const severityCounts = violations.reduce((counts, v) => {
      counts[v.severity] = (counts[v.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const categoryCounts = violations.reduce((counts, v) => {
      counts[v.category] = (counts[v.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const topViolations = violations
      .filter(v => ['high', 'critical'].includes(v.severity))
      .slice(0, 10);

    return {
      overallScore: score.overall,
      riskLevel: score.riskLevel,
      totalViolations: violations.length,
      severityBreakdown: severityCounts,
      categoryBreakdown: categoryCounts,
      categoryScores: score.byCategory,
      criticalIssues: severityCounts.critical || 0,
      highRiskIssues: severityCounts.high || 0,
      topViolations,
      recommendations: this.generateRecommendations(violations),
      lastAssessment: score.lastAssessment,
    };
  }

  /**
   * Generate recommendations based on violations
   */
  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations: string[] = [];

    // Dual approval recommendations
    if (violations.some(v => v.ruleId === 'dual-approval')) {
      recommendations.push('Implement mandatory dual approval workflow for all payments above threshold');
      recommendations.push('Review payment processing procedures to ensure compliance');
    }

    // Documentation recommendations
    if (violations.some(v => v.ruleId === 'documentation-required')) {
      recommendations.push('Establish mandatory documentation requirements for all projects');
      recommendations.push('Implement automated reminders for missing documentation');
    }

    // Timeline recommendations
    if (violations.some(v => v.ruleId === 'approval-timeline')) {
      recommendations.push('Streamline payment approval process to meet timeline requirements');
      recommendations.push('Implement automated escalation for overdue payments');
    }

    // Budget recommendations
    if (violations.some(v => v.ruleId === 'budget-threshold')) {
      recommendations.push('Implement stricter budget monitoring and early warning systems');
      recommendations.push('Require additional approval for budget overruns');
    }

    // Audit trail recommendations
    if (violations.some(v => v.ruleId === 'audit-trail-integrity')) {
      recommendations.push('CRITICAL: Investigate audit trail integrity issues immediately');
      recommendations.push('Review system security and access controls');
    }

    // Access review recommendations
    if (violations.some(v => v.ruleId === 'user-access-review')) {
      recommendations.push('Implement regular user access review process');
      recommendations.push('Disable inactive user accounts after specified period');
    }

    return recommendations;
  }

  /**
   * Get compliance rules
   */
  async getComplianceRules(): Promise<ComplianceRule[]> {
    return this.complianceRules;
  }

  /**
   * Update compliance rule
   */
  async updateComplianceRule(ruleId: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule> {
    const ruleIndex = this.complianceRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error(`Compliance rule ${ruleId} not found`);
    }

    this.complianceRules[ruleIndex] = {
      ...this.complianceRules[ruleIndex],
      ...updates,
    };

    return this.complianceRules[ruleIndex];
  }

  /**
   * Scheduled compliance assessment
   * Runs daily at 1 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduledComplianceAssessment(): Promise<void> {
    this.logger.log('Running scheduled compliance assessment...');
    
    try {
      const assessment = await this.runComplianceAssessment();
      
      if (assessment.violations.length > 0) {
        const criticalViolations = assessment.violations.filter(v => v.severity === 'critical');
        const highViolations = assessment.violations.filter(v => v.severity === 'high');
        
        this.logger.warn(
          `Compliance assessment completed: ${assessment.violations.length} violations found ` +
          `(${criticalViolations.length} critical, ${highViolations.length} high)`
        );
        
        // In a real implementation, you would:
        // 1. Store violations in database
        // 2. Send notifications to administrators
        // 3. Create tickets for investigation
        // 4. Update compliance dashboard
      } else {
        this.logger.log('Compliance assessment passed - no violations detected');
      }
    } catch (error) {
      this.logger.error(`Scheduled compliance assessment failed: ${error.message}`, error.stack);
    }
  }
}