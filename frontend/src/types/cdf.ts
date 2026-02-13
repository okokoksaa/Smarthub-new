// CDF Smart Hub Core Types

export type UserRole = 
  | 'ministry_official'
  | 'auditor'
  | 'plgo'
  | 'cdfc_chair'
  | 'finance_officer'
  | 'tac_member'
  | 'wdc_member'
  | 'mp'
  | 'contractor'
  | 'citizen'
  | 'community_member';

export type ProjectStatus = 
  | 'submitted'
  | 'cdfc_review'
  | 'cdfc_approved'
  | 'tac_appraisal'
  | 'plgo_review'
  | 'approved'
  | 'implementation'
  | 'completed'
  | 'rejected';

export type PaymentStatus = 
  | 'pending'
  | 'panel_a_review'
  | 'panel_b_review'
  | 'authorized'
  | 'executed'
  | 'rejected';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Province {
  id: number;
  name: string;
  code: string;
}

export interface District {
  id: number;
  provinceId: number;
  name: string;
}

export interface Constituency {
  id: number;
  districtId: number;
  name: string;
  mpName: string;
  allocatedBudget: number;
  utilizedBudget: number;
}

export interface Ward {
  id: number;
  constituencyId: number;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  constituencyId: number;
  constituencyName: string;
  wardId: number;
  wardName: string;
  status: ProjectStatus;
  budget: number;
  disbursed: number;
  completionPercentage: number;
  submittedAt: string;
  submittedBy: string;
  aiRiskScore?: number;
  aiFlags?: string[];
  lastUpdated: string;
}

export interface Payment {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  status: PaymentStatus;
  contractorName: string;
  milestone: string;
  requestedAt: string;
  aiRiskScore?: number;
  aiFlags?: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  actor: {
    userId: string;
    role: UserRole;
    name: string;
  };
  entity: {
    type: string;
    id: string;
    name: string;
  };
  action: string;
  description: string;
}

export interface DashboardMetrics {
  totalBudget: number;
  disbursedAmount: number;
  projectsTotal: number;
  projectsCompleted: number;
  projectsInProgress: number;
  projectsPending: number;
  constituenciesActive: number;
  pendingPayments: number;
  aiAlertsToday: number;
}

export interface AIAdvisory {
  id: string;
  entityType: 'project' | 'payment' | 'contractor';
  entityId: string;
  entityName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[];
  timestamp: string;
}
