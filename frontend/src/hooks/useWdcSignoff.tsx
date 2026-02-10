import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface WdcSignoff {
  id: string;
  project_id: string;
  ward_id: string | null;
  meeting_id: string | null;
  meeting_date: string;
  meeting_minutes_url: string | null;
  chair_name: string;
  chair_nrc: string | null;
  chair_signed: boolean;
  chair_signed_at: string | null;
  chair_signature: string | null;
  attendees_count: number;
  quorum_met: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Residency verification fields
  residency_verified: boolean;
  residency_verified_by: string | null;
  residency_verification_method: string | null;
  residents_count: number | null;
  non_residents_count: number | null;
  residency_threshold_met: boolean;
  residency_notes: string | null;
}

export interface CreateWdcSignoffData {
  project_id: string;
  ward_id?: string;
  meeting_id?: string;
  meeting_date: string;
  meeting_minutes_url?: string;
  chair_name: string;
  chair_nrc?: string;
  chair_signed: boolean;
  attendees_count: number;
  quorum_met: boolean;
  notes?: string;
  // Residency verification
  residency_verified?: boolean;
  residency_verified_by?: string;
  residency_verification_method?: string;
  residents_count?: number;
  non_residents_count?: number;
  residency_threshold_met?: boolean;
  residency_notes?: string;
}

export function useWdcSignoff(projectId?: string) {
  const queryClient = useQueryClient();

  // Fetch WDC sign-off for a specific project
  const { data: signoff, isLoading, error } = useQuery({
    queryKey: ['wdc-signoff', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const { data } = await api.get<WdcSignoff>(`/wdc/signoffs/project/${projectId}`);
        return data as WdcSignoff;
      } catch (err: any) {
        // Treat 404 as no signoff yet
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!projectId,
  });

  // Check if a project has valid WDC sign-off (chair signed + quorum met + residency verified)
  const hasValidSignoff = signoff?.chair_signed && signoff?.quorum_met && signoff?.residency_threshold_met;

  // Create WDC sign-off
  const createMutation = useMutation({
    mutationFn: async (data: CreateWdcSignoffData) => {
      const payload = {
        ...data,
      };
      const { data: result } = await api.post<WdcSignoff>('/wdc/signoffs', payload);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wdc-signoff'] });
      toast.success('WDC sign-off recorded successfully');
    },
    onError: (error) => {
      console.error('Error creating WDC sign-off:', error);
      toast.error('Failed to record WDC sign-off');
    },
  });

  // Update WDC sign-off (e.g., chair signing)
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WdcSignoff> & { id: string }) => {
      const { data: result } = await api.patch<WdcSignoff>(`/wdc/signoffs/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wdc-signoff'] });
      toast.success('WDC sign-off updated successfully');
    },
    onError: (error) => {
      console.error('Error updating WDC sign-off:', error);
      toast.error('Failed to update WDC sign-off');
    },
  });

  return {
    signoff,
    isLoading,
    error,
    hasValidSignoff,
    createSignoff: createMutation.mutate,
    updateSignoff: updateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

// Hook to check WDC sign-off requirement for submission
export function useCanSubmitProject(projectId?: string) {
  const { signoff, isLoading } = useWdcSignoff(projectId);
  
  const canSubmit = signoff?.chair_signed && signoff?.quorum_met && signoff?.residency_threshold_met;
  
  const blockedReasons: string[] = [];
  
  if (!signoff) {
    blockedReasons.push('No WDC meeting minutes recorded');
  } else {
    if (!signoff.chair_signed) {
      blockedReasons.push('WDC Chair signature required');
    }
    if (!signoff.quorum_met) {
      blockedReasons.push('WDC meeting quorum not met');
    }
    if (!signoff.residency_threshold_met) {
      blockedReasons.push('Ward residency threshold not met');
    }
  }
  
  return {
    canSubmit,
    blockedReasons,
    signoff,
    isLoading,
  };
}
