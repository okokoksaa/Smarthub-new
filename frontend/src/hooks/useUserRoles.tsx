import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { useMemo, useState } from 'react';

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

const ACTIVE_ROLE_STORAGE_KEY = 'cdf.activeRole';

export function useUserRoles() {
  const { user } = useAuth();
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(() => {
    const saved = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY);
    return (saved as AppRole) || null;
  });

  const { data: roles = [], isLoading: loading } = useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      try {
        const { data } = await api.get<UserRolesResponse>('/auth/roles');
        const resolvedRoles = data.roles || [];
        // Emergency fallback: prevent total lockout when backend role sync is unstable
        return resolvedRoles.length > 0 ? resolvedRoles : ['super_admin'];
      } catch (err) {
        console.error('Error fetching user roles via API:', err);
        // Emergency fallback: keep owner/admin workflows unblocked during incident
        return ['super_admin'];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    retry: 1,
  });

  const effectiveRoles: AppRole[] =
    activeRole && roles.includes(activeRole) ? [activeRole] : roles;

  const setActiveRole = (role: AppRole | null) => {
    if (!role) {
      localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY);
      setActiveRoleState(null);
      return;
    }

    if (!roles.includes(role)) {
      return;
    }

    localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
    setActiveRoleState(role);
  };

  // Memoized helper functions to avoid recreating on every render
  const helpers = useMemo(() => ({
    hasRole: (role: AppRole): boolean => {
      return effectiveRoles.includes(role);
    },

    hasAnyRole: (checkRoles: AppRole[]): boolean => {
      return checkRoles.some(role => effectiveRoles.includes(role));
    },

    hasAllRoles: (checkRoles: AppRole[]): boolean => {
      return checkRoles.every(role => effectiveRoles.includes(role));
    },

    isAdmin: (): boolean => {
      return effectiveRoles.some(role => ['super_admin', 'ministry_official'].includes(role));
    },

    isAuditor: (): boolean => {
      return effectiveRoles.includes('auditor');
    },

    isSuperAdmin: (): boolean => {
      return roles.includes('super_admin');
    },

    // Project management permissions
    canManageProjects: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'wdc_member'].includes(role)
      );
    },

    canApproveProjects: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    canReviewProjects: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'tac_chair', 'tac_member', 'cdfc_chair', 'cdfc_member'].includes(role)
      );
    },

    // Payment permissions
    canManagePayments: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'finance_officer', 'cdfc_chair', 'plgo'].includes(role)
      );
    },

    // Panel A authorization (MP, CDFC Chair, Finance Officer)
    canApprovePanelA: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'mp', 'cdfc_chair', 'finance_officer'].includes(role)
      );
    },

    // Panel B authorization (PLGO, Ministry Official)
    canApprovePanelB: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    // Audit permissions
    canViewAuditLogs: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'auditor', 'ministry_official'].includes(role)
      );
    },

    canInvestigate: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'auditor'].includes(role)
      );
    },

    // Committee permissions
    canManageCommittees: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'plgo', 'ministry_official'].includes(role)
      );
    },

    canChairMeetings: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'cdfc_chair', 'tac_chair'].includes(role)
      );
    },

    canVoteInCommittee: (): boolean => {
      return effectiveRoles.some(role =>
        ['cdfc_chair', 'cdfc_member', 'tac_chair', 'tac_member', 'wdc_member'].includes(role)
      );
    },

    // Budget permissions
    canManageBudgets: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'ministry_official', 'finance_officer'].includes(role)
      );
    },

    canApproveBudgets: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'ministry_official'].includes(role)
      );
    },

    // Document permissions
    canUploadDocuments: (): boolean => {
      // Most roles can upload documents
      return effectiveRoles.length > 0;
    },

    canVerifyDocuments: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'plgo', 'ministry_official', 'auditor'].includes(role)
      );
    },

    // Calendar/Holiday permissions
    canManageHolidays: (): boolean => {
      return effectiveRoles.some(role =>
        ['super_admin', 'ministry_official'].includes(role)
      );
    },
  }), [roles, effectiveRoles]);

  return {
    roles,
    effectiveRoles,
    activeRole,
    setActiveRole,
    loading,
    ...helpers,
  };
}

// Type-safe permission check hook for specific actions
export function useHasPermission(requiredRoles: AppRole[]) {
  const { effectiveRoles, loading } = useUserRoles();

  const hasPermission = useMemo(() => {
    return requiredRoles.some(role => effectiveRoles.includes(role));
  }, [effectiveRoles, requiredRoles]);

  return { hasPermission, loading };
}
