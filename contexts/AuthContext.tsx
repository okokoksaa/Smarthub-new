
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, ViewState } from '../types';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  canAccessView: (view: ViewState) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users for Personas based on PRD
const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.ADMIN]: {
    id: 'admin-1',
    name: 'System Admin',
    email: 'admin@cdf.gov.zm',
    role: UserRole.ADMIN,
    scope: 'National - Root',
    avatarUrl: 'https://ui-avatars.com/api/?name=System+Admin&background=0f172a&color=fff'
  },
  [UserRole.MINISTRY]: {
    id: 'hq-1',
    name: 'Hon. Minister',
    email: 'minister@mlgrd.gov.zm',
    role: UserRole.MINISTRY,
    scope: 'National',
    avatarUrl: 'https://ui-avatars.com/api/?name=Hon+Minister&background=0f172a&color=fff'
  },
  [UserRole.PLGO]: {
    id: 'plgo-1',
    name: 'Provincial Officer',
    email: 'plgo.lusaka@cdf.gov.zm',
    role: UserRole.PLGO,
    scope: 'Lusaka Province',
    avatarUrl: 'https://ui-avatars.com/api/?name=Provincial+Officer&background=0f172a&color=fff'
  },
  [UserRole.CDFC]: {
    id: 'cdfc-1',
    name: 'CDFC Chairperson',
    email: 'chair@kabwata.cdf.zm',
    role: UserRole.CDFC,
    scope: 'Kabwata Constituency',
    avatarUrl: 'https://ui-avatars.com/api/?name=CDFC+Chair&background=0f172a&color=fff'
  },
  [UserRole.WDC]: {
    id: 'wdc-1',
    name: 'WDC Secretary',
    email: 'sec@zone4.ward.zm',
    role: UserRole.WDC,
    scope: 'Zone 4 Ward',
    avatarUrl: 'https://ui-avatars.com/api/?name=WDC+Sec&background=0f172a&color=fff'
  },
  [UserRole.TAC]: {
    id: 'tac-1',
    name: 'District Engineer',
    email: 'eng.mumba@council.gov.zm',
    role: UserRole.TAC,
    scope: 'District Technical',
    avatarUrl: 'https://ui-avatars.com/api/?name=Dist+Eng&background=0f172a&color=fff'
  },
  [UserRole.FINANCE]: {
    id: 'fin-1',
    name: 'Council Treasurer',
    email: 'finance@council.gov.zm',
    role: UserRole.FINANCE,
    scope: 'Financial Signatory',
    avatarUrl: 'https://ui-avatars.com/api/?name=Treasurer&background=0f172a&color=fff'
  },
  [UserRole.AUDITOR]: {
    id: 'aud-1',
    name: 'Internal Auditor',
    email: 'audit@oag.gov.zm',
    role: UserRole.AUDITOR,
    scope: 'Read Only',
    avatarUrl: 'https://ui-avatars.com/api/?name=Int+Auditor&background=0f172a&color=fff'
  },
  [UserRole.MP]: {
    id: 'mp-1',
    name: 'Hon. Member',
    email: 'mp@parliament.gov.zm',
    role: UserRole.MP,
    scope: 'Constituency Oversight',
    avatarUrl: 'https://ui-avatars.com/api/?name=Hon+MP&background=0f172a&color=fff'
  },
  [UserRole.CONTRACTOR]: {
    id: 'cont-1',
    name: 'BuildRight Ltd',
    email: 'info@buildright.zm',
    role: UserRole.CONTRACTOR,
    scope: 'Project Specific',
    avatarUrl: 'https://ui-avatars.com/api/?name=Contractor&background=0f172a&color=fff'
  },
  [UserRole.PUBLIC]: {
    id: 'pub-1',
    name: 'Citizen Guest',
    email: 'guest@public',
    role: UserRole.PUBLIC,
    scope: 'Public',
    avatarUrl: 'https://ui-avatars.com/api/?name=Citizen&background=0f172a&color=fff'
  }
};

// Role-to-View Permissions Mapping
const ROLE_PERMISSIONS: Record<UserRole, ViewState[]> = {
  [UserRole.ADMIN]: Object.values(ViewState),
  [UserRole.MINISTRY]: [
    ViewState.DASHBOARD, ViewState.MINISTRY, ViewState.REPORTING, 
    ViewState.AUDIT, ViewState.LEGAL, ViewState.AI_CENTER, ViewState.SYSTEM_HEALTH
  ],
  [UserRole.PLGO]: [
    ViewState.DASHBOARD, ViewState.PLGO, ViewState.REPORTING, 
    ViewState.PROJECTS, ViewState.GOVERNANCE, ViewState.PROCUREMENT, ViewState.AI_CENTER
  ],
  [UserRole.CDFC]: [
    ViewState.DASHBOARD, ViewState.WARD_INTAKE, ViewState.PROJECTS, 
    ViewState.GOVERNANCE, ViewState.BURSARIES, ViewState.EMPOWERMENT, 
    ViewState.M_AND_E, ViewState.AI_CENTER, ViewState.PROCUREMENT, ViewState.FINANCE, ViewState.REPORTING
  ],
  [UserRole.WDC]: [
    ViewState.WARD_INTAKE, ViewState.M_AND_E, ViewState.AI_CENTER
  ],
  [UserRole.TAC]: [
    ViewState.DASHBOARD, ViewState.GOVERNANCE, ViewState.PROJECTS, 
    ViewState.M_AND_E, ViewState.PROCUREMENT, ViewState.AI_CENTER
  ],
  [UserRole.FINANCE]: [
    ViewState.DASHBOARD, ViewState.FINANCE, ViewState.PROCUREMENT, 
    ViewState.BURSARIES, ViewState.EMPOWERMENT, ViewState.INTEGRATIONS, 
    ViewState.REPORTING
  ],
  [UserRole.AUDITOR]: [
    ViewState.DASHBOARD, ViewState.AUDIT, ViewState.FINANCE, 
    ViewState.PROJECTS, ViewState.PROCUREMENT, ViewState.REPORTING, 
    ViewState.LEGAL
  ],
  [UserRole.MP]: [
    ViewState.DASHBOARD, ViewState.PROJECTS, ViewState.REPORTING,
    ViewState.M_AND_E, ViewState.AI_CENTER
  ],
  [UserRole.CONTRACTOR]: [
    ViewState.PROJECTS, ViewState.FINANCE
  ],
  [UserRole.PUBLIC]: [
    ViewState.PUBLIC_PORTAL
  ]
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to CDFC for the best demo experience
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[UserRole.CDFC]);

  const switchRole = (role: UserRole) => {
    setCurrentUser(MOCK_USERS[role]);
  };

  const canAccessView = (view: ViewState): boolean => {
    // Public portal is accessible to everyone
    if (view === ViewState.PUBLIC_PORTAL) return true;
    
    const allowedViews = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowedViews.includes(view);
  };

  return (
    <AuthContext.Provider value={{ currentUser, switchRole, canAccessView }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
