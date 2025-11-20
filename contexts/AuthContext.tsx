
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, ViewState } from '../types';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  canAccessView: (view: ViewState) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users for Personas
const MOCK_USERS: Record<UserRole, User> = {
  [UserRole.ADMIN]: {
    id: 'admin-1',
    name: 'System Admin',
    email: 'admin@cdf.gov.zm',
    role: UserRole.ADMIN,
    scope: 'National - Root',
    avatarUrl: 'https://picsum.photos/seed/admin/100/100'
  },
  [UserRole.MINISTRY]: {
    id: 'hq-1',
    name: 'Hon. Minister',
    email: 'minister@mlgrd.gov.zm',
    role: UserRole.MINISTRY,
    scope: 'National',
    avatarUrl: 'https://picsum.photos/seed/minister/100/100'
  },
  [UserRole.PLGO]: {
    id: 'plgo-1',
    name: 'Provincial Officer',
    email: 'plgo.lusaka@cdf.gov.zm',
    role: UserRole.PLGO,
    scope: 'Lusaka Province',
    avatarUrl: 'https://picsum.photos/seed/plgo/100/100'
  },
  [UserRole.CDFC]: {
    id: 'cdfc-1',
    name: 'CDFC Chairperson',
    email: 'chair@kabwata.cdf.zm',
    role: UserRole.CDFC,
    scope: 'Kabwata Constituency',
    avatarUrl: 'https://picsum.photos/seed/cdfc/100/100'
  },
  [UserRole.WDC]: {
    id: 'wdc-1',
    name: 'WDC Secretary',
    email: 'sec@zone4.ward.zm',
    role: UserRole.WDC,
    scope: 'Zone 4 Ward',
    avatarUrl: 'https://picsum.photos/seed/wdc/100/100'
  },
  [UserRole.TAC]: {
    id: 'tac-1',
    name: 'District Engineer',
    email: 'eng.mumba@council.gov.zm',
    role: UserRole.TAC,
    scope: 'District Technical',
    avatarUrl: 'https://picsum.photos/seed/tac/100/100'
  },
  [UserRole.FINANCE]: {
    id: 'fin-1',
    name: 'Council Treasurer',
    email: 'finance@council.gov.zm',
    role: UserRole.FINANCE,
    scope: 'Financial Signatory',
    avatarUrl: 'https://picsum.photos/seed/finance/100/100'
  },
  [UserRole.AUDITOR]: {
    id: 'aud-1',
    name: 'Internal Auditor',
    email: 'audit@oag.gov.zm',
    role: UserRole.AUDITOR,
    scope: 'Read Only',
    avatarUrl: 'https://picsum.photos/seed/audit/100/100'
  },
  [UserRole.PUBLIC]: {
    id: 'pub-1',
    name: 'Citizen Guest',
    email: 'guest@public',
    role: UserRole.PUBLIC,
    scope: 'Public',
    avatarUrl: 'https://picsum.photos/seed/public/100/100'
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
    ViewState.M_AND_E, ViewState.AI_CENTER, ViewState.PROCUREMENT
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
