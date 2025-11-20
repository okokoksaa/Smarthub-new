
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  WARD_INTAKE = 'WARD_INTAKE',
  PROJECTS = 'PROJECTS',
  FINANCE = 'FINANCE',
  AI_CENTER = 'AI_CENTER',
  PUBLIC_PORTAL = 'PUBLIC_PORTAL',
  GOVERNANCE = 'GOVERNANCE',
  BURSARIES = 'BURSARIES',
  EMPOWERMENT = 'EMPOWERMENT',
  M_AND_E = 'M_AND_E',
  USERS = 'USERS',
  ADMIN = 'ADMIN',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PLGO = 'PLGO',
  PROCUREMENT = 'PROCUREMENT',
  AUDIT = 'AUDIT',
  LEGAL = 'LEGAL',
  MINISTRY = 'MINISTRY',
  INTEGRATIONS = 'INTEGRATIONS',
  REPORTING = 'REPORTING',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MINISTRY = 'MINISTRY',
  PLGO = 'PLGO',
  CDFC = 'CDFC',
  WDC = 'WDC',
  TAC = 'TAC',
  FINANCE = 'FINANCE',
  AUDITOR = 'AUDITOR',
  PUBLIC = 'PUBLIC'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  scope: string; // e.g., "Kabwata Ward", "Lusaka Province", "National"
  avatarUrl?: string;
}

export interface Project {
  id: string;
  title: string;
  location: string;
  budget: number;
  spent: number;
  status: 'Planning' | 'Procurement' | 'Active' | 'Completed' | 'Stalled';
  progress: number; // 0-100
  ward: string;
  startDate: string;
}

export interface Task {
  id: string;
  title: string;
  dueInDays: number;
  type: 'Approval' | 'Review' | 'Signature' | 'Compliance';
  priority: 'High' | 'Medium' | 'Low';
  assignedTo: string;
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'Pending Panel A' | 'Pending Panel B' | 'Approved' | 'Paid';
  category: 'Bursary' | 'Infrastructure' | 'Empowerment';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  citations?: string[];
}
