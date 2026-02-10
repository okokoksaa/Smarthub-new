import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  CreditCard,
  Users,
  BarChart3,
  Globe,
  ChevronLeft,
  ChevronRight,
  Building2,
  Brain,
  FileText,
  Gavel,
  UserCheck,
  Briefcase,
  Wallet,
  Receipt,
  HandCoins,
  GraduationCap,
  ClipboardCheck,
  Scale,
  Search,
  Cog,
  DollarSign,
  Link2,
  Activity,
  Lock,
  ScrollText,
  GitPullRequest,
  Radar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  allowedRoles?: AppRole[]; // If undefined, all authenticated users can access
}

interface NavSection {
  title: string;
  items: NavItem[];
  allowedRoles?: AppRole[]; // If undefined, section visibility depends on items
}

// Define which roles can access which sections/items
const ALL_INTERNAL_ROLES: AppRole[] = [
  'super_admin', 'ministry_official', 'auditor', 'plgo', 'tac_chair', 'tac_member',
  'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member', 'mp'
];

const ADMIN_ROLES: AppRole[] = ['super_admin', 'ministry_official'];
const OVERSIGHT_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'auditor', 'plgo'];
const GOVERNANCE_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'tac_chair', 'tac_member', 'wdc_member', 'mp'];
const FINANCE_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'finance_officer', 'cdfc_chair', 'plgo', 'auditor'];
const PROJECT_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'tac_chair', 'tac_member', 'finance_officer', 'contractor'];
const PROGRAM_ROLES: AppRole[] = ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'finance_officer', 'wdc_member'];

const navSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { title: 'Smart Dashboard', href: '/', icon: LayoutDashboard, allowedRoles: ALL_INTERNAL_ROLES },
      { title: 'AI Knowledge Center', href: '/ai-knowledge', icon: Brain, badge: 3, allowedRoles: ALL_INTERNAL_ROLES },
    ],
  },
  {
    title: 'Community',
    allowedRoles: GOVERNANCE_ROLES,
    items: [
      { title: 'Ward Intake (WDC)', href: '/ward-intake', icon: FileText, badge: 24, allowedRoles: [...GOVERNANCE_ROLES] },
      { title: 'CDFC Governance', href: '/cdfc', icon: Gavel, badge: 8, allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'cdfc_member', 'mp'] },
      { title: 'TAC Appraisal', href: '/tac', icon: UserCheck, badge: 12, allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'tac_chair', 'tac_member'] },
    ],
  },
  {
    title: 'Approvals',
    allowedRoles: ['super_admin', 'ministry_official', 'plgo', 'auditor'],
    items: [
      { title: 'PLGO Dashboard', href: '/plgo', icon: Building2, badge: 5, allowedRoles: ['super_admin', 'ministry_official', 'plgo'] },
      { title: 'Ministry (HQ)', href: '/ministry', icon: Briefcase, badge: 2, allowedRoles: ['super_admin', 'ministry_official'] },
      { title: 'Command Center', href: '/command-center', icon: Radar, allowedRoles: ['super_admin', 'ministry_official', 'auditor'] },
    ],
  },
  {
    title: 'Projects & Procurement',
    items: [
      { title: 'Project Lifecycle', href: '/projects', icon: FolderKanban, badge: 405, allowedRoles: PROJECT_ROLES },
      { title: 'Project Workflow', href: '/project-workflow', icon: GitPullRequest, badge: 12, allowedRoles: PROJECT_ROLES },
      { title: 'Procurement', href: '/procurement', icon: ScrollText, badge: 18, allowedRoles: [...FINANCE_ROLES, 'contractor'] },
    ],
  },
  {
    title: 'Finance',
    allowedRoles: FINANCE_ROLES,
    items: [
      { title: 'Financial Management', href: '/financial', icon: Wallet, allowedRoles: FINANCE_ROLES },
      { title: 'Expenditure Returns', href: '/expenditure', icon: Receipt, badge: 7, allowedRoles: FINANCE_ROLES },
      { title: 'Payments', href: '/payments', icon: CreditCard, badge: 89, allowedRoles: [...FINANCE_ROLES, 'contractor'] },
    ],
  },
  {
    title: 'Programs',
    allowedRoles: PROGRAM_ROLES,
    items: [
      { title: 'Empowerment Grants', href: '/empowerment', icon: HandCoins, badge: 34, allowedRoles: PROGRAM_ROLES },
      { title: 'Bursary Management', href: '/bursaries', icon: GraduationCap, badge: 156, allowedRoles: PROGRAM_ROLES },
    ],
  },
  {
    title: 'Oversight',
    allowedRoles: OVERSIGHT_ROLES,
    items: [
      { title: 'M&E', href: '/monitoring', icon: ClipboardCheck, allowedRoles: OVERSIGHT_ROLES },
      { title: 'Legal & Compliance', href: '/legal', icon: Scale, allowedRoles: OVERSIGHT_ROLES },
      { title: 'Audits & Investigations', href: '/audits', icon: Search, allowedRoles: ['super_admin', 'ministry_official', 'auditor'] },
    ],
  },
  {
    title: 'Administration',
    allowedRoles: ADMIN_ROLES,
    items: [
      { title: 'Users & Roles', href: '/users', icon: Users, allowedRoles: ADMIN_ROLES },
      { title: 'Admin Control Panel', href: '/admin', icon: Cog, allowedRoles: ADMIN_ROLES },
      { title: 'Subscription & Billing', href: '/billing', icon: DollarSign, allowedRoles: ADMIN_ROLES },
    ],
  },
  {
    title: 'Public',
    items: [
      { title: 'Transparency Portal', href: '/public-portal', icon: Globe }, // Available to all
    ],
  },
  {
    title: 'System',
    allowedRoles: ADMIN_ROLES,
    items: [
      { title: 'Integrations', href: '/integrations', icon: Link2, allowedRoles: ADMIN_ROLES },
      { title: 'Reports & Analytics', href: '/reports', icon: BarChart3, allowedRoles: [...ADMIN_ROLES, 'auditor', 'plgo'] },
      { title: 'System Health', href: '/system-health', icon: Activity, allowedRoles: ADMIN_ROLES },
      { title: 'Security', href: '/security', icon: Lock, allowedRoles: ADMIN_ROLES },
    ],
  },
];

