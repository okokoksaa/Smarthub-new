import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Procurement = Tables<'procurements'>;

export interface CreateProcurementDto {
  constituency_id: string;
  project_id?: string;
  title: string;
  description?: string;
  procurement_method: 'open_bidding' | 'restricted_bidding' | 'direct_procurement' | 'request_for_quotation';
  estimated_value: number;
  closing_date: string;
  bid_opening_date: string;
  evaluation_criteria?: any;
  required_documents?: string[];
}

export interface SubmitBidDto {
  contractor_id: string;
  bid_amount: number;
  technical_proposal: any;
  financial_proposal: any;
  required_documents: any;
  validity_period_days?: number;
}

export interface EvaluateBidDto {
  bid_id: string;
  technical_score: number;
  financial_score: number;
  experience_score?: number;
  compliance_score?: number;
  recommendation: 'award' | 'reject' | 'clarification_needed';
  recommendation_reason?: string;
}

export interface AwardContractDto {
  winning_bid_id: string;
  contract_value: number;
  award_date?: string;
  award_reason?: string;
}

export function useProcurements(filters?: {
  status?: string;
  constituencyId?: string;
  procurementMethod?: string;
}) {
  return useQuery({
    queryKey: ['procurements', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurements')
        .select(`
          *,
          contractors:awarded_contractor_id (company_name),
          constituency:constituency_id (name, code),
          project:project_id (name, project_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useProcurement(id: string) {
  return useQuery({
    queryKey: ['procurement', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurements')
        .select(`
          *,
          contractors:awarded_contractor_id (id, company_name, registration_number),
          constituency:constituency_id (id, name, code),
          project:project_id (id, name, project_number, status, budget)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useProcurementBids(procurementId: string) {
  return useQuery({
    queryKey: ['procurement-bids', procurementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procurement_bids')
        .select(`
          *,
          contractor:contractor_id (id, company_name, registration_number)
        `)
        .eq('procurement_id', procurementId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!procurementId,
  });
}

export function useProcurementEvaluations(procurementId: string) {
  return useQuery({
    queryKey: ['procurement-evaluations', procurementId],
    queryFn: async () => {
      const response = await api.get(`/procurements/${procurementId}/evaluations`);
      return response.data;
    },
    enabled: !!procurementId,
  });
}

export function useProcurementAuditTrail(procurementId: string) {
  return useQuery({
    queryKey: ['procurement-audit', procurementId],
    queryFn: async () => {
      const response = await api.get(`/procurements/${procurementId}/audit-trail`);
      return response.data;
    },
    enabled: !!procurementId,
  });
}

export function useProcurementStatus(procurementId: string) {
  return useQuery({
    queryKey: ['procurement-status', procurementId],
    queryFn: async () => {
      const response = await api.get(`/procurements/${procurementId}/status`);
      return response.data;
    },
    enabled: !!procurementId,
  });
}

export function useCreateProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateProcurementDto) => {
      const response = await api.post('/procurements', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] });
      toast.success('Procurement created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create procurement');
    },
  });
}

export function useUpdateProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProcurementDto> }) => {
      const response = await api.patch(`/procurements/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] });
      queryClient.invalidateQueries({ queryKey: ['procurement', variables.id] });
      toast.success('Procurement updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update procurement');
    },
  });
}

export function usePublishProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/procurements/${id}/publish`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] });
      queryClient.invalidateQueries({ queryKey: ['procurement', id] });
      toast.success('Tender published successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish tender');
    },
  });
}

export function useSubmitBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ procurementId, data }: { procurementId: string; data: SubmitBidDto }) => {
      const response = await api.post(`/procurements/${procurementId}/bids`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procurement-bids', variables.procurementId] });
      toast.success('Bid submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit bid');
    },
  });
}

export function useOpenBids() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (procurementId: string) => {
      const response = await api.post(`/procurements/${procurementId}/open-bids`);
      return response.data;
    },
    onSuccess: (_, procurementId) => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] });
      queryClient.invalidateQueries({ queryKey: ['procurement', procurementId] });
      queryClient.invalidateQueries({ queryKey: ['procurement-bids', procurementId] });
      toast.success('Bids opened successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to open bids');
    },
  });
}

export function useEvaluateBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ procurementId, data }: { procurementId: string; data: EvaluateBidDto }) => {
      const response = await api.post(`/procurements/${procurementId}/evaluate`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procurement-evaluations', variables.procurementId] });
      queryClient.invalidateQueries({ queryKey: ['procurement-status', variables.procurementId] });
      toast.success('Evaluation submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit evaluation');
    },
  });
}

export function useAwardContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ procurementId, data }: { procurementId: string; data: AwardContractDto }) => {
      const response = await api.post(`/procurements/${procurementId}/award`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procurements'] });
      queryClient.invalidateQueries({ queryKey: ['procurement', variables.procurementId] });
      toast.success('Contract awarded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to award contract');
    },
  });
}
