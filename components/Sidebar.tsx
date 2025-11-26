
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  HardHat, 
  Landmark, 
  Bot, 
  Globe, 
  Gavel,
  LogOut,
  Settings,
  CreditCard,
  GraduationCap,
  Sprout,
  ClipboardCheck,
  Shield,
  Building2,
  ShoppingBag,
  FileSearch,
  Scale,
  Building,
  BarChart3,
  Network,
  Activity,
  ChevronRight
} from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isMobileOpen, closeMobile }) => {
  const { currentUser, canAccessView } = useAuth();

  const mainNav = [
    { id: ViewState.DASHBOARD, label: 'Smart Dashboard', icon: LayoutDashboard },
    { id: ViewState.MINISTRY, label: 'Ministry HQ', icon: Building },
    { id: ViewState.PLGO, label: 'Provincial Oversight', icon: Building2 },
  ];

  const operationsNav = [
    { id: ViewState.WARD_INTAKE, label: 'Ward Intake', icon: Users },
    { id: ViewState.PROJECTS, label: 'Projects & Works', icon: HardHat },
    { id: ViewState.PROCUREMENT, label: 'Procurement', icon: ShoppingBag },
    { id: ViewState.FINANCE, label: 'Financials', icon: Landmark },
  ];

  const socialNav = [
    { id: ViewState.BURSARIES, label: 'Bursaries', icon: GraduationCap },
    { id: ViewState.EMPOWERMENT, label: 'Empowerment', icon: Sprout },
  ];

  const governanceNav = [
    { id: ViewState.M_AND_E, label: 'M&E / Site Visits', icon: ClipboardCheck },
    { id: ViewState.GOVERNANCE, label: 'Governance & TAC', icon: Gavel },
    { id: ViewState.REPORTING, label: 'Reporting', icon: BarChart3 },
    { id: ViewState.AUDIT, label: 'Audits & Risks', icon: FileSearch },
    { id: ViewState.LEGAL, label: 'Legal & Contracts', icon: Scale },
  ];

  const toolsNav = [
    { id: ViewState.AI_CENTER, label: 'AI Knowledge', icon: Bot },
    { id: ViewState.PUBLIC_PORTAL, label: 'Public Portal', icon: Globe },
  ];

  const adminNav = [
    { id: ViewState.USERS, label: 'Users', icon: Shield },
    { id: ViewState.INTEGRATIONS, label: 'Integrations', icon: Network },
    { id: ViewState.SYSTEM_HEALTH, label: 'System Health', icon: Activity },
    { id: ViewState.ADMIN, label: 'Settings', icon: Settings },
    { id: ViewState.SUBSCRIPTION, label: 'Billing', icon: CreditCard },
  ];

  const renderNavItem = (item: { id: ViewState, label: string, icon: React.ElementType }) => {
    // RBAC Check
    if (!canAccessView(item.id)) return null;

    const Icon = item.icon;
    const isActive = currentView === item.id;
    
    return (
      <button
        key={item.id}
        onClick={() => {
          onNavigate(item.id);
          closeMobile();
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative
          ${isActive 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
        `}
      >
        <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {isActive && <ChevronRight size={14} className="text-blue-200" />}
      </button>
    );
  };

  // Helper to check if a section has visible items
  const hasVisibleItems = (items: { id: ViewState }[]) => {
    return items.some(item => canAccessView(item.id));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col shadow-xl
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none tracking-tight text-white">CDF Smart Hub</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Gov. of Zambia</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          
          {hasVisibleItems(mainNav) && (
            <div className="space-y-1">
              {mainNav.map(renderNavItem)}
            </div>
          )}

          {hasVisibleItems(operationsNav) && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Core Operations</div>
              <div className="space-y-1">
                {operationsNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {hasVisibleItems(socialNav) && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Social Impact</div>
              <div className="space-y-1">
                {socialNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {hasVisibleItems(governanceNav) && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Governance</div>
              <div className="space-y-1">
                {governanceNav.map(renderNavItem)}
              </div>
            </div>
          )}

          {hasVisibleItems(toolsNav) && (
             <div>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tools & Access</div>
                <div className="space-y-1">
                   {toolsNav.map(renderNavItem)}
                </div>
             </div>
          )}

          {hasVisibleItems(adminNav) && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Administration</div>
              <div className="space-y-1">
                {adminNav.map(renderNavItem)}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
            <div className="relative">
               <img 
                  src={currentUser.avatarUrl}
                  alt="User" 
                  className="w-9 h-9 rounded-full border border-slate-600 group-hover:border-blue-500 transition-colors"
               />
               <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.scope}</p>
            </div>
            <LogOut size={16} className="text-slate-500 hover:text-red-400 transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
