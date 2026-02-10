import { Check, Circle, Clock, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, ProjectStatus } from '@/hooks/useProjectWorkflow';

interface ProjectWorkflowStatusProps {
  currentStatus: ProjectStatus;
  showFullWorkflow?: boolean;
}

const WORKFLOW_ORDER: ProjectStatus[] = [
  'draft',
  'submitted',
  'cdfc_review',
  'tac_appraisal',
  'plgo_review',
  'approved',
  'implementation',
  'completed',
];

const getStatusIndex = (status: ProjectStatus): number => {
  if (status === 'rejected' || status === 'cancelled') return -1;
  return WORKFLOW_ORDER.indexOf(status);
};

export function ProjectWorkflowStatus({ 
  currentStatus, 
  showFullWorkflow = true 
}: ProjectWorkflowStatusProps) {
  const currentIndex = getStatusIndex(currentStatus);
  const isTerminal = currentStatus === 'rejected' || currentStatus === 'cancelled';

  if (!showFullWorkflow) {
    return (
      <div className="flex items-center gap-2">
        <StatusIcon status={currentStatus} isActive />
        <span className="font-medium">{STATUS_LABELS[currentStatus]}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Workflow Progress Bar */}
      <div className="flex items-center justify-between">
        {WORKFLOW_ORDER.map((status, index) => {
          const isPast = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isFuture = currentIndex < index;
          const isLast = index === WORKFLOW_ORDER.length - 1;

          return (
            <div key={status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                    isPast && "bg-success border-success text-success-foreground",
                    isCurrent && !isTerminal && "bg-primary border-primary text-primary-foreground animate-pulse",
                    isCurrent && isTerminal && "bg-destructive border-destructive text-destructive-foreground",
                    isFuture && "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isPast ? (
                    <Check className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1 text-center whitespace-nowrap",
                    isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    isPast ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Status Indicator */}
      {isTerminal && (
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg",
          currentStatus === 'rejected' && "bg-destructive/10 border border-destructive/20",
          currentStatus === 'cancelled' && "bg-muted border border-border"
        )}>
          <X className={cn(
            "h-5 w-5",
            currentStatus === 'rejected' ? "text-destructive" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium",
            currentStatus === 'rejected' ? "text-destructive" : "text-muted-foreground"
          )}>
            Project {currentStatus === 'rejected' ? 'Rejected' : 'Cancelled'}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status, isActive }: { status: ProjectStatus; isActive: boolean }) {
  const baseClasses = "h-5 w-5";
  
  switch (status) {
    case 'completed':
      return <Check className={cn(baseClasses, "text-success")} />;
    case 'rejected':
    case 'cancelled':
      return <X className={cn(baseClasses, "text-destructive")} />;
    case 'implementation':
      return <Clock className={cn(baseClasses, isActive ? "text-warning" : "text-muted-foreground")} />;
    default:
      return <Circle className={cn(baseClasses, isActive ? "text-primary fill-primary" : "text-muted-foreground")} />;
  }
}
