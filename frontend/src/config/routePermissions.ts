import { AppRole } from '@/hooks/useUserRoles';

// Role groupings for easier management
export const ALL_INTERNAL_ROLES: AppRole[] = [
  'super_admin', 'ministry_official', 'auditor', 'plgo', 'tac_chair', 'tac_member',
  'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member', 'mp'
];

export const ADMIN_ROLES: AppRole[] = ['super_admin', 'ministry_official'];
export const FINANCE_ROLES: AppRole[] = ['super_admin', 'finance_officer', 'cdfc_chair', 'plgo', 'ministry_official'];
export const OVERSIGHT_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'auditor', 'plgo'];
export const PROJECT_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'tac_chair', 'tac_member', 'mp'];
export const COMMUNITY_ROLES: AppRole[] = ['super_admin', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'mp', 'plgo', 'ministry_official'];

// Route permission configuration
export interface RoutePermission {
  path: string;
  allowedRoles: AppRole[];
  description: string;
}

export const routePermissions: RoutePermission[] = [
  // Core - accessible by all internal roles
  { path: '/', allowedRoles: ALL_INTERNAL_ROLES, description: 'Dashboard' },
  { path: '/ai-knowledge', allowedRoles: ALL_INTERNAL_ROLES, description: 'AI Knowledge Center' },
  { path: '/ai-chat', allowedRoles: ALL_INTERNAL_ROLES, description: 'AI Assistant Chat' },
  
  // Community - ward and community level
  { path: '/ward-intake', allowedRoles: COMMUNITY_ROLES, description: 'Ward Intake' },
  { path: '/cdfc', allowedRoles: ['super_admin', 'cdfc_chair', 'cdfc_member', 'plgo', 'ministry_official', 'mp'], description: 'CDFC Governance' },
  { path: '/tac', allowedRoles: ['super_admin', 'tac_chair', 'tac_member', 'plgo', 'ministry_official'], description: 'TAC Appraisal' },
  
  // Approvals - higher level oversight
  { path: '/plgo', allowedRoles: ['super_admin', 'plgo', 'ministry_official'], description: 'PLGO Dashboard' },
  { path: '/ministry', allowedRoles: ['super_admin', 'ministry_official'], description: 'Ministry Dashboard' },
  { path: '/command-center', allowedRoles: ['super_admin', 'ministry_official', 'auditor'], description: 'National Command Center' },
  
  // Projects & Procurement
  { path: '/projects', allowedRoles: PROJECT_ROLES, description: 'Project Lifecycle' },
  { path: '/project-workflow', allowedRoles: PROJECT_ROLES, description: 'Project Workflow & Approvals' },
  { path: '/procurement', allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'finance_officer'], description: 'Procurement' },
  
  // Finance
  { path: '/financial', allowedRoles: FINANCE_ROLES, description: 'Financial Management' },
  { path: '/expenditure', allowedRoles: FINANCE_ROLES, description: 'Expenditure Returns' },
  { path: '/payments', allowedRoles: FINANCE_ROLES, description: 'Payments' },
  
  // Programs
  { path: '/empowerment', allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'mp'], description: 'Empowerment Grants' },
  { path: '/bursaries', allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'mp'], description: 'Bursary Management' },
  
  // Oversight
  { path: '/monitoring', allowedRoles: OVERSIGHT_ROLES, description: 'Monitoring & Evaluation' },
  { path: '/legal', allowedRoles: OVERSIGHT_ROLES, description: 'Legal Compliance' },
  { path: '/audits', allowedRoles: ['super_admin', 'auditor', 'ministry_official'], description: 'Audits & Investigations' },
  
  // Administration - admin only
  { path: '/users', allowedRoles: ADMIN_ROLES, description: 'User Management' },
  { path: '/admin', allowedRoles: ADMIN_ROLES, description: 'Admin Control Panel' },
  { path: '/billing', allowedRoles: ADMIN_ROLES, description: 'Settings & Billing' },
  
  // System - admin only
  { path: '/integrations', allowedRoles: ADMIN_ROLES, description: 'Integrations Hub' },
  { path: '/reports', allowedRoles: [...OVERSIGHT_ROLES, 'finance_officer'], description: 'Reports' },
  { path: '/system-health', allowedRoles: ADMIN_ROLES, description: 'System Health' },
  { path: '/security', allowedRoles: ADMIN_ROLES, description: 'Security Center' },
];

// Helper function to get allowed roles for a path
export function getRoutePermissions(path: string): AppRole[] {
  const route = routePermissions.find(r => r.path === path);
  return route?.allowedRoles || [];
}
