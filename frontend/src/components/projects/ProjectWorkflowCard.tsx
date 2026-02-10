import { useState } from 'react';
import { 
  Clock, 
  User, 
  Calendar, 
  Building, 
  MapPin,
  DollarSign,
  Users,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProjectWorkflowStatus } from './ProjectWorkflowStatus';
import { ProjectApprovalActions } from './ProjectApprovalActions';
import { WdcSignoffStatus } from './WdcSignoffStatus';
import { WdcSignoffForm } from './WdcSignoffForm';
import { ProjectStatus, STATUS_LABELS } from '@/hooks/useProjectWorkflow';
import { Project } from '@/hooks/useProjects';
import { format } from 'date-fns';
import ProjectDocumentsManager from '@/components/documents/ProjectDocumentsManager';

interface ProjectWorkflowCardProps {
  project: Project;
  onStatusChange?: () => void;
}

const getSectorColor = (sector: string): string => {
  const colors: Record<string, string> = {
    education: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    health: 'bg-red-500/10 text-red-500 border-red-500/20',
    water: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    roads: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    agriculture: 'bg-green-500/10 text-green-500 border-green-500/20',
    community: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    energy: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    governance: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[sector] || colors.other;
};

const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

export function ProjectWorkflowCard({ project, onStatusChange }: ProjectWorkflowCardProps) {
  const status = project.status as ProjectStatus;
  const [wdcFormOpen, setWdcFormOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant="outline" className={getSectorColor(project.sector)}>
                {project.sector.charAt(0).toUpperCase() + project.sector.slice(1)}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-3">
              <span className="font-mono text-xs">{project.project_number}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.constituency?.name || 'Unknown'}
              </span>
              {project.ward && (
                <>
                  <span>•</span>
                  <span>{project.ward.name} Ward</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge 
            variant={
              status === 'completed' ? 'default' : 
              status === 'rejected' || status === 'cancelled' ? 'destructive' : 
              'secondary'
            }
            className={status === 'completed' ? 'bg-success' : undefined}
          >
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-medium">{formatCurrency(project.budget)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Spent</p>
              <p className="font-medium">{formatCurrency(project.spent)}</p>
            </div>
          </div>
          {project.beneficiaries && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Beneficiaries</p>
                <p className="font-medium">{project.beneficiaries.toLocaleString()}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Progress</p>
              <p className="font-medium">{project.progress}%</p>
            </div>
          </div>
        </div>

        {/* Timeline Info */}
        {(project.submitted_at || project.approved_at || project.start_date) && (
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {project.submitted_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Submitted: {format(new Date(project.submitted_at), 'MMM d, yyyy')}
              </div>
            )}
            {project.approved_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Approved: {format(new Date(project.approved_at), 'MMM d, yyyy')}
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Start: {format(new Date(project.start_date), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Workflow Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Workflow Progress</h4>
          <ProjectWorkflowStatus currentStatus={status} showFullWorkflow />
        </div>

        {/* WDC Sign-off Status - Show for draft projects */}
        {status === 'draft' && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">WDC Sign-off</h4>
              <WdcSignoffStatus
                projectId={project.id}
                projectName={project.name}
                wardId={project.ward_id || undefined}
                showDetails
              />
            </div>
          </>
        )}

        <Separator />

        {/* Approval Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Available Actions</h4>
          <ProjectApprovalActions
            projectId={project.id}
            currentStatus={status}
            projectName={project.name}
            wardId={project.ward_id || undefined}
            onStatusChange={onStatusChange}
            onWdcSignoffRequired={() => setWdcFormOpen(true)}
          />
        </div>

        <Separator />

        {/* Compliance & Evidence Section */}
        <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium">Compliance & Evidence</h4>
              </div>
              {documentsOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <ProjectDocumentsManager
              projectId={project.id}
              constituencyId={project.constituency_id}
              wardId={project.ward_id || undefined}
              readOnly={status === 'completed' || status === 'cancelled'}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* WDC Sign-off Form Dialog */}
      <WdcSignoffForm
        open={wdcFormOpen}
        onOpenChange={setWdcFormOpen}
        projectId={project.id}
        projectName={project.name}
        wardId={project.ward_id || undefined}
      />
    </Card>
  );
}
