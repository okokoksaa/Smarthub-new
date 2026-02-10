import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Server,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemMetrics } from '@/hooks/useSystemMetrics';

// Mock scheduled jobs since we don't have a jobs table
const scheduledJobs = [
  { id: 1, name: 'SLA Deadline Checker', schedule: 'Every hour', lastRun: '2024-02-20 14:00', duration: '2.3s', status: 'success', nextRun: '2024-02-20 15:00' },
  { id: 2, name: 'Red Flag Analyzer', schedule: 'Every 6 hours', lastRun: '2024-02-20 12:00', duration: '45.2s', status: 'success', nextRun: '2024-02-20 18:00' },
  { id: 3, name: 'Identity Deduplication', schedule: 'Daily at 02:00', lastRun: '2024-02-20 02:00', duration: '3m 12s', status: 'success', nextRun: '2024-02-21 02:00' },
  { id: 4, name: 'Data Retention Cleanup', schedule: 'Daily at 03:00', lastRun: '2024-02-20 03:00', duration: '1m 45s', status: 'success', nextRun: '2024-02-21 03:00' },
];

const errorBudgets = [
  { service: 'API Gateway', budget: 99.9, current: 99.92, trend: 'stable' },
  { service: 'Database', budget: 99.95, current: 99.98, trend: 'up' },
  { service: 'Auth Service', budget: 99.9, current: 99.85, trend: 'down' },
  { service: 'File Storage', budget: 99.5, current: 99.67, trend: 'stable' },
];

export default function SystemHealth() {
  const { data: metrics, isLoading } = useSystemMetrics();

  // Aggregate metrics from database
  const cpuMetric = metrics?.find(m => m.metric_name === 'cpu_usage');
  const memoryMetric = metrics?.find(m => m.metric_name === 'memory_usage');
  const diskMetric = metrics?.find(m => m.metric_name === 'disk_usage');
  const connectionsMetric = metrics?.find(m => m.metric_name === 'db_connections');

  const systemMetrics = {
    cpu: cpuMetric ? Number(cpuMetric.metric_value) : 42,
    memory: memoryMetric ? Number(memoryMetric.metric_value) : 68,
    disk: diskMetric ? Number(diskMetric.metric_value) : 54,
    connections: connectionsMetric ? Number(connectionsMetric.metric_value) : 156,
    requests: 2345,
    avgLatency: 145,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health & Observability</h1>
          <p className="text-muted-foreground">
            Monitor jobs, performance, and service reliability
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Cpu className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.cpu}%</p>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <MemoryStick className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.memory}%</p>
                <p className="text-sm text-muted-foreground">Memory</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.disk}%</p>
                <p className="text-sm text-muted-foreground">Disk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Database className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.connections}</p>
                <p className="text-sm text-muted-foreground">DB Conns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.requests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Req/hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Timer className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{systemMetrics.avgLatency}ms</p>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">
            <Clock className="mr-2 h-4 w-4" />
            Scheduled Jobs
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <Activity className="mr-2 h-4 w-4" />
            Error Budgets
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Jobs */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Cron Jobs & Background Tasks</CardTitle>
                  <CardDescription>
                    Monitor scheduled job execution and health
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success hover:bg-success/20">
                    {scheduledJobs.filter(j => j.status === 'success').length} Healthy
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledJobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="text-muted-foreground">{job.schedule}</TableCell>
                      <TableCell>{job.lastRun}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Timer className="mr-1 h-3 w-3" />
                          {job.duration}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Success
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{job.nextRun}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Budgets */}
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Level Objectives (SLOs)</CardTitle>
              <CardDescription>
                Error budget consumption for each service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorBudgets.map(service => {
                const isHealthy = service.current >= service.budget;
                
                return (
                  <div key={service.service} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className={`h-5 w-5 ${isHealthy ? 'text-success' : 'text-destructive'}`} />
                        <div>
                          <p className="font-medium">{service.service}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {service.budget}% • Current: {service.current}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {service.trend === 'up' && (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Improving
                          </Badge>
                        )}
                        {service.trend === 'stable' && (
                          <Badge variant="outline">Stable</Badge>
                        )}
                        {service.trend === 'down' && (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                            Degrading
                          </Badge>
                        )}
                        {isHealthy ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Healthy
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                            <XCircle className="mr-1 h-3 w-3" />
                            Breached
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(100, (service.current / 100) * 100)} 
                      className="h-2" 
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
