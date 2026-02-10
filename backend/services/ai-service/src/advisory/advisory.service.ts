import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Advisory {
  type: 'info' | 'warning' | 'action' | 'insight';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedAction?: string;
  relatedEntities?: Array<{ type: string; id: string; name: string }>;
}

export interface DashboardInsights {
  budgetHealth: Advisory[];
  projectAlerts: Advisory[];
  paymentAlerts: Advisory[];
  complianceAdvisory: Advisory[];
  performanceInsights: Advisory[];
}

@Injectable()
export class AdvisoryService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Generate dashboard insights for a constituency
   */
  async generateDashboardInsights(constituencyId: string): Promise<DashboardInsights> {
    const [budgetHealth, projectAlerts, paymentAlerts, complianceAdvisory, performanceInsights] =
      await Promise.all([
        this.analyzeBudgetHealth(constituencyId),
        this.analyzeProjectAlerts(constituencyId),
        this.analyzePaymentAlerts(constituencyId),
        this.analyzeCompliance(constituencyId),
        this.analyzePerformance(constituencyId),
      ]);

    return {
      budgetHealth,
      projectAlerts,
      paymentAlerts,
      complianceAdvisory,
      performanceInsights,
    };
  }

  /**
   * Analyze budget health
   */
  private async analyzeBudgetHealth(constituencyId: string): Promise<Advisory[]> {
    const advisories: Advisory[] = [];

    const { data: budget } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('constituency_id', constituencyId)
      .eq('fiscal_year', new Date().getFullYear())
      .single();

    if (!budget) {
      advisories.push({
        type: 'warning',
        title: 'No Budget Allocated',
        message: 'No budget has been allocated for this constituency for the current fiscal year.',
        priority: 'high',
        actionable: true,
        suggestedAction: 'Contact the ministry to request budget allocation.',
      });
      return advisories;
    }

    const utilizationRate = (budget.amount_disbursed || 0) / (budget.total_allocation || 1);
    const currentMonth = new Date().getMonth() + 1;
    const expectedUtilization = currentMonth / 12;

    // Check underutilization
    if (utilizationRate < expectedUtilization * 0.5) {
      advisories.push({
        type: 'warning',
        title: 'Budget Underutilization',
        message: `Budget utilization is at ${(utilizationRate * 100).toFixed(1)}%, significantly below the expected ${(expectedUtilization * 100).toFixed(0)}% for this time of year.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Review pending projects and expedite approvals to improve utilization.',
      });
    }

    // Check overutilization
    if (utilizationRate > expectedUtilization * 1.3) {
      advisories.push({
        type: 'warning',
        title: 'Rapid Budget Consumption',
        message: `Budget utilization is at ${(utilizationRate * 100).toFixed(1)}%, ahead of schedule. Consider pacing disbursements.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Review disbursement schedule to ensure funds last through the fiscal year.',
      });
    }

    // Check remaining budget
    const remainingBudget = budget.total_allocation - (budget.amount_disbursed || 0);
    if (remainingBudget < budget.total_allocation * 0.1) {
      advisories.push({
        type: 'warning',
        title: 'Low Budget Remaining',
        message: `Only K${remainingBudget.toLocaleString()} (${((remainingBudget / budget.total_allocation) * 100).toFixed(1)}%) of budget remaining.`,
        priority: 'high',
        actionable: true,
        suggestedAction: 'Prioritize critical projects and defer non-essential spending.',
      });
    }

    if (advisories.length === 0) {
      advisories.push({
        type: 'info',
        title: 'Budget Health Good',
        message: `Budget utilization is on track at ${(utilizationRate * 100).toFixed(1)}%.`,
        priority: 'low',
        actionable: false,
      });
    }

    return advisories;
  }

  /**
   * Analyze project alerts
   */
  private async analyzeProjectAlerts(constituencyId: string): Promise<Advisory[]> {
    const advisories: Advisory[] = [];

    const { data: projects } = await this.supabase
      .from('projects')
      .select('id, name, status, created_at, expected_end_date, progress_percentage')
      .eq('constituency_id', constituencyId)
      .in('status', ['draft', 'submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review', 'implementation']);

    if (!projects) return advisories;

    // Check for stalled projects
    const now = new Date();
    const stalledProjects = projects.filter(p => {
      const createdAt = new Date(p.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return p.status === 'draft' && daysSinceCreation > 30;
    });

    if (stalledProjects.length > 0) {
      advisories.push({
        type: 'warning',
        title: 'Stalled Draft Projects',
        message: `${stalledProjects.length} project(s) have been in draft status for over 30 days.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Review and submit these projects or archive them.',
        relatedEntities: stalledProjects.slice(0, 5).map(p => ({
          type: 'project',
          id: p.id,
          name: p.name,
        })),
      });
    }

    // Check for overdue projects
    const overdueProjects = projects.filter(p => {
      if (!p.expected_end_date || p.status !== 'implementation') return false;
      return new Date(p.expected_end_date) < now;
    });

    if (overdueProjects.length > 0) {
      advisories.push({
        type: 'warning',
        title: 'Overdue Projects',
        message: `${overdueProjects.length} project(s) have passed their expected completion date.`,
        priority: 'high',
        actionable: true,
        suggestedAction: 'Review project status and update timelines or escalate issues.',
        relatedEntities: overdueProjects.slice(0, 5).map(p => ({
          type: 'project',
          id: p.id,
          name: p.name,
        })),
      });
    }

    // Check for low progress projects
    const lowProgressProjects = projects.filter(p => {
      if (p.status !== 'implementation' || !p.expected_end_date) return false;
      const endDate = new Date(p.expected_end_date);
      const startDate = new Date(p.created_at);
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const expectedProgress = (elapsed / totalDuration) * 100;
      return (p.progress_percentage || 0) < expectedProgress * 0.5;
    });

    if (lowProgressProjects.length > 0) {
      advisories.push({
        type: 'warning',
        title: 'Projects Behind Schedule',
        message: `${lowProgressProjects.length} project(s) are significantly behind their expected progress.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Investigate causes for delays and take corrective action.',
        relatedEntities: lowProgressProjects.slice(0, 5).map(p => ({
          type: 'project',
          id: p.id,
          name: p.name,
        })),
      });
    }

    // Check pending approvals
    const pendingApprovals = projects.filter(p =>
      ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(p.status),
    );

    if (pendingApprovals.length > 5) {
      advisories.push({
        type: 'action',
        title: 'Multiple Pending Approvals',
        message: `${pendingApprovals.length} projects are awaiting approval at various stages.`,
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Schedule review meetings to process pending approvals.',
      });
    }

    return advisories;
  }

  /**
   * Analyze payment alerts
   */
  private async analyzePaymentAlerts(constituencyId: string): Promise<Advisory[]> {
    const advisories: Advisory[] = [];

    const { data: payments } = await this.supabase
      .from('payments')
      .select('id, amount, status, created_at, recipient_name')
      .eq('constituency_id', constituencyId)
      .in('status', ['pending', 'panel_a_approved']);

    if (!payments) return advisories;

    const pendingPayments = payments.filter(p => p.status === 'pending');
    const panelAApproved = payments.filter(p => p.status === 'panel_a_approved');

    if (pendingPayments.length > 0) {
      const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      advisories.push({
        type: 'action',
        title: 'Pending Panel A Approvals',
        message: `${pendingPayments.length} payment(s) totaling K${totalPending.toLocaleString()} awaiting Panel A approval.`,
        priority: pendingPayments.length > 5 ? 'high' : 'medium',
        actionable: true,
        suggestedAction: 'Review and process Panel A approvals.',
      });
    }

    if (panelAApproved.length > 0) {
      const totalAwaitingB = panelAApproved.reduce((sum, p) => sum + (p.amount || 0), 0);
      advisories.push({
        type: 'action',
        title: 'Pending Panel B Approvals',
        message: `${panelAApproved.length} payment(s) totaling K${totalAwaitingB.toLocaleString()} awaiting Panel B approval.`,
        priority: panelAApproved.length > 5 ? 'high' : 'medium',
        actionable: true,
        suggestedAction: 'Review and process Panel B approvals.',
      });
    }

    // Check for aged payments
    const now = new Date();
    const agedPayments = payments.filter(p => {
      const createdAt = new Date(p.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceCreation > 14;
    });

    if (agedPayments.length > 0) {
      advisories.push({
        type: 'warning',
        title: 'Aged Pending Payments',
        message: `${agedPayments.length} payment(s) have been pending for over 14 days.`,
        priority: 'high',
        actionable: true,
        suggestedAction: 'Expedite processing of aged payments to avoid delays.',
      });
    }

    return advisories;
  }

  /**
   * Analyze compliance status
   */
  private async analyzeCompliance(constituencyId: string): Promise<Advisory[]> {
    const advisories: Advisory[] = [];

    // Check for missing documents
    const { data: projects } = await this.supabase
      .from('projects')
      .select(`
        id, name, status,
        documents:documents (id, document_type)
      `)
      .eq('constituency_id', constituencyId)
      .eq('status', 'implementation');

    if (projects) {
      const requiredDocTypes = ['contract', 'approval_letter'];
      const missingDocProjects = projects.filter(p => {
        const docs = (p.documents as any[]) || [];
        const docTypes = docs.map(d => d.document_type);
        return requiredDocTypes.some(t => !docTypes.includes(t));
      });

      if (missingDocProjects.length > 0) {
        advisories.push({
          type: 'warning',
          title: 'Missing Required Documents',
          message: `${missingDocProjects.length} project(s) are missing required documentation.`,
          priority: 'high',
          actionable: true,
          suggestedAction: 'Upload missing contracts and approval letters.',
          relatedEntities: missingDocProjects.slice(0, 5).map(p => ({
            type: 'project',
            id: p.id,
            name: p.name,
          })),
        });
      }
    }

    // Check meeting compliance
    const { data: recentMeetings } = await this.supabase
      .from('meetings')
      .select('id, meeting_date')
      .eq('constituency_id', constituencyId)
      .order('meeting_date', { ascending: false })
      .limit(1);

    if (!recentMeetings || recentMeetings.length === 0) {
      advisories.push({
        type: 'warning',
        title: 'No Committee Meetings Recorded',
        message: 'No CDFC meetings have been recorded for this constituency.',
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Schedule and record committee meetings as required.',
      });
    } else {
      const lastMeeting = new Date(recentMeetings[0].meeting_date);
      const daysSinceLastMeeting = Math.floor(
        (new Date().getTime() - lastMeeting.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceLastMeeting > 60) {
        advisories.push({
          type: 'warning',
          title: 'Overdue Committee Meeting',
          message: `Last committee meeting was ${daysSinceLastMeeting} days ago. Quarterly meetings are recommended.`,
          priority: 'medium',
          actionable: true,
          suggestedAction: 'Schedule a committee meeting.',
        });
      }
    }

    return advisories;
  }

  /**
   * Analyze performance metrics
   */
  private async analyzePerformance(constituencyId: string): Promise<Advisory[]> {
    const advisories: Advisory[] = [];

    // Get completed projects this year
    const { data: completedProjects } = await this.supabase
      .from('projects')
      .select('id, name, estimated_cost, approved_amount, progress_percentage')
      .eq('constituency_id', constituencyId)
      .eq('status', 'completed')
      .gte('actual_end_date', `${new Date().getFullYear()}-01-01`);

    if (completedProjects && completedProjects.length > 0) {
      advisories.push({
        type: 'insight',
        title: 'Projects Completed This Year',
        message: `${completedProjects.length} project(s) successfully completed in the current fiscal year.`,
        priority: 'low',
        actionable: false,
      });

      // Check cost efficiency
      const totalEstimated = completedProjects.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
      const totalApproved = completedProjects.reduce((sum, p) => sum + (p.approved_amount || 0), 0);

      if (totalApproved < totalEstimated * 0.9) {
        advisories.push({
          type: 'insight',
          title: 'Good Cost Efficiency',
          message: `Projects completed at ${((totalApproved / totalEstimated) * 100).toFixed(0)}% of estimated cost.`,
          priority: 'low',
          actionable: false,
        });
      }
    }

    return advisories;
  }
}
