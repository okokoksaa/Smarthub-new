
import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  toggleMobile: () => void;
  currentView: ViewState;
}

const Header: React.FC<HeaderProps> = ({ toggleMobile, currentView }) => {
  const getTitle = (view: ViewState) => {
    switch (view) {
      case ViewState.DASHBOARD: return 'Smart Dashboard';
      case ViewState.WARD_INTAKE: return 'Ward Intake & WDC';
      case ViewState.PROJECTS: return 'Projects & Procurement';
      case ViewState.FINANCE: return 'Financial Management';
      case ViewState.AI_CENTER: return 'AI Knowledge Center';
      case ViewState.PUBLIC_PORTAL: return 'Public Transparency Portal';
      case ViewState.GOVERNANCE: return 'Governance & TAC';
      case ViewState.MINISTRY: return 'Ministry HQ Dashboard';
      case ViewState.REPORTING: return 'Reporting & Analytics';
      case ViewState.INTEGRATIONS: return 'Integrations & Pipelines';
      case ViewState.SYSTEM_HEALTH: return 'System Health & Security';
      case ViewState.PLGO: return 'Provincial Oversight (PLGO)';
      case ViewState.PROCUREMENT: return 'Procurement Management';
      case ViewState.AUDIT: return 'Audit & Investigations';
      case ViewState.LEGAL: return 'Legal & Compliance';
      case ViewState.USERS: return 'User Management';
      case ViewState.ADMIN: return 'Admin Settings';
      case ViewState.SUBSCRIPTION: return 'Subscription Management';
      case ViewState.BURSARIES: return 'Bursary Management';
      case ViewState.EMPOWERMENT: return 'Empowerment Fund';
      case ViewState.M_AND_E: return 'Monitoring & Evaluation';
      default: return 'CDF Smart Hub';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobile}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{getTitle(currentView)}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 border-l border-slate-200 pl-4">
          <span>Kamwala Constituency</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">Lusaka Prov</span>
        </div>
      </div>
    </header>
  );
};

export default Header;