// Public-only navigation for citizens
const publicNavSections: NavSection[] = [
  {
    title: 'Public',
    items: [
      { title: 'Transparency Portal', href: '/public-portal', icon: Globe },
    ],
  },
];

// Contractor navigation
const contractorNavSections: NavSection[] = [
  {
    title: 'Core',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Projects',
    items: [
      { title: 'My Projects', href: '/projects', icon: FolderKanban },
      { title: 'Procurement', href: '/procurement', icon: ScrollText },
    ],
  },
  {
    title: 'Payments',
    items: [
      { title: 'My Payments', href: '/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Public',
    items: [
      { title: 'Transparency Portal', href: '/public-portal', icon: Globe },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { roles, hasAnyRole, loading: rolesLoading } = useUserRoles();

  // Filter navigation based on user roles
  const filteredNavSections = useMemo(() => {
    // If roles are still loading, show minimal nav
    if (rolesLoading) {
      return [{ title: 'Core', items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }] }];
    }

    // If user has no roles or is a citizen, show public-only navigation
    if (roles.length === 0 || (roles.length === 1 && roles[0] === 'citizen')) {
      return publicNavSections;
    }

    // If user is only a contractor, show contractor-specific navigation
    if (roles.length === 1 && roles[0] === 'contractor') {
      return contractorNavSections;
    }

    // Filter sections based on user roles
    return navSections
      .map(section => {
        // Filter items within the section
        const filteredItems = section.items.filter(item => {
          // If no allowedRoles defined, item is visible to all authenticated users
          if (!item.allowedRoles) return true;
          // Check if user has any of the allowed roles
          return hasAnyRole(item.allowedRoles);
        });

        // Return section with filtered items
        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter(section => section.items.length > 0); // Remove empty sections
  }, [roles, hasAnyRole, rolesLoading]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <Link
        to={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          !isActive && "group-hover:scale-110"
        )} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-center border-b border-sidebar-border px-2 shrink-0",
        collapsed ? "h-14" : "h-20"
      )}>
        <img
          src="/logo.png"
          alt="CDF Smart Hub"
          className={cn(
            "object-contain",
            collapsed ? "h-10 w-10" : "h-16 w-auto"
          )}
        />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-2">
          {filteredNavSections.map((section, index) => (
            <div key={section.title}>
              {index > 0 && <Separator className="my-2 bg-sidebar-border" />}
              <div className="space-y-0.5">
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
