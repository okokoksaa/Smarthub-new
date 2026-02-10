import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { useMemo } from 'react';

export type AppRole =
  | 'super_admin'
  | 'ministry_official'
  | 'auditor'
  | 'plgo'
  | 'tac_chair'
  | 'tac_member'
  | 'cdfc_chair'
  | 'cdfc_member'
  | 'finance_officer'
  | 'wdc_member'
  | 'mp'
  | 'contractor'
  | 'citizen';

interface UserRolesResponse {
  roles: AppRole[];
}

export function useUserRoles() {
  const { user } = useAuth();

  const { data: roles = [], isLoading: loading } = useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      try {
        const { data } = await api.get<UserRolesResponse>('/auth/roles');
        return data.roles || [];
      } catch (err) {
        console.error('Error fetching user roles via API:', err);
        // Fallback to empty roles to avoid over-permissioning
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    retry: 1,
  });

  // Memoized helper functions to avoid recreating on every render
  const helpers = useMemo(() => ({
    hasRole: (role: AppRole): boolean => {
      return roles.includes(role);
    },

    hasAnyRole: (checkRoles: AppRole[]): boolean => {
      return checkRoles.some(role => roles.includes(role));
    },

    hasAllRoles: (checkRoles: AppRole[]): boolean => {
      return checkRoles.every(role => roles.includes(role));
    },

    isAdmin: (): boolean => {
      return roles.some(role => ['super_admin', 'ministry_official'].includes(role));
    },

    isAuditor: (): boolean => {
      return roles.includes('auditor');
    },

    isSuperAdmin: (): boolean => {
      return roles.includes('super_admin');
    },

    // Project management permissions
    canManageProjects: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'wdc_member'].includes(role)
      );
    },

    canApproveProjects: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    canReviewProjects: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'tac_chair', 'tac_member', 'cdfc_chair', 'cdfc_member'].includes(role)
      );
    },

    // Payment permissions
    canManagePayments: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'finance_officer', 'cdfc_chair', 'plgo'].includes(role)
      );
    },

    // Panel A authorization (MP, CDFC Chair, Finance Officer)
    canApprovePanelA: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'mp', 'cdfc_chair', 'finance_officer'].includes(role)
      );
    },

    // Panel B authorization (PLGO, Ministry Official)
    canApprovePanelB: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    // Audit permissions
    canViewAuditLogs: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'auditor', 'ministry_official'].includes(role)
      );
    },

    canInvestigate: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'auditor'].includes(role)
      );
    },

    // Committee permissions
    canManageCommittees: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    canChairMeetings: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'cdfc_chair', 'tac_chair'].includes(role)
      );
    },

    canVoteInCommittee: (): boolean => {
      return roles.some(role =>
        ['cdfc_chair', 'cdfc_member', 'tac_chair', 'tac_member', 'wdc_member'].includes(role)
      );
    },

    // Budget permissions
    canManageBudgets: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'ministry_official', 'finance_officer'].includes(role)
      );
    },

    canApproveBudgets: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'ministry_official'].includes(role)
      );
    },

    // Document permissions
    canUploadDocuments: (): boolean => {
      // Most roles can upload documents
      return roles.length > 0;
    },

    canVerifyDocuments: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'plgo', 'ministry_official', 'auditor'].includes(role)
      );
    },

    // Calendar/Holiday permissions
    canManageHolidays: (): boolean => {
      return roles.some(role =>
        ['super_admin', 'ministry_official'].includes(role)
      );
    },
  }), [roles]);

  return {
    roles,
    loading,
    ...helpers,
  };
}

// Type-safe permission check hook for specific actions
export function useHasPermission(requiredRoles: AppRole[]) {
  const { roles, loading } = useUserRoles();

  const hasPermission = useMemo(() => {
    return requiredRoles.some(role => roles.includes(role));
  }, [roles, requiredRoles]);

  return { hasPermission, loading };
}
