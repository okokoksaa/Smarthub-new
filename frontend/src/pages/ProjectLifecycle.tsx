import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  FileText,
  Milestone,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Upload,
  Plus,
  Filter,
  Search,
  Eye,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Project {
  id: string;
  name: string;
  projectNumber: string;
  constituency: string;
  sector: string;
  budget: number;
  spent: number;
  progress: number;
  status: 'draft' | 'submitted' | 'approved' | 'implementation' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string;
  contractor?: string;
}

interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completionPercentage: number;
  evidenceRequired: string[];
  evidenceSubmitted: number;
}

interface Variation {
  id: string;
  projectId: string;
  projectName: string;
  type: 'scope' | 'time' | 'cost';
  description: string;
  originalValue: number;
  newValue: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
}

const mockProjects: Project[] = [
  { id: '1', name: 'Kanyama Health Post Extension', projectNumber: 'PRJ-2024-001', constituency: 'Kanyama', sector: 'Health', budget: 1250000, spent: 875000, progress: 70, status: 'implementation', startDate: '2024-01-15', endDate: '2024-06-30', contractor: 'ABC Construction Ltd' },
  { id: '2', name: 'Matero Classroom Block', projectNumber: 'PRJ-2024-002', constituency: 'Matero', sector: 'Education', budget: 980000, spent: 0, progress: 0, status: 'approved', startDate: '2024-02-01', endDate: '2024-08-31', contractor: 'XYZ Builders' },
  { id: '3', name: 'Chilenje Market Rehabilitation', projectNumber: 'PRJ-2024-003', constituency: 'Chilenje', sector: 'Community', budget: 650000, spent: 650000, progress: 100, status: 'completed', startDate: '2023-08-01', endDate: '2024-01-15', contractor: 'Build Right Ltd' },
  { id: '4', name: 'Munali Borehole Project', projectNumber: 'PRJ-2024-004', constituency: 'Munali', sector: 'Water', budget: 420000, spent: 168000, progress: 40, status: 'implementation', startDate: '2024-01-01', endDate: '2024-04-30', contractor: 'Water Works Inc' },
  { id: '5', name: 'Kabwata Street Lighting', projectNumber: 'PRJ-2024-005', constituency: 'Kabwata', sector: 'Energy', budget: 380000, spent: 0, progress: 0, status: 'submitted', startDate: '', endDate: '' },
];

const mockMilestones: ProjectMilestone[] = [
  { id: '1', projectId: '1', title: 'Foundation Complete', dueDate: '2024-02-15', status: 'completed', completionPercentage: 100, evidenceRequired: ['Photos', 'Engineer Cert'], evidenceSubmitted: 2 },
  { id: '2', projectId: '1', title: 'Wall Construction', dueDate: '2024-03-30', status: 'in_progress', completionPercentage: 60, evidenceRequired: ['Photos', 'Progress Report'], evidenceSubmitted: 1 },
  { id: '3', projectId: '1', title: 'Roofing Complete', dueDate: '2024-05-15', status: 'pending', completionPercentage: 0, evidenceRequired: ['Photos', 'Engineer Cert', 'Materials List'], evidenceSubmitted: 0 },
  { id: '4', projectId: '1', title: 'Practical Completion', dueDate: '2024-06-30', status: 'pending', completionPercentage: 0, evidenceRequired: ['Completion Certificate', 'Final Photos', 'Handover Document'], evidenceSubmitted: 0 },
];

const mockVariations: Variation[] = [
  { id: '1', projectId: '1', projectName: 'Kanyama Health Post', type: 'cost', description: 'Additional foundation work due to soil conditions', originalValue: 1250000, newValue: 1350000, status: 'approved', requestedDate: '2024-02-10' },
  { id: '2', projectId: '4', projectName: 'Munali Borehole', type: 'time', description: 'Extension due to equipment delays', originalValue: 90, newValue: 120, status: 'pending', requestedDate: '2024-01-20' },
  { id: '3', projectId: '2', projectName: 'Matero Classroom', type: 'scope', description: 'Add additional classroom as per CDFC request', originalValue: 2, newValue: 3, status: 'pending', requestedDate: '2024-01-18' },
];

export default function ProjectLifecycle() {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>('1');
  const navigate = useNavigate();
  const { toast } = useToast();

  const notifyNotReady = (feature: string) => {
    toast({
      title: `${feature} is not implemented yet`,
      description: 'This action is intentionally marked as a pending feature.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'submitted': return <Badge variant="info">Submitted</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'implementation': return <Badge variant="warning">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'on_hold': return <Badge variant="destructive">On Hold</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <FolderKanban className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Lifecycle Management</h1>
            <p className="text-muted-foreground">
              Track projects from proposal to completion with milestones and variations
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/projects?action=new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
              <FolderKanban className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-info">45</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <Clock className="h-8 w-8 text-info/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">89</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">12</p>
                <p className="text-sm text-muted-foreground">Pending Variations</p>
              </div>
              <GitBranch className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">8</p>
                <p className="text-sm text-muted-foreground">Overdue Milestones</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Scope & Artefacts
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Milestone className="h-4 w-4" />
            Milestones & Completion
          </TabsTrigger>
          <TabsTrigger value="variations" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Variations & Extensions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>SoR, designs, approvals, and artefacts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." className="pl-9 w-[250px]" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => notifyNotReady('Project filters')}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{project.projectNumber}</span>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{project.constituency}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.sector}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(project.budget)}</p>
                          <p className="text-sm text-muted-foreground">Spent: {formatCurrency(project.spent)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="h-2 w-20" />
                          <span className="text-sm">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        {project.startDate && (
                          <div className="text-sm">
                            <p>{project.startDate}</p>
                            <p className="text-muted-foreground">to {project.endDate}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project.id);
                            setActiveTab('milestones');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>Track practical completion with required evidence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMilestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Milestone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {milestone.dueDate}
                            </p>
                          </div>
                        </div>
                        {getMilestoneStatusBadge(milestone.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">Completion</span>
                            <Progress value={milestone.completionPercentage} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{milestone.completionPercentage}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Evidence: {milestone.evidenceSubmitted}/{milestone.evidenceRequired.length} submitted
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-4"
                          onClick={() => navigate(`/projects?projectId=${selectedProject ?? milestone.projectId}&action=upload-evidence`)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enforcement Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <h4 className="font-medium text-warning text-sm">Milestone Evidence</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cannot mark milestones complete without required evidence uploaded.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                  <h4 className="font-medium text-info text-sm">Ongoing Coverage</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    New projects blocked if constituency ongoing coverage threshold not met.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variations" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variations & Extensions</CardTitle>
                  <CardDescription>Scope, time, and cost variations requiring approval</CardDescription>
                </div>
                <Button onClick={() => navigate('/project-workflow?action=request-variation')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Variation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>New Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVariations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-medium">{variation.projectName}</TableCell>
                      <TableCell>
                        <Badge variant={variation.type === 'cost' ? 'destructive' : variation.type === 'time' ? 'warning' : 'info'}>
                          {variation.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{variation.description}</TableCell>
                      <TableCell>
                        {variation.type === 'cost' ? formatCurrency(variation.originalValue) : `${variation.originalValue} days`}
                      </TableCell>
                      <TableCell className="font-medium">
                        {variation.type === 'cost' ? formatCurrency(variation.newValue) : `${variation.newValue} days`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variation.status === 'approved' ? 'success' : variation.status === 'rejected' ? 'destructive' : 'warning'}>
                          {variation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/project-workflow?variationId=${variation.id}`)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
