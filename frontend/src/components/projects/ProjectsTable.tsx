import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, FileText, Bot } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/cdf';
import { cn } from '@/lib/utils';

interface ProjectsTableProps {
  projects: Project[];
}

const statusStyles: Record<ProjectStatus, { label: string; className: string }> = {
  submitted: { label: 'Submitted', className: 'bg-muted text-muted-foreground' },
  cdfc_review: { label: 'CDFC Review', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  cdfc_approved: { label: 'CDFC Approved', className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  tac_appraisal: { label: 'TAC Appraisal', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  plgo_review: { label: 'PLGO Review', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  implementation: { label: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const sectorStyles: Record<string, string> = {
  Health: 'bg-rose-500/10 text-rose-600',
  Education: 'bg-blue-500/10 text-blue-600',
  Infrastructure: 'bg-amber-500/10 text-amber-600',
  'Water & Sanitation': 'bg-cyan-500/10 text-cyan-600',
  Agriculture: 'bg-emerald-500/10 text-emerald-600',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Project</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Constituency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>AI Risk</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="group">
              <TableCell>
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.id}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn('font-normal', sectorStyles[project.sector])}
                >
                  {project.sector}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{project.constituencyName}</p>
                  <p className="text-xs text-muted-foreground">{project.wardName}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('font-normal', statusStyles[project.status].className)}
                >
                  {statusStyles[project.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(project.budget)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.completionPercentage} className="h-2 w-16" />
                  <span className="text-xs text-muted-foreground">
                    {project.completionPercentage}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {project.aiRiskScore !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        project.aiRiskScore >= 50
                          ? 'text-destructive'
                          : project.aiRiskScore >= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      )}
                    >
                      {project.aiRiskScore}
                    </span>
                    {project.aiFlags && project.aiFlags.length > 0 && (
                      <Badge variant="secondary" className="h-5 px-1 text-xs">
                        {project.aiFlags.length}
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bot className="mr-2 h-4 w-4" />
                      AI Analysis
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
