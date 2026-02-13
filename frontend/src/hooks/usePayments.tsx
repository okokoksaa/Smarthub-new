import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  payment_number: string;
  project_id: string;
  amount: number;
  description?: string;
  milestone?: string;
  status: 'draft' | 'submitted' | 'finance_review' | 'panel_a_pending' | 'panel_b_pending' | 'rejected' | 'executed';
  beneficiary_name: string;
  beneficiary_account?: string;
  beneficiary_bank?: string;
  invoice_number?: string;
  invoice_date?: string;
  document_id?: string;
  ai_risk_score?: number;
  ai_risk_level?: 'low' | 'medium' | 'high';
  ai_flags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  panel_a_approved_at?: string;
  panel_a_approved_by?: string;
  panel_b_approved_at?: string;
  panel_b_approved_by?: string;
  executed_at?: string;
  executed_by?: string;
  transaction_reference?: string;
  project?: {
    id: string;
    name: string;
    project_number: string;
    constituency?: {
      id: string;
      name: string;
    };
  };
  document?: {
    id: string;
    file_name: string;
    document_type: string;
  };
}

export interface PaymentSubmissionResult {
  success: boolean;
  payment_id: string | null;
  payment_number: string | null;
  risk_score: number | null;
  risk_level: string | null;
  error_message: string | null;
}

export interface CreatePaymentData {
  project_id: string;
  amount: number;
  payment_type: 'milestone' | 'advance' | 'retention' | 'final';
  recipient_name: string;
  recipient_account?: string;
  recipient_bank?: string;
  description?: string;
  milestone_id?: string;
}

export interface ApprovalData {
  decision: 'approved' | 'rejected';
  comments?: string;
}

export interface DisburseData {
  transaction_reference: string;
  disbursement_date?: string;
}

// Fetch payments for a specific project
export const useProjectPayments = (projectId?: string) => {
  return useQuery({
    queryKey: ['payments', 'project', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          project:projects(id, name, project_number),
          document:documents(id, file_name, document_type)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!projectId,
  });
};

// Fetch all payments via API Gateway (secure)
export const usePayments = (status?: string) => {
  return useQuery({
    queryKey: ['payments', status],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);

        const { data } = await api.get(`/payments?${params.toString()}`);
        return data?.data || data || [];
      } catch (error) {
        // Fallback to direct Supabase if API is not available
        console.warn('API Gateway unavailable, using Supabase directly');
        let query = supabase
          .from('payments')
          .select(`
            *,
            project:projects(id, name, project_number, constituency:constituencies(id, name))
          `)
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status as Payment['status']);
        }

        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
        return data as Payment[];
      }
    },
  });
};

// Fetch pending payments for approval
export const usePendingPayments = () => {
  return useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/payments?status=panel_a_pending,panel_b_pending');
        return data?.data || data || [];
      } catch (error) {
        // Fallback to direct Supabase
        const { data, error: dbError } = await supabase
          .from('payments')
          .select(`
            *,
            project:projects(id, name, project_number, budget, spent, constituency:constituencies(id, name))
          `)
          .in('status', ['submitted', 'panel_a_pending', 'panel_b_pending'])
          .order('ai_risk_score', { ascending: false });

        if (dbError) throw dbError;
        return data as Payment[];
      }
    },
  });
};

// Create a new payment request via API Gateway (SECURE)
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const { data: result } = await api.post('/payments', data);
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment request created', {
        description: `Payment #${result.payment_number || result.id}`,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create payment';
      toast.error('Failed to create payment', {
        description: message,
      });
    },
  });
};

// Panel A Approval via API Gateway (SECURE - MP, CDFC Chair, Finance Officer)
export const useApprovePanelA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, decision, comments }: { paymentId: string } & ApprovalData) => {
      const { data } = await api.post(`/payments/${paymentId}/panel-a/approve`, {
        decision,
        comments,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });
      toast.success('Panel A approval recorded', {
        description: variables.decision === 'approved'
          ? 'Payment forwarded to Panel B for final approval'
          : 'Payment has been rejected',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Approval failed';
      toast.error('Panel A approval failed', {
        description: message,
      });
    },
  });
};

// Panel B Approval via API Gateway (SECURE - PLGO, Ministry Official)
export const useApprovePanelB = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, decision, comments }: { paymentId: string } & ApprovalData) => {
      const { data } = await api.post(`/payments/${paymentId}/panel-b/approve`, {
        decision,
        comments,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });
      toast.success('Panel B approval recorded', {
        description: variables.decision === 'approved'
          ? 'Payment approved for disbursement'
          : 'Payment has been rejected',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Approval failed';
      toast.error('Panel B approval failed', {
        description: message,
      });
    },
  });
};

// Disburse payment via API Gateway (SECURE)
export const useDisbursePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, transactionRef, date }: {
      paymentId: string;
      transactionRef: string;
      date?: string
    }) => {
      const { data } = await api.post(`/payments/${paymentId}/disburse`, {
        transaction_reference: transactionRef,
        disbursement_date: date || new Date().toISOString().split('T')[0],
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', variables.paymentId] });
      toast.success('Payment disbursed successfully', {
        description: `Transaction ref: ${variables.transactionRef}`,
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Disbursement failed';
      toast.error('Disbursement failed', {
        description: message,
      });
    },
  });
};

// Get payment workflow status
export const usePaymentStatus = (paymentId?: string) => {
  return useQuery({
    queryKey: ['payments', paymentId, 'status'],
    queryFn: async () => {
      if (!paymentId) return null;
      const { data } = await api.get(`/payments/${paymentId}/status`);
      return data;
    },
    enabled: !!paymentId,
  });
};

// Legacy: Approve payment (deprecated - use useApprovePanelA/useApprovePanelB)
export const useApprovePayment = () => {
  const approvePanelA = useApprovePanelA();
  const approvePanelB = useApprovePanelB();

  return useMutation({
    mutationFn: async ({ paymentId, panel }: { paymentId: string; panel: 'a' | 'b' }) => {
      if (panel === 'a') {
        return approvePanelA.mutateAsync({ paymentId, decision: 'approved' });
      } else {
        return approvePanelB.mutateAsync({ paymentId, decision: 'approved' });
      }
    },
  });
};

// Reject payment via API Gateway
export const useRejectPayment = () => {
  const approvePanelA = useApprovePanelA();

  return useMutation({
    mutationFn: async ({ paymentId, comments }: { paymentId: string; comments?: string }) => {
      return approvePanelA.mutateAsync({ paymentId, decision: 'rejected', comments });
    },
  });
};

// Legacy submit payment (for backward compatibility)
export const useSubmitPayment = () => {
  const createPayment = useCreatePayment();

  return useMutation({
    mutationFn: async (data: {
      projectId: string;
      amount: number;
      documentId?: string;
      description?: string;
      milestone?: string;
      beneficiaryName?: string;
    }): Promise<PaymentSubmissionResult> => {
      try {
        const result = await createPayment.mutateAsync({
          project_id: data.projectId,
          amount: data.amount,
          payment_type: 'milestone',
          recipient_name: data.beneficiaryName || 'Unknown',
          description: data.description,
          milestone_id: data.milestone,
        });

        return {
          success: true,
          payment_id: result.id,
          payment_number: result.payment_number,
          risk_score: result.ai_risk_score || null,
          risk_level: result.ai_risk_level || null,
          error_message: null,
        };
      } catch (error: any) {
        return {
          success: false,
          payment_id: null,
          payment_number: null,
          risk_score: null,
          risk_level: null,
          error_message: error.response?.data?.message || error.message,
        };
      }
    },
  });
};
