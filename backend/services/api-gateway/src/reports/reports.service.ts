import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GenerateReportDto, ReportType } from './dto/generate-report.dto';

export interface ConstituencyReport {
  constituency: {
    id: string;
    name: string;
    code: string;
    district: string;
    province: string;
  };
  summary: {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_budget: number;
    spent_amount: number;
    remaining_budget: number;
    utilization_rate: number;
  };
  projects_by_status: Record<string, number>;
  recent_projects: Array<{
    id: string;
    name: string;
    status: string;
    approved_amount: number;
    progress: number;
  }>;
  payment_summary: {
    total_payments: number;
    pending_payments: number;
    approved_payments: number;
    disbursed_amount: number;
  };
}

export interface FinancialReport {
  period: { start: string; end: string };
  summary: {
    total_budget: number;
    total_disbursed: number;
    total_pending: number;
    utilization_rate: number;
  };
  by_constituency: Array<{
    constituency_id: string;
    constituency_name: string;
    budget: number;
    spent: number;
    utilization: number;
  }>;
  by_project_type: Record<string, number>;
  monthly_trend: Array<{
    month: string;
    disbursed: number;
    approved: number;
  }>;
}

export interface ProjectStatusReport {
  total_projects: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  average_completion_time: number;
  projects: Array<{
    id: string;
    name: string;
    project_number: string;
    status: string;
    constituency: string;
    approved_amount: number;
    progress: number;
    created_at: string;
  }>;
}

export interface PaymentAnalyticsReport {
  period: { start: string; end: string };
  summary: {
    total_payments: number;
    total_amount: number;
    average_amount: number;
    approval_rate: number;
  };
  by_status: Record<string, { count: number; amount: number }>;
  panel_analytics: {
    panel_a_approvals: number;
    panel_b_approvals: number;
    average_approval_time_hours: number;
  };
  top_recipients: Array<{
    name: string;
    total_amount: number;
    payment_count: number;
  }>;
}

export interface ComplianceReport {
  audit_summary: {
    total_audits: number;
    issues_found: number;
    issues_resolved: number;
  };
  compliance_score: number;
  issues: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    status: string;
    created_at: string;
  }>;
  document_compliance: {
    total_required: number;
    submitted: number;
    verified: number;
    missing: number;
  };
}

