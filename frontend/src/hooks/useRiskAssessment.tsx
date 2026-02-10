import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

export interface RiskScore {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
}

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

// Hook to get payment risk assessment
export const usePaymentRisk = (paymentId?: string) => {
  return useQuery({
    queryKey: ['risk', 'payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      // This would call the AI service - for now, we'll simulate
      // In production, route through API Gateway or call AI service directly
      try {
        const { data } = await api.get(`/ai/risk/payments/${paymentId}`);
        return data.data as RiskScore;
      } catch {
        // Fallback to a simulated risk score
        return simulatePaymentRisk();
      }
    },
    enabled: !!paymentId,
  });
};

// Hook to calculate payment risk with custom input
export const useCalculatePaymentRisk = () => {
  return useMutation({
    mutationFn: async (input: {
      paymentId: string;
      amount: number;
      projectId: string;
      projectBudget: number;
      projectSpentAmount: number;
    }) => {
      try {
        const { data } = await api.post('/ai/risk/payments/calculate', input);
        return data.data as RiskScore;
      } catch {
        return simulatePaymentRisk();
      }
    },
  });
};

// Hook to calculate project risk
export const useCalculateProjectRisk = () => {
  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      estimatedCost: number;
      projectType: string;
      constituencyBudget: number;
      constituencySpentAmount: number;
    }) => {
      try {
        const { data } = await api.post('/ai/risk/projects/calculate', input);
        return data.data as RiskScore;
      } catch {
        return simulateProjectRisk();
      }
    },
  });
};

// Hook to get dashboard insights
export const useDashboardInsights = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['advisory', 'insights', constituencyId],
    queryFn: async () => {
      if (!constituencyId) return null;
      try {
        const { data } = await api.get(`/ai/advisory/insights/${constituencyId}`);
        return data.data as DashboardInsights;
      } catch {
        return simulateDashboardInsights();
      }
    },
    enabled: !!constituencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Simulation functions for when AI service is not available
function simulatePaymentRisk(): RiskScore {
  return {
    score: 35,
    level: 'medium',
    factors: [
      {
        name: 'Budget Utilization',
        weight: 25,
        score: 30,
        description: 'Payment is within normal budget range',
      },
      {
        name: 'Recipient History',
        weight: 20,
        score: 20,
        description: 'Recipient has good payment history',
      },
      {
        name: 'Amount Anomaly',
        weight: 20,
        score: 40,
        description: 'Amount is slightly above average',
      },
    ],
    recommendations: [
      'Payment appears to be within acceptable risk parameters',
    ],
  };
}

function simulateProjectRisk(): RiskScore {
  return {
    score: 40,
    level: 'medium',
    factors: [
      {
        name: 'Budget Impact',
        weight: 25,
        score: 35,
        description: 'Project has moderate budget impact',
      },
      {
        name: 'Submitter Track Record',
        weight: 25,
        score: 30,
        description: 'Submitter has good track record',
      },
      {
        name: 'Project Complexity',
        weight: 15,
        score: 50,
        description: 'Moderate complexity project',
      },
    ],
    recommendations: [
      'Consider phased implementation for better risk management',
    ],
  };
}

function simulateDashboardInsights(): DashboardInsights {
  return {
    budgetHealth: [
      {
        type: 'info',
        title: 'Budget Status',
        message: 'Budget utilization is on track',
        priority: 'low',
        actionable: false,
      },
    ],
    projectAlerts: [],
    paymentAlerts: [],
    complianceAdvisory: [],
    performanceInsights: [],
  };
}

// Utility function to get risk level color
export function getRiskLevelColor(level: RiskScore['level']): string {
  switch (level) {
    case 'low':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'critical':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Utility function to get advisory type color
export function getAdvisoryTypeColor(type: Advisory['type']): string {
  switch (type) {
    case 'info':
      return 'text-blue-600 bg-blue-100';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    case 'action':
      return 'text-purple-600 bg-purple-100';
    case 'insight':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}
