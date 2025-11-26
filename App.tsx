
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import WardIntake from './views/WardIntake';
import Financials from './views/Financials';
import Projects from './views/Projects';
import AIKnowledge from './views/AIKnowledge';
import PublicPortal from './views/PublicPortal';
import Governance from './views/Governance';
import AdminSettings from './views/AdminSettings';
import Subscription from './views/Subscription';
import Bursaries from './views/Bursaries';
import Empowerment from './views/Empowerment';
import MonitoringEvaluation from './views/MonitoringEvaluation';
import UserManagement from './views/UserManagement';
import PLGODashboard from './views/PLGODashboard';
import Procurement from './views/Procurement';
import Audit from './views/Audit';
import Legal from './views/Legal';
import MinistryDashboard from './views/MinistryDashboard';
import Integrations from './views/Integrations';
import Reporting from './views/Reporting';
import SystemHealth from './views/SystemHealth';
import { ViewState, UserRole } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Users, ChevronUp } from 'lucide-react';

// Inner App Component to consume Auth Context
const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { switchRole, currentUser, canAccessView } = useAuth();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Redirect if user loses access to current view upon role switch
  useEffect(() => {
    if (!canAccessView(currentView) && currentView !== ViewState.PUBLIC_PORTAL) {
       // If user can access dashboard, go there. Otherwise Public Portal.
       if (canAccessView(ViewState.DASHBOARD)) {
         setCurrentView(ViewState.DASHBOARD);
       } else {
         setCurrentView(ViewState.PUBLIC_PORTAL);
       }
    }
  }, [currentUser, currentView, canAccessView]);

  const renderView = () => {
    // Double check render security
    if (!canAccessView(currentView) && currentView !== ViewState.PUBLIC_PORTAL) {
       return canAccessView(ViewState.DASHBOARD) ? <Dashboard /> : <PublicPortal />;
    }

    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard />;
      case ViewState.WARD_INTAKE: return <WardIntake />;
      case ViewState.FINANCE: return <Financials />;
      case ViewState.PROJECTS: return <Projects />;
      case ViewState.AI_CENTER: return <AIKnowledge />;
      case ViewState.PUBLIC_PORTAL: return <PublicPortal />;
      case ViewState.GOVERNANCE: return <Governance />;
      case ViewState.BURSARIES: return <Bursaries />;
      case ViewState.EMPOWERMENT: return <Empowerment />;
      case ViewState.M_AND_E: return <MonitoringEvaluation />;
      case ViewState.USERS: return <UserManagement />;
      case ViewState.ADMIN: return <AdminSettings />;
      case ViewState.SUBSCRIPTION: return <Subscription />;
      case ViewState.PLGO: return <PLGODashboard />;
      case ViewState.PROCUREMENT: return <Procurement />;
      case ViewState.AUDIT: return <Audit />;
      case ViewState.LEGAL: return <Legal />;
      case ViewState.MINISTRY: return <MinistryDashboard />;
      case ViewState.INTEGRATIONS: return <Integrations />;
      case ViewState.REPORTING: return <Reporting />;
      case ViewState.SYSTEM_HEALTH: return <SystemHealth />;
      default: return <Dashboard />;
    }
  };

  const isPublic = currentView === ViewState.PUBLIC_PORTAL;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isMobileOpen={isMobileSidebarOpen}
        closeMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {!isPublic && (
           <Header 
             toggleMobile={() => setIsMobileSidebarOpen(true)} 
             currentView={currentView}
           />
        )}
        
        {isPublic && (
           <button 
             onClick={() => setIsMobileSidebarOpen(true)} 
             className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-white/20 text-white rounded-lg backdrop-blur-md"
           >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>
        )}

        <main className={`flex-1 overflow-auto ${!isPublic ? 'p-4 lg:p-8' : ''}`}>
           <div className={`max-w-7xl mx-auto h-full ${isPublic ? 'max-w-none mx-0' : ''}`}>
              {renderView()}
           </div>
        </main>

        {/* RBAC DevTool: Role Switcher */}
        <div className="fixed bottom-6 right-6 z-50">
           <div className={`bg-slate-900 text-white rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${isSwitcherOpen ? 'w-64' : 'w-12 h-12 rounded-full'}`}>
              {isSwitcherOpen ? (
                 <div className="p-4">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                       <h3 className="font-bold text-sm flex items-center gap-2">
                          <Users size={16} /> Switch Persona
                       </h3>
                       <button onClick={() => setIsSwitcherOpen(false)}>
                          <ChevronUp size={16} className="rotate-180" />
                       </button>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600">
                       {Object.values(UserRole).map((role) => (
                          <button
                             key={role}
                             onClick={() => switchRole(role)}
                             className={`w-full text-left px-3 py-2 rounded text-xs font-medium transition-colors ${currentUser.role === role ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
                          >
                             {role}
                          </button>
                       ))}
                    </div>
                 </div>
              ) : (
                 <button 
                    onClick={() => setIsSwitcherOpen(true)}
                    className="w-full h-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-lg shadow-blue-900/50"
                    title="Switch User Role"
                 >
                    <Users size={20} />
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