@Injectable()
export class ReportsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Generate a comprehensive constituency report
   */
  async getConstituencyReport(constituencyId: string): Promise<ConstituencyReport> {
    // Get constituency details
    const { data: constituency, error: constError } = await this.supabase
      .from('constituencies')
      .select(`
        id, name, code,
        districts:district_id (name, provinces:province_id (name))
      `)
      .eq('id', constituencyId)
      .single();

    if (constError || !constituency) {
      throw new BadRequestException('Constituency not found');
    }

    // Get projects
    const { data: projects } = await this.supabase
      .from('projects')
      .select('id, name, status, approved_amount, progress_percentage')
      .eq('constituency_id', constituencyId);

    // Get budget
    const { data: budget } = await this.supabase
      .from('budgets')
      .select('total_allocation, amount_disbursed')
      .eq('constituency_id', constituencyId)
      .eq('fiscal_year', new Date().getFullYear())
      .single();

    // Get payments summary
    const { data: payments } = await this.supabase
      .from('payments')
      .select('id, status, amount')
      .eq('constituency_id', constituencyId);

    // Calculate statistics
    const projectsList = projects || [];
    const paymentsList = payments || [];
    const totalBudget = budget?.total_allocation || 0;
    const spentAmount = budget?.amount_disbursed || 0;

    const projectsByStatus: Record<string, number> = {};
    let activeCount = 0;
    let completedCount = 0;

    for (const project of projectsList) {
      projectsByStatus[project.status] = (projectsByStatus[project.status] || 0) + 1;
      if (project.status === 'implementation' || project.status === 'approved') {
        activeCount++;
      }
      if (project.status === 'completed') {
        completedCount++;
      }
    }

    const pendingPayments = paymentsList.filter(p => p.status === 'pending' || p.status === 'panel_a_approved').length;
    const approvedPayments = paymentsList.filter(p => p.status === 'approved' || p.status === 'disbursed').length;
    const disbursedAmount = paymentsList
      .filter(p => p.status === 'disbursed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const districtData = constituency.districts as unknown as { name: string; provinces: { name: string } } | null;

    return {
      constituency: {
        id: constituency.id,
        name: constituency.name,
        code: constituency.code,
        district: districtData?.name || '',
        province: districtData?.provinces?.name || '',
      },
      summary: {
        total_projects: projectsList.length,
        active_projects: activeCount,
        completed_projects: completedCount,
        total_budget: totalBudget,
        spent_amount: spentAmount,
        remaining_budget: totalBudget - spentAmount,
        utilization_rate: totalBudget > 0 ? (spentAmount / totalBudget) * 100 : 0,
      },
      projects_by_status: projectsByStatus,
      recent_projects: projectsList.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        approved_amount: p.approved_amount || 0,
        progress: p.progress_percentage || 0,
      })),
      payment_summary: {
        total_payments: paymentsList.length,
        pending_payments: pendingPayments,
        approved_payments: approvedPayments,
        disbursed_amount: disbursedAmount,
      },
    };
  }

  /**
   * Generate financial summary report
   */
  async getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    // Get all budgets
    const { data: budgets } = await this.supabase
      .from('budgets')
      .select(`
        id, constituency_id, total_allocation, amount_disbursed,
        constituencies:constituency_id (id, name)
      `)
      .eq('fiscal_year', new Date().getFullYear());

    // Get payments in date range
    const { data: payments } = await this.supabase
      .from('payments')
      .select('id, amount, status, created_at, projects:project_id (project_type)')
      .gte('created_at', start)
      .lte('created_at', end);

    const budgetsList = budgets || [];
    const paymentsList = payments || [];

    const totalBudget = budgetsList.reduce((sum, b) => sum + (b.total_allocation || 0), 0);
    const totalDisbursed = budgetsList.reduce((sum, b) => sum + (b.amount_disbursed || 0), 0);
    const totalPending = paymentsList
      .filter(p => p.status !== 'disbursed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const byConstituency = budgetsList.map(b => {
      const constData = b.constituencies as unknown as { id: string; name: string } | null;
      return {
        constituency_id: b.constituency_id,
        constituency_name: constData?.name || 'Unknown',
        budget: b.total_allocation || 0,
        spent: b.amount_disbursed || 0,
        utilization: b.total_allocation > 0 ? ((b.amount_disbursed || 0) / b.total_allocation) * 100 : 0,
      };
    });

    const byProjectType: Record<string, number> = {};
    for (const payment of paymentsList) {
      const projectData = payment.projects as unknown as { project_type: string } | null;
      const type = projectData?.project_type || 'other';
      byProjectType[type] = (byProjectType[type] || 0) + (payment.amount || 0);
    }

    // Monthly trend (simplified)
    const monthlyTrend: Array<{ month: string; disbursed: number; approved: number }> = [];
    const monthMap: Record<string, { disbursed: number; approved: number }> = {};

    for (const payment of paymentsList) {
      const month = payment.created_at.substring(0, 7); // YYYY-MM
      if (!monthMap[month]) {
        monthMap[month] = { disbursed: 0, approved: 0 };
      }
      if (payment.status === 'disbursed') {
        monthMap[month].disbursed += payment.amount || 0;
      }
      if (payment.status === 'approved' || payment.status === 'disbursed') {
        monthMap[month].approved += payment.amount || 0;
      }
    }

    for (const [month, data] of Object.entries(monthMap).sort()) {
      monthlyTrend.push({ month, ...data });
    }

    return {
      period: { start, end },
      summary: {
        total_budget: totalBudget,
        total_disbursed: totalDisbursed,
        total_pending: totalPending,
        utilization_rate: totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0,
      },
      by_constituency: byConstituency,
      by_project_type: byProjectType,
      monthly_trend: monthlyTrend,
    };
  }

  /**
   * Generate project status report
   */
  async getProjectStatusReport(constituencyId?: string): Promise<ProjectStatusReport> {
    let query = this.supabase
      .from('projects')
      .select(`
        id, name, project_number, status, project_type, approved_amount, progress_percentage, created_at,
        constituencies:constituency_id (name)
      `)
      .order('created_at', { ascending: false });

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId);
    }

    const { data: projects } = await query;
    const projectsList = projects || [];

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const project of projectsList) {
      byStatus[project.status] = (byStatus[project.status] || 0) + 1;
      byType[project.project_type || 'other'] = (byType[project.project_type || 'other'] || 0) + 1;
    }

    return {
      total_projects: projectsList.length,
      by_status: byStatus,
      by_type: byType,
      average_completion_time: 0, // Would need more data to calculate
      projects: projectsList.slice(0, 100).map(p => {
        const constData = p.constituencies as unknown as { name: string } | null;
        return {
          id: p.id,
          name: p.name,
          project_number: p.project_number,
          status: p.status,
          constituency: constData?.name || 'Unknown',
          approved_amount: p.approved_amount || 0,
          progress: p.progress_percentage || 0,
          created_at: p.created_at,
        };
      }),
    };
  }

  /**
   * Generate payment analytics report
   */
  async getPaymentAnalyticsReport(
    startDate?: string,
    endDate?: string,
    constituencyId?: string,
  ): Promise<PaymentAnalyticsReport> {
    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const end = endDate || new Date().toISOString();

    let query = this.supabase
      .from('payments')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    if (constituencyId) {
      query = query.eq('constituency_id', constituencyId);
    }

    const { data: payments } = await query;
    const paymentsList = payments || [];

    const totalAmount = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
    const byStatus: Record<string, { count: number; amount: number }> = {};

    let panelAApprovals = 0;
    let panelBApprovals = 0;

    for (const payment of paymentsList) {
      if (!byStatus[payment.status]) {
        byStatus[payment.status] = { count: 0, amount: 0 };
      }
      byStatus[payment.status].count++;
      byStatus[payment.status].amount += payment.amount || 0;

      if (payment.panel_a_approved_at) panelAApprovals++;
      if (payment.panel_b_approved_at) panelBApprovals++;
    }

    const approvedCount = paymentsList.filter(
      p => p.status === 'approved' || p.status === 'disbursed',
    ).length;
    const approvalRate = paymentsList.length > 0 ? (approvedCount / paymentsList.length) * 100 : 0;

    // Get top recipients
    const recipientMap: Record<string, { total: number; count: number }> = {};
    for (const payment of paymentsList) {
      const name = payment.recipient_name || 'Unknown';
      if (!recipientMap[name]) {
        recipientMap[name] = { total: 0, count: 0 };
      }
      recipientMap[name].total += payment.amount || 0;
      recipientMap[name].count++;
    }

    const topRecipients = Object.entries(recipientMap)
      .map(([name, data]) => ({
        name,
        total_amount: data.total,
        payment_count: data.count,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    return {
      period: { start, end },
      summary: {
        total_payments: paymentsList.length,
        total_amount: totalAmount,
        average_amount: paymentsList.length > 0 ? totalAmount / paymentsList.length : 0,
        approval_rate: approvalRate,
      },
      by_status: byStatus,
      panel_analytics: {
        panel_a_approvals: panelAApprovals,
        panel_b_approvals: panelBApprovals,
        average_approval_time_hours: 0, // Would need timestamps to calculate
      },
      top_recipients: topRecipients,
    };
  }

  /**
   * Generate compliance dashboard report
   */
  async getComplianceReport(constituencyId?: string): Promise<ComplianceReport> {
    // Get audit logs
    let auditQuery = this.supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: audits } = await auditQuery;
    const auditsList = audits || [];

    // Get documents for compliance check
    let docQuery = this.supabase.from('documents').select('id, is_immutable, document_type');

    if (constituencyId) {
      docQuery = docQuery.eq('constituency_id', constituencyId);
    }

    const { data: documents } = await docQuery;
    const documentsList = documents || [];

    const immutableDocs = documentsList.filter(d => d.is_immutable).length;

    return {
      audit_summary: {
        total_audits: auditsList.length,
        issues_found: 0, // Would need a dedicated issues table
        issues_resolved: 0,
      },
      compliance_score: 85, // Placeholder - would calculate based on actual compliance metrics
      issues: [], // Would come from a dedicated issues table
      document_compliance: {
        total_required: documentsList.length,
        submitted: documentsList.length,
        verified: immutableDocs,
        missing: 0,
      },
    };
  }

  /**
   * Generate report based on type
   */
  async generateReport(dto: GenerateReportDto, userId: string): Promise<unknown> {
    switch (dto.report_type) {
      case ReportType.CONSTITUENCY_SUMMARY:
        if (!dto.constituency_id) {
          throw new BadRequestException('constituency_id is required for constituency reports');
        }
        return this.getConstituencyReport(dto.constituency_id);

      case ReportType.FINANCIAL_SUMMARY:
        return this.getFinancialReport(dto.start_date, dto.end_date);

      case ReportType.PROJECT_STATUS:
        return this.getProjectStatusReport(dto.constituency_id);

      case ReportType.PAYMENT_ANALYTICS:
        return this.getPaymentAnalyticsReport(dto.start_date, dto.end_date, dto.constituency_id);

      case ReportType.COMPLIANCE_DASHBOARD:
        return this.getComplianceReport(dto.constituency_id);

      case ReportType.BUDGET_UTILIZATION:
        return this.getFinancialReport(dto.start_date, dto.end_date);

      default:
        throw new BadRequestException('Invalid report type');
    }
  }
}
