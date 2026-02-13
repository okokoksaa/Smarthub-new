import { useMemo, useState } from 'react';
import { Plus, Filter, Download, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { useProjects } from '@/hooks/useProjects';
import type { Project as UiProject } from '@/types/cdf';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const { data: apiProjects = [] } = useProjects();

  const projects: UiProject[] = useMemo(() => apiProjects.map((p: any) => ({
    id: p.project_number || p.id,
    name: p.name,
    description: p.description || '',
    sector: p.project_type ? String(p.project_type).replace('_', ' ') : 'Other',
    constituencyId: 0,
    constituencyName: p.constituency?.name || 'N/A',
    wardId: 0,
    wardName: p.ward?.name || 'N/A',
    status: p.status === 'draft' || p.status === 'cancelled' ? 'submitted' : p.status,
    budget: Number(p.approved_amount || p.estimated_cost || 0),
    disbursed: 0,
    completionPercentage: Number(p.progress_percentage || 0),
    submittedAt: p.submitted_at || p.created_at,
    submittedBy: p.submitter_id || 'system',
    aiRiskScore: undefined,
    aiFlags: [],
    lastUpdated: p.updated_at,
  })) as UiProject[], [apiProjects]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.id.toLowerCase().includes(searchQuery.toLowerCase()) || project.constituencyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || project.sector.toLowerCase() === sectorFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesSector;
  });

  const pendingCount = projects.filter((p) => ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(p.status)).length;
  const activeCount = projects.filter((p) => ['approved', 'implementation'].includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;

  return <div className="space-y-6 animate-in fade-in duration-500">{/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"><FolderKanban className="h-6 w-6 text-primary-foreground" /></div>
          <div><h1 className="text-2xl font-bold tracking-tight">Projects</h1><p className="text-muted-foreground">Manage and track CDF-funded projects across constituencies</p></div>
        </div>
        <div className="flex gap-2"><Button variant="outline" className="group"><Download className="mr-2 h-4 w-4" />Export</Button><Button className="group shadow-lg shadow-primary/25"><Plus className="mr-2 h-4 w-4" />New Application</Button></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Projects</p><p className="text-3xl font-bold">{projects.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Review</p><p className="text-3xl font-bold text-warning">{pendingCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Active</p><p className="text-3xl font-bold text-info">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Completed</p><p className="text-3xl font-bold text-success">{completedCount}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All ({projects.length})</TabsTrigger><TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger><TabsTrigger value="active">Active ({activeCount})</TabsTrigger><TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px] bg-background"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="cdfc_review">CDFC Review</SelectItem><SelectItem value="tac_appraisal">TAC Appraisal</SelectItem><SelectItem value="plgo_review">PLGO Review</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="implementation">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}><SelectTrigger className="w-[140px] bg-background"><SelectValue placeholder="Sector" /></SelectTrigger><SelectContent><SelectItem value="all">All Sectors</SelectItem><SelectItem value="health">Health</SelectItem><SelectItem value="education">Education</SelectItem><SelectItem value="infrastructure">Infrastructure</SelectItem><SelectItem value="water sanitation">Water & Sanitation</SelectItem><SelectItem value="agriculture">Agriculture</SelectItem></SelectContent></Select>
          </div>
        </div>
        <TabsContent value="all"><ProjectsTable projects={filteredProjects} /></TabsContent>
        <TabsContent value="pending"><ProjectsTable projects={filteredProjects.filter((p) => ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(p.status))} /></TabsContent>
        <TabsContent value="active"><ProjectsTable projects={filteredProjects.filter((p) => ['approved', 'implementation'].includes(p.status))} /></TabsContent>
        <TabsContent value="completed"><ProjectsTable projects={filteredProjects.filter((p) => p.status === 'completed')} /></TabsContent>
      </Tabs>
    </div>;
}
