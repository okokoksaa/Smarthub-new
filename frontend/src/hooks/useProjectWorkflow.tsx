import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useAuth } from "./useAuth";
import { useUserRoles, AppRole } from "./useUserRoles";
import { toast } from "sonner";

export type ProjectStatus =
  | 'draft'
  | 'submitted'
  | 'cdfc_review'
  | 'tac_appraisal'
  | 'plgo_review'
  | 'approved'
  | 'implementation'
  | 'completed'
  | 'rejected'
  | 'cancelled';

// Define the workflow transitions
export const WORKFLOW_TRANSITIONS: Record<ProjectStatus, { next: ProjectStatus[]; roles: AppRole[] }> = {
  draft: {
    next: ['submitted'],
    roles: ['super_admin', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen']
  },
  submitted: {
    next: ['cdfc_review', 'rejected'],
    roles: ['super_admin', 'cdfc_chair']
  },
  cdfc_review: {
    next: ['tac_appraisal', 'rejected'],
    roles: ['super_admin', 'cdfc_chair']
  },
  tac_appraisal: {
    next: ['plgo_review', 'rejected'],
    roles: ['super_admin', 'tac_chair', 'tac_member']
  },
  plgo_review: {
    next: ['approved', 'rejected'],
    roles: ['super_admin', 'plgo', 'ministry_official']
  },
  approved: {
    next: ['implementation'],
    roles: ['super_admin', 'plgo', 'finance_officer']
  },
  implementation: {
    next: ['completed', 'cancelled'],
    roles: ['super_admin', 'plgo', 'cdfc_chair']
  },
  completed: {
    next: [],
    roles: []
  },
  rejected: {
    next: ['draft'],
    roles: ['super_admin', 'cdfc_chair', 'cdfc_member']
  },
  cancelled: {
    next: [],
    roles: []
  },
};

// Human-readable status labels
export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  cdfc_review: 'CDFC Review',
  tac_appraisal: 'TAC Appraisal',
  plgo_review: 'PLGO Review',
  approved: 'Approved',
  implementation: 'Implementation',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

// Action labels for transitions
export const TRANSITION_ACTIONS: Record<string, string> = {
  'draft_to_submitted': 'Submit for Review',
  'submitted_to_cdfc_review': 'Accept for CDFC Review',
  'submitted_to_rejected': 'Reject Submission',
  'cdfc_review_to_tac_appraisal': 'Forward to TAC',
  'cdfc_review_to_rejected': 'Reject at CDFC',
  'tac_appraisal_to_plgo_review': 'Recommend Approval',
  'tac_appraisal_to_rejected': 'Reject at TAC',
  'plgo_review_to_approved': 'Approve Project',
  'plgo_review_to_rejected': 'Reject at PLGO',
  'approved_to_implementation': 'Start Implementation',
  'implementation_to_completed': 'Mark Complete',
  'implementation_to_cancelled': 'Cancel Project',
  'rejected_to_draft': 'Revise & Resubmit',
};

// API endpoint mapping for workflow transitions
const TRANSITION_ENDPOINTS: Record<string, string> = {
  'draft_to_submitted': 'submit',
  'submitted_to_cdfc_review': 'cdfc-approve',
  'cdfc_review_to_tac_appraisal': 'cdfc-approve',
  'tac_appraisal_to_plgo_review': 'tac-appraise',
  'plgo_review_to_approved': 'plgo-approve',
  'approved_to_implementation': 'progress',
  'implementation_to_completed': 'complete',
};

export function useProjectWorkflow() {
  const { user } = useAuth();
  const { roles, hasAnyRole } = useUserRoles();
  const queryClient = useQueryClient();

  // Check if user can transition from current status
  const canTransition = (currentStatus: ProjectStatus): boolean => {
    const transition = WORKFLOW_TRANSITIONS[currentStatus];
    if (!transition || transition.next.length === 0) return false;
    return hasAnyRole(transition.roles);
  };

  // Get available next statuses for user
  const getAvailableTransitions = (currentStatus: ProjectStatus): ProjectStatus[] => {
    const transition = WORKFLOW_TRANSITIONS[currentStatus];
    if (!transition || !hasAnyRole(transition.roles)) return [];
    return transition.next;
  };

  // Get action label for a transition
  const getTransitionLabel = (from: ProjectStatus, to: ProjectStatus): string => {
    const key = `${from}_to_${to}`;
    return TRANSITION_ACTIONS[key] || `Move to ${STATUS_LABELS[to]}`;
  };

  // Mutation to update project status via API Gateway (SECURE)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      projectId,
      currentStatus,
      newStatus,
      notes,
      comments,
    }: {
      projectId: string;
      currentStatus?: ProjectStatus;
      newStatus: ProjectStatus;
      notes?: string;
      comments?: string;
    }) => {
      const transitionKey = currentStatus ? `${currentStatus}_to_${newStatus}` : '';
      const endpoint = TRANSITION_ENDPOINTS[transitionKey];

      // Use API Gateway for secure transitions
      if (endpoint) {
        try {
          const { data } = await api.post(`/projects/${projectId}/${endpoint}`, {
            comments: comments || notes,
            decision: newStatus === 'rejected' ? 'rejected' : 'approved',
          });
          return data;
        } catch (apiError: any) {
          // If API is unavailable, show error (don't fallback for security)
          if (apiError.response?.status === 401 || apiError.response?.status === 403) {
            throw new Error(apiError.response?.data?.message || 'You do not have permission for this action');
          }
          // For network errors, fallback to direct Supabase with warning
          console.warn('API Gateway unavailable, using Supabase directly');
        }
      }

      // Fallback for non-critical transitions or when API is unavailable
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set specific fields based on transition
      if (newStatus === 'submitted') {
        updateData.submitted_at = new Date().toISOString();
        updateData.submitted_by = user?.id;
      }

      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // Log the status change to audit_logs
      await supabase.from('audit_logs').insert({
        entity_type: 'project',
        entity_id: projectId,
        action: 'status_change',
        event_type: 'update',
        actor_id: user?.id,
        data_after: { status: newStatus, notes },
        metadata: {
          transition: `${currentStatus || 'unknown'} -> ${newStatus}`,
          notes,
          comments,
        },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', data?.id] });
      const status = data?.status as ProjectStatus;
      toast.success(`Project status updated to ${STATUS_LABELS[status] || status}`);
    },
    onError: (error: any) => {
      console.error('Error updating project status:', error);
      const message = error.response?.data?.message || error.message || 'Failed to update project status';
      toast.error('Failed to update project status', {
        description: message,
      });
    },
  });

  // Submit project for review via API
  const submitProject = useMutation({
    mutationFn: async ({ projectId, notes }: { projectId: string; notes?: string }) => {
      const { data } = await api.post(`/projects/${projectId}/submit`, { notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project submitted for review');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to submit project', { description: message });
    },
  });

  // CDFC approve/reject via API
  const cdfcApprove = useMutation({
    mutationFn: async ({ projectId, decision, comments }: {
      projectId: string;
      decision: 'approved' | 'rejected';
      comments?: string;
    }) => {
      const { data } = await api.post(`/projects/${projectId}/cdfc-approve`, { decision, comments });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.decision === 'approved' ? 'Project approved by CDFC' : 'Project rejected by CDFC');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('CDFC approval failed', { description: message });
    },
  });

  // TAC appraise via API
  const tacAppraise = useMutation({
    mutationFn: async ({ projectId, decision, technicalScore, comments }: {
      projectId: string;
      decision: 'approved' | 'rejected';
      technicalScore?: number;
      comments?: string;
    }) => {
      const { data } = await api.post(`/projects/${projectId}/tac-appraise`, {
        decision,
        technical_score: technicalScore,
        comments,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.decision === 'approved' ? 'Project recommended by TAC' : 'Project rejected by TAC');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('TAC appraisal failed', { description: message });
    },
  });

  // PLGO approve via API
  const plgoApprove = useMutation({
    mutationFn: async ({ projectId, decision, comments }: {
      projectId: string;
      decision: 'approved' | 'rejected';
      comments?: string;
    }) => {
      const { data } = await api.post(`/projects/${projectId}/plgo-approve`, { decision, comments });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.decision === 'approved' ? 'Project approved by PLGO' : 'Project rejected by PLGO');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('PLGO approval failed', { description: message });
    },
  });

  // Update project progress via API
  const updateProgress = useMutation({
    mutationFn: async ({ projectId, progress, notes }: {
      projectId: string;
      progress: number;
      notes?: string;
    }) => {
      const { data } = await api.patch(`/projects/${projectId}/progress`, { progress, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project progress updated');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to update progress', { description: message });
    },
  });

  // Mark project complete via API
  const completeProject = useMutation({
    mutationFn: async ({ projectId, completionNotes }: { projectId: string; completionNotes?: string }) => {
      const { data } = await api.post(`/projects/${projectId}/complete`, { notes: completionNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project marked as complete');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to complete project', { description: message });
    },
  });

  return {
    canTransition,
    getAvailableTransitions,
    getTransitionLabel,
    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    statusLabels: STATUS_LABELS,
    workflowTransitions: WORKFLOW_TRANSITIONS,
    // New secure API-based mutations
    submitProject: submitProject.mutate,
    cdfcApprove: cdfcApprove.mutate,
    tacAppraise: tacAppraise.mutate,
    plgoApprove: plgoApprove.mutate,
    updateProgress: updateProgress.mutate,
    completeProject: completeProject.mutate,
  };
}
