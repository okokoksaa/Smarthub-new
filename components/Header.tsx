
import React from 'react';
import { Menu, Bell, Search, ChevronDown, Shield } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  toggleMobile: () => void;
  currentView: ViewState;
}

const Header: React.FC<HeaderProps> = ({ toggleMobile, currentView }) => {
  const { currentUser } = useAuth();

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
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 transition-all duration-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobile}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex flex-col">
           <h1 className="text-lg font-bold text-slate-800 leading-tight">{getTitle(currentView)}</h1>
           <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Home</span>
              <span className="text-slate-300">/</span>
              <span>{currentView.charAt(0) + currentView.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6">
         {/* Active Role Indicator (Security Context) */}
         <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            <Shield size={12} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-600">Role: <span className="text-blue-600 font-bold">{currentUser.role}</span></span>
         </div>

         <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
               type="text" 
               placeholder="Search entire system..." 
               className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
         </div>

         <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

         <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full transition-colors">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            </button>
            
            <button className="hidden md:flex items-center gap-3 pl-2 py-1 pr-1 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
               <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-slate-700">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500">{currentUser.scope}</p>
               </div>
               <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-600 overflow-hidden">
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <ChevronDown size={14} className="text-slate-400 mr-1" />
            </button>
         </div>
      </div>
    </header>
  );
};

export default Header;
