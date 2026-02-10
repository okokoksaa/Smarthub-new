import { useState } from 'react';
import { Plus, Filter, Download, Search, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { mockProjects } from '@/data/mockData';

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.constituencyName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || project.sector === sectorFilter;

    return matchesSearch && matchesStatus && matchesSector;
  });

  const pendingCount = mockProjects.filter(
    (p) => ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(p.status)
  ).length;
  const activeCount = mockProjects.filter(
    (p) => ['approved', 'implementation'].includes(p.status)
  ).length;
  const completedCount = mockProjects.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <FolderKanban className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track CDF-funded projects across constituencies
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="group">
            <Download className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Export
          </Button>
          <Button className="group shadow-lg shadow-primary/25">
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
            New Application
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold">{mockProjects.length}</p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">All</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold text-warning">{pendingCount}</p>
              </div>
              <Badge variant="warning" className="text-lg px-3 py-1">{Math.round(pendingCount / mockProjects.length * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-info">{activeCount}</p>
              </div>
              <Badge variant="info" className="text-lg px-3 py-1">{Math.round(activeCount / mockProjects.length * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">{completedCount}</p>
              </div>
              <Badge variant="success" className="text-lg px-3 py-1">{Math.round(completedCount / mockProjects.length * 100)}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">
              All Projects ({mockProjects.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-background">
              Pending Review ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-background">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-background">
              Completed ({completedCount})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="cdfc_review">CDFC Review</SelectItem>
                <SelectItem value="tac_appraisal">TAC Appraisal</SelectItem>
                <SelectItem value="plgo_review">PLGO Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="implementation">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Water & Sanitation">Water & Sanitation</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <ProjectsTable projects={filteredProjects} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <ProjectsTable
            projects={filteredProjects.filter((p) =>
              ['submitted', 'cdfc_review', 'tac_appraisal', 'plgo_review'].includes(p.status)
            )}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <ProjectsTable
            projects={filteredProjects.filter((p) =>
              ['approved', 'implementation'].includes(p.status)
            )}
          />
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <ProjectsTable
            projects={filteredProjects.filter((p) => p.status === 'completed')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
