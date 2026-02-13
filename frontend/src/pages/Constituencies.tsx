import { useState } from 'react';
import { Search, MapPin, TrendingUp, Wallet, FolderKanban, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProjects } from '@/hooks/useProjects';
import { useConstituencies } from '@/hooks/useGeographyData';

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `K${(amount / 1000000).toFixed(1)}M`;
  }
  return `K${(amount / 1000).toFixed(0)}K`;
}

export default function Constituencies() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: constituencies = [] } = useConstituencies();
  const { data: projects = [] } = useProjects();

  const constituenciesWithStats = constituencies.map((constituency: any, idx: number) => {
    const constituencyProjects = projects.filter((p: any) => p.constituency_id === constituency.id);
    const completedProjects = constituencyProjects.filter((p: any) => p.status === 'completed').length;
    const allocatedBudget = Number(constituency.allocated_budget || constituency.total_budget || 0);
    const utilizedBudget = Number(constituency.disbursed_budget || 0);
    const utilizationRate = allocatedBudget > 0 ? Math.round((utilizedBudget / allocatedBudget) * 100) : 0;

    return {
      id: constituency.id,
      name: constituency.name,
      mpName: `Constituency ${idx + 1}`,
      allocatedBudget,
      utilizedBudget,
      projectCount: constituencyProjects.length,
      completedProjects,
      utilizationRate,
    };
  });

  const filteredConstituencies = constituenciesWithStats.filter((constituency) =>
    constituency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    constituency.mpName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBudget = constituenciesWithStats.reduce((sum, c) => sum + c.allocatedBudget, 0);
  const totalProjects = constituenciesWithStats.reduce((sum, c) => sum + c.projectCount, 0);
  const avgUtilization = Math.round(
    constituenciesWithStats.reduce((sum, c) => sum + c.utilizationRate, 0) / constituenciesWithStats.length
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Constituencies</h1>
            <p className="text-muted-foreground">
              Monitor CDF allocation and utilization across constituencies
            </p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search constituencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Constituencies</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-muted-foreground">Nationwide</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Allocated</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
              <Wallet className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">K2.5B</div>
            <p className="text-sm text-muted-foreground">{formatCurrency(totalBudget)} shown</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Utilization</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{avgUtilization}%</div>
            <Progress value={avgUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <FolderKanban className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-sm text-muted-foreground">In shown constituencies</p>
          </CardContent>
        </Card>
      </div>

      {/* Constituencies Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredConstituencies.map((constituency) => (
          <Card key={constituency.id} className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{constituency.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{constituency.mpName}</p>
                  </div>
                </div>
                <Badge
                  variant={constituency.utilizationRate >= 80 ? 'success' : constituency.utilizationRate >= 50 ? 'warning' : 'secondary'}
                  className="shrink-0 text-sm font-bold"
                >
                  {constituency.utilizationRate}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Utilization</span>
                  <span className="font-medium">
                    {formatCurrency(constituency.utilizedBudget)} / {formatCurrency(constituency.allocatedBudget)}
                  </span>
                </div>
                <Progress 
                  value={constituency.utilizationRate} 
                  className={cn(
                    "h-2",
                    constituency.utilizationRate >= 80 ? "[&>div]:bg-success" : 
                    constituency.utilizationRate >= 50 ? "[&>div]:bg-warning" : ""
                  )} 
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{constituency.projectCount}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-2xl font-bold text-success">{constituency.completedProjects}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-lg font-bold">+12%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
