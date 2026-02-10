import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Report types
export type ReportType =
  | 'constituency_summary'
  | 'financial_summary'
  | 'project_status'
  | 'payment_analytics'
  | 'compliance_dashboard'
  | 'budget_utilization';

export type ReportFormat = 'json' | 'pdf' | 'excel';

export interface GenerateReportParams {
  report_type: ReportType;
  constituency_id?: string;
  start_date?: string;
  end_date?: string;
  format?: ReportFormat;
  include_sections?: string[];
}

// Constituency Report
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

// Financial Report
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

// Project Status Report
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

// Payment Analytics Report
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

// Compliance Report
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

// Hook to get constituency report
export const useConstituencyReport = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['reports', 'constituency', constituencyId],
    queryFn: async () => {
      if (!constituencyId) return null;
      const { data } = await api.get(`/reports/constituency/${constituencyId}`);
      return data.data as ConstituencyReport;
    },
    enabled: !!constituencyId,
  });
};

// Hook to get financial report
export const useFinancialReport = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['reports', 'financial', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const { data } = await api.get(`/reports/financial?${params.toString()}`);
      return data.data as FinancialReport;
    },
  });
};

// Hook to get project status report
export const useProjectStatusReport = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['reports', 'projects', constituencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append('constituency_id', constituencyId);

      const { data } = await api.get(`/reports/projects?${params.toString()}`);
      return data.data as ProjectStatusReport;
    },
  });
};

// Hook to get payment analytics report
export const usePaymentAnalyticsReport = (
  startDate?: string,
  endDate?: string,
  constituencyId?: string
) => {
  return useQuery({
    queryKey: ['reports', 'payments', startDate, endDate, constituencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (constituencyId) params.append('constituency_id', constituencyId);

      const { data } = await api.get(`/reports/payments?${params.toString()}`);
      return data.data as PaymentAnalyticsReport;
    },
  });
};

// Hook to get compliance report
export const useComplianceReport = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['reports', 'compliance', constituencyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append('constituency_id', constituencyId);

      const { data } = await api.get(`/reports/compliance?${params.toString()}`);
      return data.data as ComplianceReport;
    },
  });
};

// Hook to generate custom report
export const useGenerateReport = () => {
  return useMutation({
    mutationFn: async (params: GenerateReportParams) => {
      const { data } = await api.post('/reports/generate', params);
      return data.data;
    },
  });
};
