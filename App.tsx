
import React, { useState } from 'react';
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
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderView = () => {
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

  // Special Layout for Public Portal (Full Width, No Sidebar usually, but here kept for demo navigation)
  const isPublic = currentView === ViewState.PUBLIC_PORTAL;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar - Hidden if strictly public mode wanted, but kept for demo navigation */}
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
        
        {/* Public Portal has its own header internally */}
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
      </div>
    </div>
  );
};

export default App;