import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  contractor_id: string;
  contractor_name: string;
  project_id: string;
  project_name: string;
  constituency_id: string;
  contract_type: 'construction' | 'supply' | 'service' | 'consultancy';
  contract_value: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'disputed';
  signed_date?: string;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface LegalCase {
  id: string;
  case_number: string;
  title: string;
  case_type: 'contract_dispute' | 'land_issue' | 'compliance_review' | 'fraud_investigation' | 'other';
  related_entity_type?: string;
  related_entity_id?: string;
  constituency_id?: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution?: string;
  filed_date: string;
  resolved_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceItem {
  id: string;
  regulation: string;
  description: string;
  constituency_id?: string;
  due_date: string;
  status: 'compliant' | 'pending' | 'non_compliant' | 'waived';
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface LegalOpinion {
  id: string;
  reference_number: string;
  title: string;
  subject: string;
  opinion_type: 'advisory' | 'binding' | 'clarification';
  related_regulation?: string;
  opinion_text: string;
  issued_by: string;
  issued_date: string;
  file_url?: string;
  created_at: string;
}

export interface LegalDashboardSummary {
  compliance_rate: number;
  pending_items: number;
  active_cases: number;
  non_compliant: number;
  contracts_expiring_soon: number;
}

// Get legal dashboard summary
export function useLegalDashboard() {
  return useQuery({
    queryKey: ['legal-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/legal/dashboard');
      return data.data as LegalDashboardSummary;
    },
  });
}

// ========== CONTRACTS ==========

export function useContracts(
  constituencyId?: string,
  status?: string,
  contractType?: string,
) {
  return useQuery({
    queryKey: ['contracts', constituencyId, status, contractType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append('constituency_id', constituencyId);
      if (status) params.append('status', status);
      if (contractType) params.append('contract_type', contractType);

      const { data } = await api.get(`/legal/contracts?${params.toString()}`);
      return data.data as Contract[];
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data } = await api.get(`/legal/contracts/${id}`);
      return data.data as Contract;
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contract: Partial<Contract>) => {
      const { data } = await api.post('/legal/contracts', contract);
      return data.data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create contract');
    },
  });
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/legal/contracts/${id}/status`, { status });
      return data.data as Contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contract status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update contract');
    },
  });
}

// ========== LEGAL CASES ==========

export function useLegalCases(
  status?: string,
  caseType?: string,
  priority?: string,
) {
  return useQuery({
    queryKey: ['legal-cases', status, caseType, priority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (caseType) params.append('case_type', caseType);
      if (priority) params.append('priority', priority);

      const { data } = await api.get(`/legal/cases?${params.toString()}`);
      return data.data as LegalCase[];
    },
  });
}

export function useLegalCase(id: string) {
  return useQuery({
    queryKey: ['legal-case', id],
    queryFn: async () => {
      const { data } = await api.get(`/legal/cases/${id}`);
      return data.data as LegalCase;
    },
    enabled: !!id,
  });
}

export function useCreateLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (legalCase: Partial<LegalCase>) => {
      const { data } = await api.post('/legal/cases', legalCase);
      return data.data as LegalCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      queryClient.invalidateQueries({ queryKey: ['legal-dashboard'] });
      toast.success('Legal case created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create legal case');
    },
  });
}

export function useUpdateLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LegalCase> }) => {
      const { data } = await api.patch(`/legal/cases/${id}`, updates);
      return data.data as LegalCase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cases'] });
      queryClient.invalidateQueries({ queryKey: ['legal-dashboard'] });
      toast.success('Legal case updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update legal case');
    },
  });
}

// ========== COMPLIANCE ==========

export function useComplianceItems(constituencyId?: string, status?: string) {
  return useQuery({
    queryKey: ['compliance-items', constituencyId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (constituencyId) params.append('constituency_id', constituencyId);
      if (status) params.append('status', status);

      const { data } = await api.get(`/legal/compliance?${params.toString()}`);
      return data.data as ComplianceItem[];
    },
  });
}

export function useUpdateComplianceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => {
      const { data } = await api.patch(`/legal/compliance/${id}`, { status, notes });
      return data.data as ComplianceItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-items'] });
      queryClient.invalidateQueries({ queryKey: ['legal-dashboard'] });
      toast.success('Compliance status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update compliance');
    },
  });
}

// ========== LEGAL OPINIONS ==========

export function useLegalOpinions(opinionType?: string, search?: string) {
  return useQuery({
    queryKey: ['legal-opinions', opinionType, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (opinionType) params.append('opinion_type', opinionType);
      if (search) params.append('search', search);

      const { data } = await api.get(`/legal/opinions?${params.toString()}`);
      return data.data as LegalOpinion[];
    },
  });
}

export function useCreateLegalOpinion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opinion: Partial<LegalOpinion>) => {
      const { data } = await api.post('/legal/opinions', opinion);
      return data.data as LegalOpinion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-opinions'] });
      toast.success('Legal opinion created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create legal opinion');
    },
  });
}
