import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type EmpowermentGrant = Tables<'empowerment_grants'>;

export type GrantType =
  | 'individual'
  | 'group'
  | 'cooperative'
  | 'women_group'
  | 'youth_group'
  | 'disability_group';

export interface CreateEmpowermentDto {
  constituency_id: string;
  ward_id?: string;
  applicant_name: string;
  applicant_nrc?: string;
  applicant_phone?: string;
  applicant_address?: string;
  group_name?: string;
  group_size?: number;
  grant_type: GrantType;
  purpose: string;
  requested_amount: number;
  training_completed?: string;
  business_plan_document_id?: string;
}

export interface ApproveEmpowermentDto {
  decision: 'approve' | 'reject';
  approved_amount?: number;
  comments?: string;
  rejection_reason?: string;
  training_requirement?: string;
}

export interface DisburseEmpowermentDto {
  payment_reference: string;
  payment_method: 'bank_transfer' | 'mobile_money' | 'cheque';
  bank_account?: string;
  mobile_number?: string;
  payment_notes?: string;
}

export function useEmpowermentGrants(filters?: {
  status?: string;
  constituencyId?: string;
  grantType?: GrantType;
}) {
  return useQuery({
    queryKey: ['empowerment-grants', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.constituencyId) params.append('constituency_id', filters.constituencyId);
      if (filters?.grantType) params.append('grant_type', filters.grantType);

      const response = await api.get(`/empowerment?${params.toString()}`);
      return response.data;
    },
  });
}

export function useEmpowermentGrant(id: string) {
  return useQuery({
    queryKey: ['empowerment-grant', id],
    queryFn: async () => {
      const response = await api.get(`/empowerment/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useEmpowermentGrantStatus(id: string) {
  return useQuery({
    queryKey: ['empowerment-status', id],
    queryFn: async () => {
      const response = await api.get(`/empowerment/${id}/status`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useEmpowermentAnalytics(constituencyId: string) {
  return useQuery({
    queryKey: ['empowerment-analytics', constituencyId],
    queryFn: async () => {
      const response = await api.get(`/empowerment/analytics/${constituencyId}`);
      return response.data;
    },
    enabled: !!constituencyId,
  });
}

export function useCreateEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateEmpowermentDto) => {
      const response = await api.post('/empowerment', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      toast.success('Empowerment grant application submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    },
  });
}

export function useUpdateEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateEmpowermentDto> }) => {
      const response = await api.patch(`/empowerment/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      toast.success('Grant application updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update application');
    },
  });
}

export function useShortlistEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => {
      const response = await api.post(`/empowerment/${id}/shortlist`, { comments });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-status', variables.id] });
      toast.success('Grant application shortlisted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to shortlist application');
    },
  });
}

export function useApproveEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ApproveEmpowermentDto }) => {
      const response = await api.post(`/empowerment/${id}/approve`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-status', variables.id] });
      toast.success(
        variables.data.decision === 'approve'
          ? 'Grant approved successfully'
          : 'Grant rejected'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process approval');
    },
  });
}

export function useRejectEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/empowerment/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      toast.success('Grant application rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    },
  });
}

export function useDisburseEmpowermentGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DisburseEmpowermentDto }) => {
      const response = await api.post(`/empowerment/${id}/disburse`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-status', variables.id] });
      toast.success('Grant disbursed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disburse grant');
    },
  });
}

export function useSubmitCompletionReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, report }: { id: string; report: string }) => {
      const response = await api.post(`/empowerment/${id}/completion-report`, { report });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['empowerment-grants'] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-grant', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['empowerment-status', variables.id] });
      toast.success('Completion report submitted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit completion report');
    },
  });
}

export function useCheckEmpowermentEligibility() {
  return useMutation({
    mutationFn: async (data: CreateEmpowermentDto) => {
      const response = await api.post('/empowerment/check-eligibility', data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check eligibility');
    },
  });
}
