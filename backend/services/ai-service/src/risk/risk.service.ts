import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RiskScore {
  score: number; // 0-100, higher = higher risk
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface PaymentRiskInput {
  paymentId: string;
  amount: number;
  projectId: string;
  projectBudget: number;
  projectSpentAmount: number;
  recipientName: string;
  recipientHistory: {
    totalPayments: number;
    totalAmount: number;
    flaggedPayments: number;
  };
  approverHistory: {
    totalApprovals: number;
    averageAmount: number;
    flaggedApprovals: number;
  };
}

export interface ProjectRiskInput {
  projectId: string;
  estimatedCost: number;
  projectType: string;
  constituencyBudget: number;
  constituencySpentAmount: number;
  submitterHistory: {
    totalProjects: number;
    completedProjects: number;
    rejectedProjects: number;
  };
  similarProjectsInArea: number;
}

@Injectable()
export class RiskService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Calculate risk score for a payment
   */
  async calculatePaymentRisk(input: PaymentRiskInput): Promise<RiskScore> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Amount relative to project budget (weight: 25)
    const budgetRatio = input.amount / (input.projectBudget || 1);
    const budgetFactor: RiskFactor = {
      name: 'Budget Utilization',
      weight: 25,
      score: this.calculateBudgetRiskScore(budgetRatio),
      description: `Payment is ${(budgetRatio * 100).toFixed(1)}% of project budget`,
    };
    factors.push(budgetFactor);
    totalScore += budgetFactor.score * budgetFactor.weight;
    totalWeight += budgetFactor.weight;

    // Factor 2: Cumulative spending (weight: 20)
    const spendingRatio = (input.projectSpentAmount + input.amount) / (input.projectBudget || 1);
    const spendingFactor: RiskFactor = {
      name: 'Cumulative Spending',
      weight: 20,
      score: this.calculateSpendingRiskScore(spendingRatio),
      description: `Total spending would be ${(spendingRatio * 100).toFixed(1)}% of budget`,
    };
    factors.push(spendingFactor);
    totalScore += spendingFactor.score * spendingFactor.weight;
    totalWeight += spendingFactor.weight;

    // Factor 3: Recipient history (weight: 20)
    const recipientFlagRate = input.recipientHistory.flaggedPayments /
      (input.recipientHistory.totalPayments || 1);
    const recipientFactor: RiskFactor = {
      name: 'Recipient History',
      weight: 20,
      score: this.calculateRecipientRiskScore(recipientFlagRate, input.recipientHistory.totalPayments),
      description: `Recipient has ${input.recipientHistory.flaggedPayments} flagged payments out of ${input.recipientHistory.totalPayments}`,
    };
    factors.push(recipientFactor);
    totalScore += recipientFactor.score * recipientFactor.weight;
    totalWeight += recipientFactor.weight;

    // Factor 4: Payment amount anomaly (weight: 20)
    const amountAnomaly = input.amount / (input.approverHistory.averageAmount || input.amount);
    const anomalyFactor: RiskFactor = {
      name: 'Amount Anomaly',
      weight: 20,
      score: this.calculateAnomalyRiskScore(amountAnomaly),
      description: `Payment is ${amountAnomaly.toFixed(2)}x the average amount`,
    };
    factors.push(anomalyFactor);
    totalScore += anomalyFactor.score * anomalyFactor.weight;
    totalWeight += anomalyFactor.weight;

    // Factor 5: Approver history (weight: 15)
    const approverFlagRate = input.approverHistory.flaggedApprovals /
      (input.approverHistory.totalApprovals || 1);
    const approverFactor: RiskFactor = {
      name: 'Approver History',
      weight: 15,
      score: this.calculateApproverRiskScore(approverFlagRate),
      description: `Approver has ${(approverFlagRate * 100).toFixed(1)}% flagged approval rate`,
    };
    factors.push(approverFactor);
    totalScore += approverFactor.score * approverFactor.weight;
    totalWeight += approverFactor.weight;

    const finalScore = Math.round(totalScore / totalWeight);
    const level = this.getRiskLevel(finalScore);
    const recommendations = this.getPaymentRecommendations(factors, finalScore);

    return {
      score: finalScore,
      level,
      factors,
      recommendations,
    };
  }

  /**
   * Calculate risk score for a project
   */
  async calculateProjectRisk(input: ProjectRiskInput): Promise<RiskScore> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Cost relative to constituency budget (weight: 25)
    const costRatio = input.estimatedCost / (input.constituencyBudget || 1);
    const costFactor: RiskFactor = {
      name: 'Budget Impact',
      weight: 25,
      score: this.calculateBudgetRiskScore(costRatio),
      description: `Project would use ${(costRatio * 100).toFixed(1)}% of constituency budget`,
    };
    factors.push(costFactor);
    totalScore += costFactor.score * costFactor.weight;
    totalWeight += costFactor.weight;

    // Factor 2: Budget availability (weight: 20)
    const availableRatio = (input.constituencyBudget - input.constituencySpentAmount) /
      (input.constituencyBudget || 1);
    const availabilityFactor: RiskFactor = {
      name: 'Budget Availability',
      weight: 20,
      score: this.calculateAvailabilityRiskScore(availableRatio, costRatio),
      description: `${(availableRatio * 100).toFixed(1)}% of budget remaining`,
    };
    factors.push(availabilityFactor);
    totalScore += availabilityFactor.score * availabilityFactor.weight;
    totalWeight += availabilityFactor.weight;

    // Factor 3: Submitter track record (weight: 25)
    const completionRate = input.submitterHistory.completedProjects /
      (input.submitterHistory.totalProjects || 1);
    const rejectionRate = input.submitterHistory.rejectedProjects /
      (input.submitterHistory.totalProjects || 1);
    const trackRecordFactor: RiskFactor = {
      name: 'Submitter Track Record',
      weight: 25,
      score: this.calculateTrackRecordScore(completionRate, rejectionRate, input.submitterHistory.totalProjects),
      description: `${(completionRate * 100).toFixed(0)}% completion rate, ${(rejectionRate * 100).toFixed(0)}% rejection rate`,
    };
    factors.push(trackRecordFactor);
    totalScore += trackRecordFactor.score * trackRecordFactor.weight;
    totalWeight += trackRecordFactor.weight;

    // Factor 4: Similar projects saturation (weight: 15)
    const saturationFactor: RiskFactor = {
      name: 'Project Saturation',
      weight: 15,
      score: this.calculateSaturationScore(input.similarProjectsInArea),
      description: `${input.similarProjectsInArea} similar projects in the area`,
    };
    factors.push(saturationFactor);
    totalScore += saturationFactor.score * saturationFactor.weight;
    totalWeight += saturationFactor.weight;

    // Factor 5: Project type complexity (weight: 15)
    const complexityFactor: RiskFactor = {
      name: 'Project Complexity',
      weight: 15,
      score: this.calculateComplexityScore(input.projectType, input.estimatedCost),
      description: `${input.projectType} project with K${input.estimatedCost.toLocaleString()} budget`,
    };
    factors.push(complexityFactor);
    totalScore += complexityFactor.score * complexityFactor.weight;
    totalWeight += complexityFactor.weight;

    const finalScore = Math.round(totalScore / totalWeight);
    const level = this.getRiskLevel(finalScore);
    const recommendations = this.getProjectRecommendations(factors, finalScore);

    return {
      score: finalScore,
      level,
      factors,
      recommendations,
    };
  }

  /**
   * Get risk assessment for a payment from database
   */
  async assessPaymentRisk(paymentId: string): Promise<RiskScore> {
    const { data: payment } = await this.supabase
      .from('payments')
      .select(`
        id, amount, project_id, recipient_name,
        projects:project_id (
          id, approved_amount,
          payments:payments (amount, status)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const project = payment.projects as any;
    const projectPayments = project?.payments || [];
    const spentAmount = projectPayments
      .filter((p: any) => p.status === 'disbursed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Get recipient history
    const { data: recipientPayments } = await this.supabase
      .from('payments')
      .select('id, amount, status')
      .eq('recipient_name', payment.recipient_name);

    const recipientHistory = {
      totalPayments: recipientPayments?.length || 0,
      totalAmount: recipientPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      flaggedPayments: recipientPayments?.filter(p => p.status === 'rejected').length || 0,
    };

    return this.calculatePaymentRisk({
      paymentId: payment.id,
      amount: payment.amount,
      projectId: payment.project_id,
      projectBudget: project?.approved_amount || 0,
      projectSpentAmount: spentAmount,
      recipientName: payment.recipient_name,
      recipientHistory,
      approverHistory: {
        totalApprovals: 0,
        averageAmount: payment.amount,
        flaggedApprovals: 0,
      },
    });
  }

  // Risk calculation helper methods
  private calculateBudgetRiskScore(ratio: number): number {
    if (ratio <= 0.1) return 10;
    if (ratio <= 0.25) return 25;
    if (ratio <= 0.5) return 50;
    if (ratio <= 0.75) return 75;
    return 90;
  }

  private calculateSpendingRiskScore(ratio: number): number {
    if (ratio <= 0.5) return 10;
    if (ratio <= 0.75) return 30;
    if (ratio <= 0.9) return 60;
    if (ratio <= 1.0) return 80;
    return 100; // Over budget
  }

  private calculateRecipientRiskScore(flagRate: number, totalPayments: number): number {
    if (totalPayments === 0) return 40; // New recipient, moderate risk
    if (flagRate === 0) return 10;
    if (flagRate <= 0.1) return 30;
    if (flagRate <= 0.25) return 60;
    return 90;
  }

  private calculateAnomalyRiskScore(ratio: number): number {
    if (ratio <= 1.5) return 10;
    if (ratio <= 2.0) return 30;
    if (ratio <= 3.0) return 60;
    if (ratio <= 5.0) return 80;
    return 95;
  }

  private calculateApproverRiskScore(flagRate: number): number {
    if (flagRate <= 0.05) return 10;
    if (flagRate <= 0.1) return 30;
    if (flagRate <= 0.2) return 60;
    return 85;
  }

  private calculateAvailabilityRiskScore(availableRatio: number, costRatio: number): number {
    if (costRatio > availableRatio) return 95; // Exceeds available budget
    if (availableRatio >= 0.5) return 10;
    if (availableRatio >= 0.25) return 40;
    return 70;
  }

  private calculateTrackRecordScore(completionRate: number, rejectionRate: number, total: number): number {
    if (total === 0) return 50; // New submitter
    if (completionRate >= 0.8 && rejectionRate <= 0.1) return 10;
    if (completionRate >= 0.6 && rejectionRate <= 0.2) return 30;
    if (completionRate >= 0.4 && rejectionRate <= 0.3) return 50;
    return 80;
  }

  private calculateSaturationScore(count: number): number {
    if (count <= 2) return 10;
    if (count <= 5) return 30;
    if (count <= 10) return 50;
    return 70;
  }

  private calculateComplexityScore(projectType: string, cost: number): number {
    const complexTypes = ['infrastructure', 'water_sanitation'];
    const isComplex = complexTypes.includes(projectType);
    const isHighCost = cost > 500000;

    if (!isComplex && !isHighCost) return 20;
    if (isComplex && !isHighCost) return 40;
    if (!isComplex && isHighCost) return 50;
    return 70;
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  }

  private getPaymentRecommendations(factors: RiskFactor[], score: number): string[] {
    const recommendations: string[] = [];

    for (const factor of factors) {
      if (factor.score >= 70) {
        switch (factor.name) {
          case 'Budget Utilization':
            recommendations.push('Consider splitting payment into smaller milestones');
            break;
          case 'Cumulative Spending':
            recommendations.push('Review total project spending before approval');
            break;
          case 'Recipient History':
            recommendations.push('Conduct additional verification of recipient credentials');
            break;
          case 'Amount Anomaly':
            recommendations.push('Request detailed breakdown of payment components');
            break;
          case 'Approver History':
            recommendations.push('Consider secondary review by audit team');
            break;
        }
      }
    }

    if (score >= 75) {
      recommendations.push('Escalate to senior management for review');
    }

    return recommendations;
  }

  private getProjectRecommendations(factors: RiskFactor[], score: number): string[] {
    const recommendations: string[] = [];

    for (const factor of factors) {
      if (factor.score >= 70) {
        switch (factor.name) {
          case 'Budget Impact':
            recommendations.push('Consider phased implementation to reduce budget impact');
            break;
          case 'Budget Availability':
            recommendations.push('Verify budget availability before approval');
            break;
          case 'Submitter Track Record':
            recommendations.push('Assign experienced project manager for oversight');
            break;
          case 'Project Saturation':
            recommendations.push('Consider alternative locations or project types');
            break;
          case 'Project Complexity':
            recommendations.push('Require detailed implementation plan and technical review');
            break;
        }
      }
    }

    if (score >= 75) {
      recommendations.push('Conduct comprehensive risk assessment before approval');
    }

    return recommendations;
  }
}
