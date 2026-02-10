import { useState } from 'react';
import {
  GitPullRequest,
  Filter,
  Search,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectWorkflowCard } from '@/components/projects/ProjectWorkflowCard';
import { ProjectSubmissionForm } from '@/components/projects/ProjectSubmissionForm';
import { useProjects } from '@/hooks/useProjects';
import { useUserRoles } from '@/hooks/useUserRoles';
import { ProjectStatus, STATUS_LABELS, WORKFLOW_TRANSITIONS } from '@/hooks/useProjectWorkflow';
import { Skeleton } from '@/components/ui/skeleton';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const PENDING_STATUSES: ProjectStatus[] = ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'];
const APPROVED_STATUSES: ProjectStatus[] = ['approved', 'implementation', 'completed'];
const REJECTED_STATUSES: ProjectStatus[] = ['rejected', 'cancelled'];

export default function ProjectWorkflow() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const { data: projects, isLoading, refetch } = useProjects();
  const { roles, hasAnyRole } = useUserRoles();

  // Filter projects based on tab and search
  const filteredProjects = projects?.filter((project) => {
    const status = project.status as ProjectStatus;
    
    // Tab filter
    if (activeTab === 'pending' && !PENDING_STATUSES.includes(status)) return false;
    if (activeTab === 'approved' && !APPROVED_STATUSES.includes(status)) return false;
    if (activeTab === 'rejected' && !REJECTED_STATUSES.includes(status)) return false;

    // Status filter
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.project_number.toLowerCase().includes(query) ||
        project.constituency?.name?.toLowerCase().includes(query) ||
        project.sector.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: projects?.length || 0,
    pending: projects?.filter(p => PENDING_STATUSES.includes(p.status as ProjectStatus)).length || 0,
    approved: projects?.filter(p => APPROVED_STATUSES.includes(p.status as ProjectStatus)).length || 0,
    rejected: projects?.filter(p => REJECTED_STATUSES.includes(p.status as ProjectStatus)).length || 0,
  };

  // Get projects that require user action
  const actionableProjects = projects?.filter((project) => {
    const status = project.status as ProjectStatus;
    const transition = WORKFLOW_TRANSITIONS[status];
    if (!transition || transition.next.length === 0) return false;
    return hasAnyRole(transition.roles);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <GitPullRequest className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Workflow</h1>
            <p className="text-muted-foreground">
              Review and approve projects through the approval workflow
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSubmissionForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Project Submission Form */}
      <ProjectSubmissionForm
        open={showSubmissionForm}
        onOpenChange={setShowSubmissionForm}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved/Active</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
                <p className="text-sm text-muted-foreground">Rejected/Cancelled</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Required Alert */}
      {actionableProjects && actionableProjects.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-primary" />
              <p className="text-sm">
                <span className="font-semibold">{actionableProjects.length} project(s)</span> require your action
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              All
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              <Badge variant="secondary" className="ml-1">{stats.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Approved
              <Badge variant="secondary" className="ml-1">{stats.approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              Rejected
              <Badge variant="secondary" className="ml-1">{stats.rejected}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-[300px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <ProjectWorkflowCard
                  key={project.id}
                  project={project}
                  onStatusChange={() => refetch()}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-medium">No projects found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No projects match the current criteria'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
