import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface CAPRCycle {
  id: string;
  constituency_id: string;
  constituency_name: string;
  province_name: string;
  fiscal_year: string;
  first_sitting_date: string;
  due_date: string;
  days_remaining: number;
  status: 'on_track' | 'due_soon' | 'overdue' | 'completed';
  artifacts: {
    name: string;
    submitted: boolean;
    submitted_at?: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface MinisterialItem {
  id: string;
  province: string;
  title: string;
  type: 'project_list' | 'special_approval' | 'policy_matter' | 'budget_amendment';
  submitted_date: string;
  due_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  priority: 'normal' | 'high' | 'urgent';
  constituency_id?: string;
  submitted_by: string;
}

export interface GazettePublication {
  id: string;
  title: string;
  province: string;
  fiscal_year: string;
  published_date?: string;
  url?: string;
  status: 'draft' | 'pending' | 'published';
  approved_projects_count: number;
}

export interface MinistryDashboardSummary {
  pending_approvals: number;
  urgent_items: number;
  capr_overdue: number;
  provinces_published: number;
  total_provinces: number;
  total_budget_allocated: number;
  total_disbursed: number;
}

// Get ministry dashboard summary
export function useMinistryDashboard() {
  return useQuery({
    queryKey: ['ministry-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/ministry/dashboard');
      return data.data as MinistryDashboardSummary;
    },
  });
}

// Get CAPR cycles
export function useCAPRCycles(
  provinceId?: string,
  fiscalYear?: string,
  status?: string,
) {
  return useQuery({
    queryKey: ['capr-cycles', provinceId, fiscalYear, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (provinceId) params.append('province_id', provinceId);
      if (fiscalYear) params.append('fiscal_year', fiscalYear);
      if (status) params.append('status', status);

      const { data } = await api.get(`/ministry/capr?${params.toString()}`);
      return data.data as CAPRCycle[];
    },
  });
}

// Get CAPR cycle for a specific constituency
export function useCAPRCycle(constituencyId: string, fiscalYear?: string) {
  return useQuery({
    queryKey: ['capr-cycle', constituencyId, fiscalYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fiscalYear) params.append('fiscal_year', fiscalYear);

      const { data } = await api.get(`/ministry/capr/${constituencyId}?${params.toString()}`);
      return data.data as CAPRCycle;
    },
    enabled: !!constituencyId,
  });
}

// Get ministerial inbox
export function useMinisterialInbox(
  status?: string,
  priority?: string,
  type?: string,
) {
  return useQuery({
    queryKey: ['ministerial-inbox', status, priority, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (type) params.append('type', type);

      const { data } = await api.get(`/ministry/inbox?${params.toString()}`);
      return data.data as MinisterialItem[];
    },
  });
}

// Approve ministerial item
export function useApproveMinisterialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, comments }: { itemId: string; comments?: string }) => {
      const { data } = await api.post(`/ministry/inbox/${itemId}/approve`, { comments });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerial-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['ministry-dashboard'] });
      toast.success('Item approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve item');
    },
  });
}

// Reject ministerial item
export function useRejectMinisterialItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, reason }: { itemId: string; reason: string }) => {
      const { data } = await api.post(`/ministry/inbox/${itemId}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministerial-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['ministry-dashboard'] });
      toast.success('Item rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject item');
    },
  });
}

// Get gazette publications
export function useGazettePublications(provinceId?: string, fiscalYear?: string) {
  return useQuery({
    queryKey: ['gazette-publications', provinceId, fiscalYear],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (provinceId) params.append('province_id', provinceId);
      if (fiscalYear) params.append('fiscal_year', fiscalYear);

      const { data } = await api.get(`/ministry/gazette?${params.toString()}`);
      return data.data as GazettePublication[];
    },
  });
}

// Publish gazette
export function usePublishGazette() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ provinceId, fileUrl }: { provinceId: string; fileUrl: string }) => {
      const { data } = await api.post(`/ministry/gazette/${provinceId}/publish`, {
        file_url: fileUrl,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gazette-publications'] });
      queryClient.invalidateQueries({ queryKey: ['ministry-dashboard'] });
      toast.success('Gazette published successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to publish gazette');
    },
  });
}
