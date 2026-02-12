import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  TrendingUp,
  Calendar,
  ArrowRight,
  Filter,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  type: 'approval' | 'review' | 'signature' | 'upload' | 'meeting';
  entity: string;
  entityType: string;
  dueDate: string;
  slaStatus: 'ok' | 'due_soon' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Exception {
  id: string;
  title: string;
  description: string;
  blockedBy: string;
  clauseRef: string;
  entity: string;
  fixAction: string;
}

const mockTasks: Task[] = [
  { id: '1', title: 'Approve Payment Request', type: 'approval', entity: 'Chilenje Health Post', entityType: 'Payment', dueDate: '2024-01-15', slaStatus: 'overdue', priority: 'critical' },
  { id: '2', title: 'Sign Committee Minutes', type: 'signature', entity: 'CDFC Meeting 2024-01', entityType: 'Meeting', dueDate: '2024-01-16', slaStatus: 'due_soon', priority: 'high' },
  { id: '3', title: 'Review Project Proposal', type: 'review', entity: 'Kanyama Market Upgrade', entityType: 'Project', dueDate: '2024-01-18', slaStatus: 'ok', priority: 'medium' },
  { id: '4', title: 'Upload Site Visit Report', type: 'upload', entity: 'Matero Clinic Extension', entityType: 'M&E', dueDate: '2024-01-17', slaStatus: 'due_soon', priority: 'high' },
  { id: '5', title: 'Attend TAC Appraisal', type: 'meeting', entity: 'Water Borehole Projects', entityType: 'TAC', dueDate: '2024-01-19', slaStatus: 'ok', priority: 'medium' },
];

const mockExceptions: Exception[] = [
  { id: '1', title: 'Missing WDC Minutes', description: 'Project cannot proceed to CDFC review', blockedBy: 'WDC Chair Signature Required', clauseRef: 'Section 15(2)(a) CDF Act', entity: 'Munali Borehole Project', fixAction: '/ward-intake?action=upload-minutes' },
  { id: '2', title: 'Tax Clearance Expired', description: 'Contractor payment blocked', blockedBy: 'Valid ZRA Certificate Required', clauseRef: 'Section 28(1) CDF Guidelines', entity: 'ABC Construction Ltd', fixAction: '/contractors?action=update-tax' },
  { id: '3', title: 'Incomplete BOQ', description: 'Technical appraisal cannot proceed', blockedBy: 'Bill of Quantities Missing Items', clauseRef: 'TAC Checklist Item 4.2', entity: 'School Rehabilitation', fixAction: '/projects?action=edit-boq' },
];

const constituencyKPIs = {
  ongoingProjects: 45,
  newProjects: 12,
  totalBudget: 2500000000,
  committed: 1800000000,
  spent: 1200000000,
  available: 700000000,
};

export default function SmartDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');
  const navigate = useNavigate();
  const { toast } = useToast();

  const notifyNotReady = (feature: string) => {
    toast({
      title: `${feature} is not implemented yet`,
      description: 'This control is intentionally disabled to avoid no-op actions.',
    });
  };

  const handleTaskAction = (task: Task) => {
    const routeMap: Record<Task['type'], string> = {
      approval: '/payments',
      signature: '/tac',
      review: '/projects',
      upload: '/monitoring',
      meeting: '/tac',
    };

    navigate(`${routeMap[task.type]}?taskId=${task.id}`);
  };

  const handleExceptionAction = (exception: Exception) => {
    if (exception.fixAction.startsWith('/contractors')) {
      navigate(`/procurement${exception.fixAction.slice('/contractors'.length)}`);
      return;
    }

    navigate(exception.fixAction);
  };

  const getSlaColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'destructive';
      case 'due_soon': return 'warning';
      default: return 'success';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `K${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `K${(amount / 1000000).toFixed(0)}M`;
    return `K${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Smart Dashboard</h1>
            <p className="text-muted-foreground">
              Your task-first view — what needs attention today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => notifyNotReady('Advanced dashboard filtering')}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="relative" onClick={() => notifyNotReady('Notification center')}>
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">3</span>
          </Button>
        </div>
      </div>

      {/* SLA Heatmap Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-destructive">3</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-warning">7</p>
                <p className="text-sm text-muted-foreground">Due Soon</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-success">12</p>
                <p className="text-sm text-muted-foreground">On Track</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Exceptions</p>
              </div>
              <FileWarning className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Tasks/Exceptions Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tasks" className="gap-2">
                <Clock className="h-4 w-4" />
                My Tasks
                <Badge variant="secondary" className="ml-1">22</Badge>
              </TabsTrigger>
              <TabsTrigger value="exceptions" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Exceptions
                <Badge variant="destructive" className="ml-1">5</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-3">
              {mockTasks.map((task) => (
                <Card key={task.id} className={cn('hover:shadow-md transition-all cursor-pointer', getPriorityColor(task.priority))}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSlaColor(task.slaStatus)} className="text-xs">
                            {task.slaStatus === 'overdue' ? 'OVERDUE' : task.slaStatus === 'due_soon' ? 'DUE SOON' : 'ON TRACK'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{task.entityType}</Badge>
                        </div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.entity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate}
                        </p>
                        <Button variant="ghost" size="sm" className="mt-1" onClick={() => handleTaskAction(task)}>
                          Action <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="exceptions" className="space-y-3">
              {mockExceptions.map((exception) => (
                <Card key={exception.id} className="border-destructive/20 hover:shadow-md transition-all">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <h4 className="font-medium text-destructive">{exception.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{exception.description}</p>
                        <p className="text-sm"><strong>Entity:</strong> {exception.entity}</p>
                        <p className="text-sm"><strong>Blocked by:</strong> {exception.blockedBy}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Ref:</strong> {exception.clauseRef}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0" onClick={() => handleExceptionAction(exception)}>
                        Fix Now <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Constituency KPIs */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Constituency KPIs
              </CardTitle>
              <CardDescription>Kanyama Constituency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Project Mix</span>
                  <span className="font-medium">{constituencyKPIs.ongoingProjects} ongoing / {constituencyKPIs.newProjects} new</span>
                </div>
                <Progress value={(constituencyKPIs.ongoingProjects / (constituencyKPIs.ongoingProjects + constituencyKPIs.newProjects)) * 100} className="h-2" />
              </div>

              <div className="pt-2 border-t space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="font-medium">{formatCurrency(constituencyKPIs.totalBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Committed</span>
                  <span className="font-medium text-info">{formatCurrency(constituencyKPIs.committed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Spent</span>
                  <span className="font-medium text-success">{formatCurrency(constituencyKPIs.spent)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Available</span>
                  <span className="font-bold text-primary">{formatCurrency(constituencyKPIs.available)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Budget Utilization</span>
                  <span className="font-medium">{Math.round((constituencyKPIs.spent / constituencyKPIs.totalBudget) * 100)}%</span>
                </div>
                <Progress value={(constituencyKPIs.spent / constituencyKPIs.totalBudget) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/projects?action=new')}>
                New Project
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/payments?action=new')}>
                New Payment
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/ward-intake?tab=meetings')}>
                Schedule Meeting
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate('/monitoring?action=upload')}>
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
