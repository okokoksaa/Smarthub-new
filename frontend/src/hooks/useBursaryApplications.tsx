import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type BursaryApplication = Tables<'bursary_applications'>;

export interface CreateBursaryApplicationDto {
  constituency_id: string;
  ward_id: string;
  applicant_name: string;
  national_id: string;
  date_of_birth: string;
  gender: 'male' | 'female';
  phone_number?: string;
  email?: string;
  physical_address: string;
  residency_duration_months: number;
  institution_name: string;
  institution_type: 'secondary' | 'tertiary' | 'skills_training';
  program_of_study: string;
  year_of_study: number;
  expected_completion_date?: string;
  annual_fees: number;
  amount_requested: number;
  guardian_name?: string;
  guardian_phone?: string;
  household_income?: number;
  number_of_dependents?: number;
  is_orphan?: boolean;
  has_disability?: boolean;
  disability_details?: string;
  previous_cdf_support?: boolean;
  supporting_documents?: any;
}

export interface ApproveApplicationDto {
  approved_amount: number;
  terms_count: number;
  approval_notes?: string;
}

export interface VerifyEnrollmentDto {
  enrollment_verified: boolean;
  verification_document?: string;
  verification_notes?: string;
}

export interface DisburseTermDto {
  payment_reference: string;
  payment_method: 'bank_transfer' | 'mobile_money' | 'cheque';
  payment_notes?: string;
}

export function useBursaryApplications(filters?: {
  status?: string;
  constituencyId?: string;
  institutionType?: string;
}) {
  return useQuery({
    queryKey: ['bursary-applications', filters],
    queryFn: async () => {
      let query = supabase
        .from('bursary_applications')
        .select(`
          *,
          wards:ward_id (name),
          constituencies:constituency_id (name)
        `)
        .order('submitted_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.constituencyId) {
        query = query.eq('constituency_id', filters.constituencyId);
      }
      if (filters?.institutionType) {
        query = query.eq('institution_type', filters.institutionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBursaryApplication(id: string) {
  return useQuery({
    queryKey: ['bursary-application', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bursary_applications')
        .select(`
          *,
          wards:ward_id (id, name),
          constituencies:constituency_id (id, name, code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useBursaryTerms(applicationId: string) {
  return useQuery({
    queryKey: ['bursary-terms', applicationId],
    queryFn: async () => {
      const response = await api.get(`/bursaries/${applicationId}/terms`);
      return response.data;
    },
    enabled: !!applicationId,
  });
}

export function useBursarySlaStatus(applicationId: string) {
  return useQuery({
    queryKey: ['bursary-sla', applicationId],
    queryFn: async () => {
      const response = await api.get(`/bursaries/${applicationId}/sla-status`);
      return response.data;
    },
    enabled: !!applicationId,
  });
}

export function useCreateBursaryApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateBursaryApplicationDto) => {
      const response = await api.post('/bursaries', dto);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bursary-applications'] });
      toast.success('Application submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    },
  });
}

export function useShortlistApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.post(`/bursaries/${id}/shortlist`, { notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bursary-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bursary-application', variables.id] });
      toast.success('Application shortlisted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to shortlist application');
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/bursaries/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bursary-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bursary-application', variables.id] });
      toast.success('Application rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    },
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ApproveApplicationDto }) => {
      const response = await api.post(`/bursaries/${id}/approve`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bursary-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bursary-application', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bursary-terms', variables.id] });
      toast.success('Application approved - Terms created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    },
  });
}

export function useVerifyEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      termId,
      data
    }: {
      applicationId: string;
      termId: string;
      data: VerifyEnrollmentDto;
    }) => {
      const response = await api.post(
        `/bursaries/${applicationId}/terms/${termId}/verify-enrollment`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bursary-terms', variables.applicationId] });
      toast.success('Enrollment verified');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to verify enrollment');
    },
  });
}

export function useDisburseTermPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      termId,
      data
    }: {
      applicationId: string;
      termId: string;
      data: DisburseTermDto;
    }) => {
      const response = await api.post(
        `/bursaries/${applicationId}/terms/${termId}/disburse`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bursary-applications'] });
      queryClient.invalidateQueries({ queryKey: ['bursary-application', variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ['bursary-terms', variables.applicationId] });
      toast.success('Payment disbursed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disburse payment');
    },
  });
}

export function useCheckEligibility() {
  return useMutation({
    mutationFn: async (data: {
      constituency_id: string;
      residency_duration_months: number;
      institution_type: string;
      date_of_birth: string;
    }) => {
      const response = await api.post('/bursaries/check-eligibility', data);
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to check eligibility');
    },
  });
}
