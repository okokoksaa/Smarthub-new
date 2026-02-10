import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConstituencyAnalytics {
  constituency_id: string;
  constituency_name: string;
  constituency_code: string;
  district_name: string | null;
  province_name: string | null;
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_budget_allocated: number;
  total_funds_disbursed: number;
  absorption_rate: number;
  risk_index: number;
  critical_alerts: number;
  pending_payments: number;
  last_updated: string;
}

export interface NationalMetrics {
  totalConstituencies: number;
  totalBudget: number;
  totalDisbursed: number;
  nationalAbsorptionRate: number;
  totalProjects: number;
  activeProjects: number;
  averageRiskIndex: number;
  totalCriticalAlerts: number;
  threatLevel: 'low' | 'medium' | 'high';
}

export function useConstituencyAnalytics() {
  return useQuery({
    queryKey: ['constituency-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_constituency_performance')
        .select('*');

      if (error) throw error;
      return data as ConstituencyAnalytics[];
    },
  });
}

export function useNationalMetrics() {
  const { data: analytics, isLoading, error } = useConstituencyAnalytics();

  const metrics: NationalMetrics | null = analytics ? calculateNationalMetrics(analytics) : null;

  return { data: metrics, isLoading, error };
}

function calculateNationalMetrics(analytics: ConstituencyAnalytics[]): NationalMetrics {
  const totalConstituencies = analytics.length;
  const totalBudget = analytics.reduce((sum, c) => sum + Number(c.total_budget_allocated), 0);
  const totalDisbursed = analytics.reduce((sum, c) => sum + Number(c.total_funds_disbursed), 0);
  const nationalAbsorptionRate = totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0;
  const totalProjects = analytics.reduce((sum, c) => sum + c.total_projects, 0);
  const activeProjects = analytics.reduce((sum, c) => sum + c.active_projects, 0);
  
  const constituenciesWithRisk = analytics.filter(c => c.risk_index > 0);
  const averageRiskIndex = constituenciesWithRisk.length > 0
    ? constituenciesWithRisk.reduce((sum, c) => sum + c.risk_index, 0) / constituenciesWithRisk.length
    : 0;
  
  const totalCriticalAlerts = analytics.reduce((sum, c) => sum + c.critical_alerts, 0);

  // Determine threat level based on average risk index
  let threatLevel: 'low' | 'medium' | 'high' = 'low';
  if (averageRiskIndex > 50) {
    threatLevel = 'high';
  } else if (averageRiskIndex > 20) {
    threatLevel = 'medium';
  }

  return {
    totalConstituencies,
    totalBudget,
    totalDisbursed,
    nationalAbsorptionRate,
    totalProjects,
    activeProjects,
    averageRiskIndex,
    totalCriticalAlerts,
    threatLevel,
  };
}

export function useTopRiskyConstituencies(limit: number = 5) {
  const { data: analytics, isLoading, error } = useConstituencyAnalytics();

  const topRisky = analytics
    ? [...analytics]
        .filter(c => c.risk_index > 0 || c.critical_alerts > 0)
        .sort((a, b) => {
          // Sort by critical alerts first, then by risk index
          if (b.critical_alerts !== a.critical_alerts) {
            return b.critical_alerts - a.critical_alerts;
          }
          return b.risk_index - a.risk_index;
        })
        .slice(0, limit)
    : [];

  return { data: topRisky, isLoading, error };
}
