import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Activity, 
  DollarSign, 
  FolderKanban, 
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Eye
} from 'lucide-react';
import { 
  useConstituencyAnalytics, 
  useNationalMetrics, 
  useTopRiskyConstituencies,
  ConstituencyAnalytics 
} from '@/hooks/useConstituencyAnalytics';
import { cn } from '@/lib/utils';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `K${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `K${(amount / 1000).toFixed(0)}K`;
  }
  return `K${amount.toFixed(0)}`;
}

function getThreatLevelConfig(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high':
      return {
        label: 'HIGH THREAT',
        icon: ShieldAlert,
        className: 'bg-destructive text-destructive-foreground animate-pulse',
        description: 'Multiple constituencies showing high-risk patterns',
      };
    case 'medium':
      return {
        label: 'ELEVATED',
        icon: AlertTriangle,
        className: 'bg-yellow-500 text-yellow-950',
        description: 'Some constituencies require attention',
      };
    default:
      return {
        label: 'NORMAL',
        icon: ShieldCheck,
        className: 'bg-green-500 text-green-950',
        description: 'All systems operating within normal parameters',
      };
  }
}

function getRiskColor(riskIndex: number): string {
  if (riskIndex > 50) return 'bg-destructive';
  if (riskIndex > 20) return 'bg-yellow-500';
  return 'bg-green-500';
}

function ConstituencyGrid({ analytics }: { analytics: ConstituencyAnalytics[] }) {
  const [hoveredConstituency, setHoveredConstituency] = useState<ConstituencyAnalytics | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          National Risk Heatmap
        </CardTitle>
        <CardDescription>
          Real-time risk visualization across all 156 constituencies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-500" />
            <span className="text-muted-foreground">Low Risk (&lt;20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-500" />
            <span className="text-muted-foreground">Medium (20-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-destructive" />
            <span className="text-muted-foreground">High Risk (&gt;50)</span>
          </div>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-13 gap-1">
            {analytics.map((constituency) => (
              <Tooltip key={constituency.constituency_id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-8 w-8 rounded cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10',
                      getRiskColor(constituency.risk_index),
                      constituency.critical_alerts > 0 && 'ring-2 ring-destructive ring-offset-2 ring-offset-background'
                    )}
                    onMouseEnter={() => setHoveredConstituency(constituency)}
                    onMouseLeave={() => setHoveredConstituency(null)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{constituency.constituency_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {constituency.district_name}, {constituency.province_name}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Risk Index:</span>
                      <span className={cn(
                        'font-medium',
                        constituency.risk_index > 50 ? 'text-destructive' : 
                        constituency.risk_index > 20 ? 'text-yellow-600' : 'text-green-600'
                      )}>
                        {constituency.risk_index}%
                      </span>
                      <span className="text-muted-foreground">Critical Alerts:</span>
                      <span className={constituency.critical_alerts > 0 ? 'text-destructive font-medium' : ''}>
                        {constituency.critical_alerts}
                      </span>
                      <span className="text-muted-foreground">Absorption Rate:</span>
                      <span>{constituency.absorption_rate}%</span>
                      <span className="text-muted-foreground">Active Projects:</span>
                      <span>{constituency.active_projects}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        {hoveredConstituency && (
          <div className="mt-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{hoveredConstituency.constituency_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {hoveredConstituency.district_name}, {hoveredConstituency.province_name}
                </p>
              </div>
              <Badge variant={hoveredConstituency.risk_index > 50 ? 'destructive' : 'secondary'}>
                Risk Score: {hoveredConstituency.risk_index}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WatchlistTable() {
  const { data: topRisky, isLoading } = useTopRiskyConstituencies(5);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          The Watchlist - Top 5 Riskiest Constituencies
        </CardTitle>
        <CardDescription>
          Constituencies requiring immediate attention based on AI risk analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Constituency</TableHead>
              <TableHead>Province</TableHead>
              <TableHead className="text-center">Critical Alerts</TableHead>
              <TableHead className="text-center">Risk Index</TableHead>
              <TableHead className="text-center">Pending Payments</TableHead>
              <TableHead className="text-right">Budget at Risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topRisky.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No high-risk constituencies detected
                </TableCell>
              </TableRow>
            ) : (
              topRisky.map((constituency, index) => (
                <TableRow key={constituency.constituency_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                        {index + 1}
                      </span>
                      {constituency.constituency_name}
                    </div>
                  </TableCell>
                  <TableCell>{constituency.province_name || '-'}</TableCell>
                  <TableCell className="text-center">
                    {constituency.critical_alerts > 0 ? (
                      <Badge variant="destructive" className="animate-pulse">
                        {constituency.critical_alerts} Alert{constituency.critical_alerts > 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={constituency.risk_index > 50 ? 'destructive' : 'secondary'}
                    >
                      {constituency.risk_index}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {constituency.pending_payments}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(constituency.total_budget_allocated)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function NationalCommandCenter() {
  const { data: analytics, isLoading: analyticsLoading } = useConstituencyAnalytics();
  const { data: metrics, isLoading: metricsLoading } = useNationalMetrics();

  const isLoading = analyticsLoading || metricsLoading;

  const threatConfig = metrics ? getThreatLevelConfig(metrics.threatLevel) : getThreatLevelConfig('low');
  const ThreatIcon = threatConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Command Center</h1>
          <p className="text-muted-foreground">
            CDF Performance Monitor — Real-Time Analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-pulse text-green-500" />
            Live Data Feed
          </div>
          {metrics && (
            <Badge className={cn('text-sm px-4 py-2', threatConfig.className)}>
              <ThreatIcon className="mr-2 h-4 w-4" />
              System Status: {threatConfig.label}
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">National Absorption</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.nationalAbsorptionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  of allocated budget spent
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursement</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics?.totalDisbursed || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {formatCurrency(metrics?.totalBudget || 0)} budget
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.activeProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  across {metrics?.totalConstituencies || 0} constituencies
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={cn(
          metrics?.threatLevel === 'high' && 'border-destructive bg-destructive/5'
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <ShieldAlert className={cn(
              'h-4 w-4',
              metrics?.totalCriticalAlerts && metrics.totalCriticalAlerts > 0 
                ? 'text-destructive animate-pulse' 
                : 'text-muted-foreground'
            )} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className={cn(
                  'text-2xl font-bold',
                  metrics?.totalCriticalAlerts && metrics.totalCriticalAlerts > 0 && 'text-destructive'
                )}>
                  {metrics?.totalCriticalAlerts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  high-risk transactions flagged
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Heatmap */}
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : analytics && analytics.length > 0 ? (
        <ConstituencyGrid analytics={analytics} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No constituency data available
          </CardContent>
        </Card>
      )}

      {/* Watchlist */}
      <WatchlistTable />
    </div>
  );
}
