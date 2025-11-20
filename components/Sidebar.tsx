
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
  Activity
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isMobileOpen: boolean;
  closeMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isMobileOpen, closeMobile }) => {
  
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Smart Dashboard', icon: LayoutDashboard },
    { id: ViewState.MINISTRY, label: 'Ministry HQ', icon: Building },
    { id: ViewState.WARD_INTAKE, label: 'Ward Intake (WDC)', icon: Users },
    { id: ViewState.PROJECTS, label: 'Projects & Works', icon: HardHat },
    { id: ViewState.PROCUREMENT, label: 'Procurement', icon: ShoppingBag },
    { id: ViewState.FINANCE, label: 'Financials', icon: Landmark },
    { id: ViewState.BURSARIES, label: 'Bursaries', icon: GraduationCap },
    { id: ViewState.EMPOWERMENT, label: 'Empowerment', icon: Sprout },
    { id: ViewState.M_AND_E, label: 'M&E / Site Visits', icon: ClipboardCheck },
    { id: ViewState.GOVERNANCE, label: 'Governance & TAC', icon: Gavel },
    { id: ViewState.PLGO, label: 'PLGO Oversight', icon: Building2 },
    { id: ViewState.REPORTING, label: 'Reporting & Analytics', icon: BarChart3 },
    { id: ViewState.AUDIT, label: 'Audits & Risks', icon: FileSearch },
    { id: ViewState.LEGAL, label: 'Legal & Contracts', icon: Scale },
    { id: ViewState.AI_CENTER, label: 'AI Knowledge', icon: Bot },
    { id: ViewState.PUBLIC_PORTAL, label: 'Public Portal', icon: Globe },
  ];

  const saasItems = [
    { id: ViewState.USERS, label: 'User Management', icon: Shield },
    { id: ViewState.INTEGRATIONS, label: 'Integrations', icon: Network },
    { id: ViewState.SYSTEM_HEALTH, label: 'System Health', icon: Activity },
    { id: ViewState.ADMIN, label: 'Admin Settings', icon: Settings },
    { id: ViewState.SUBSCRIPTION, label: 'Subscription', icon: CreditCard },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight">CDF Smart Hub</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Main Menu
          </div>
          <nav className="space-y-1 mb-8">
            {navItems.map((item) => {
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
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            SaaS & Admin
          </div>
          <nav className="space-y-1">
            {saasItems.map((item) => {
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
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="https://picsum.photos/100/100" 
              alt="User" 
              className="w-10 h-10 rounded-full border-2 border-slate-700"
            />
            <div>
              <p className="text-sm font-medium text-white">Jane Doe</p>
              <p className="text-xs text-slate-500">CDFC Secretary</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;