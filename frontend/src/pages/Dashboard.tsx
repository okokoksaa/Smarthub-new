import {
  Wallet,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  CreditCard,
  Bot,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectStatusChart } from '@/components/dashboard/ProjectStatusChart';
import { BudgetUtilizationChart } from '@/components/dashboard/BudgetUtilizationChart';
import { AIAdvisoryPanel } from '@/components/dashboard/AIAdvisoryPanel';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { mockDashboardMetrics } from '@/data/mockData';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `K${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `K${(amount / 1000000).toFixed(0)}M`;
  }
  return `K${amount.toLocaleString()}`;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

function MetricCardEnhanced({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  trend,
  variant = 'default',
}: MetricCardProps) {
  const variantStyles = {
    default: '',
    primary: 'border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
    success: 'border-success/20 bg-gradient-to-br from-success/5 to-transparent',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent',
    danger: 'border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent',
  };

  return (
    <Card className={cn('group hover:shadow-lg transition-all duration-300', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110', iconBg)}>
          <div className={iconColor}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {trend && (
            <Badge variant="ghost" className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const metrics = mockDashboardMetrics;
  const utilizationPercentage = Math.round(
    (metrics.disbursedAmount / metrics.totalBudget) * 100
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
          <Wallet className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Constituency Development Fund Overview — Lusaka Province
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardEnhanced
          title="Total Budget (2024)"
          value={formatCurrency(metrics.totalBudget)}
          subtitle={`${utilizationPercentage}% utilized`}
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCardEnhanced
          title="Total Projects"
          value={metrics.projectsTotal.toLocaleString()}
          subtitle={`${metrics.projectsCompleted} completed`}
          icon={<FolderKanban className="h-5 w-5" />}
          iconBg="bg-info/10"
          iconColor="text-info"
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCardEnhanced
          title="Active Constituencies"
          value={metrics.constituenciesActive}
          subtitle="Out of 156 total"
          icon={<MapPin className="h-5 w-5" />}
          iconBg="bg-success/10"
          iconColor="text-success"
          variant="success"
        />
        <MetricCardEnhanced
          title="AI Alerts Today"
          value={metrics.aiAlertsToday}
          subtitle={`${metrics.pendingPayments} payments pending`}
          icon={<Bot className="h-5 w-5" />}
          iconBg={metrics.aiAlertsToday > 10 ? 'bg-warning/10' : 'bg-muted'}
          iconColor={metrics.aiAlertsToday > 10 ? 'text-warning' : 'text-muted-foreground'}
          variant={metrics.aiAlertsToday > 10 ? 'warning' : 'default'}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.projectsInProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{metrics.projectsPending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{metrics.projectsCompleted}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.pendingPayments}</p>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectStatusChart />
        <BudgetUtilizationChart />
      </div>

      {/* Activity and AI Advisory Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIAdvisoryPanel />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
