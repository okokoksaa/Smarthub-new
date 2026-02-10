
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, ViewState } from '../types';
import { AuthApi, User as ApiUser, LoginRequest } from '../lib/api/auth';
import { socketManager } from '../lib/api-client';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ requiresMfa: boolean; sessionToken?: string }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  canAccessView: (view: ViewState) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void; // Keep for backward compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convert API user to local User type
const convertApiUserToUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    name: `${apiUser.firstName} ${apiUser.lastName}`,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    scope: apiUser.tenantScopeLevel,
    avatarUrl: apiUser.profilePhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(apiUser.firstName + '+' + apiUser.lastName)}&background=0f172a&color=fff`
  };
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          const user = JSON.parse(userData);
          setCurrentUser(convertApiUserToUser(user));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events
  useEffect(() => {
    const handleLogout = () => {
      setCurrentUser(null);
      setLoading(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (credentials: LoginRequest): Promise<{ requiresMfa: boolean; sessionToken?: string }> => {
    try {
      setLoading(true);
      const response = await AuthApi.login(credentials);

      if (response.requiresMfa) {
        return { requiresMfa: true, sessionToken: 'temp-session' };
      }

      const user = convertApiUserToUser(response.user);
      setCurrentUser(user);

      // Connect to WebSocket after successful login
      try {
        await socketManager.connect();
        
        // Join constituency-specific room if user has constituency scope
        if (user.scope && user.scope !== 'National') {
          // Extract constituency ID from scope (assuming scope format like "Kabwata Constituency")
          const constituencyId = user.scope.replace(' Constituency', '').toLowerCase().replace(' ', '-');
          socketManager.joinConstituencyRoom(constituencyId);
        }

        console.log('WebSocket connected and user joined relevant rooms');
      } catch (wsError) {
        console.warn('WebSocket connection failed, continuing without real-time features:', wsError);
      }

      return { requiresMfa: false };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Disconnect WebSocket
      socketManager.disconnect();
      setCurrentUser(null);
    }
  };

  const register = async (userData: any): Promise<void> => {
    const user = await AuthApi.register(userData);
    // Note: User will need to verify email before login
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!currentUser) throw new Error('No authenticated user');

    const updatedUser = await AuthApi.updateProfile(updates);
    setCurrentUser(convertApiUserToUser(updatedUser));
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const canAccessView = useCallback((view: ViewState): boolean => {
    // Public portal is accessible to everyone
    if (view === ViewState.PUBLIC_PORTAL) return true;
    
    if (!currentUser) return false;
    
    const allowedViews = ROLE_PERMISSIONS[currentUser.role] || [];
    return allowedViews.includes(view);
  }, [currentUser]);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!currentUser) return false;

    if (Array.isArray(role)) {
      return role.some(r => currentUser.role === r);
    }

    return currentUser.role === role;
  }, [currentUser]);

  // Legacy switchRole for backward compatibility (for demo purposes)
  const switchRole = (role: UserRole) => {
    console.warn('switchRole is deprecated. Use proper login/logout flow.');
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register,
    updateProfile,
    canAccessView,
    hasRole,
    isAuthenticated: !!currentUser,
    switchRole, // Keep for backward compatibility
  };

  return (
    <AuthContext.Provider value={value}>
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
