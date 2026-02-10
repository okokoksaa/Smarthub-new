import { useState } from 'react';
import { 
  ArrowRight, 
  Check, 
  X, 
  Send, 
  FileCheck, 
  Play,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useProjectWorkflow, 
  ProjectStatus, 
  STATUS_LABELS 
} from '@/hooks/useProjectWorkflow';
import { useCanSubmitProject } from '@/hooks/useWdcSignoff';
import { cn } from '@/lib/utils';

interface ProjectApprovalActionsProps {
  projectId: string;
  currentStatus: ProjectStatus;
  projectName: string;
  wardId?: string;
  onStatusChange?: () => void;
  onWdcSignoffRequired?: () => void;
}

const getActionIcon = (to: ProjectStatus) => {
  switch (to) {
    case 'submitted':
      return Send;
    case 'approved':
      return Check;
    case 'rejected':
    case 'cancelled':
      return X;
    case 'implementation':
      return Play;
    case 'completed':
      return FileCheck;
    default:
      return ArrowRight;
  }
};

const getActionVariant = (to: ProjectStatus): "default" | "destructive" | "outline" | "secondary" => {
  switch (to) {
    case 'approved':
    case 'completed':
      return 'default';
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function ProjectApprovalActions({ 
  projectId, 
  currentStatus, 
  projectName,
  wardId,
  onStatusChange,
  onWdcSignoffRequired 
}: ProjectApprovalActionsProps) {
  const [selectedTransition, setSelectedTransition] = useState<ProjectStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { 
    canTransition, 
    getAvailableTransitions, 
    getTransitionLabel, 
    updateStatus,
    isUpdating 
  } = useProjectWorkflow();

  // Check WDC sign-off requirement for draft->submitted transition
  const { canSubmit: hasWdcSignoff, blockedReasons } = useCanSubmitProject(
    currentStatus === 'draft' ? projectId : undefined
  );

  const availableTransitions = getAvailableTransitions(currentStatus);
  const canMakeTransition = canTransition(currentStatus);

  // For draft status, check if WDC sign-off is required for submission
  const needsWdcSignoff = currentStatus === 'draft' && !hasWdcSignoff;

  if (!canMakeTransition || availableTransitions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No actions available
      </div>
    );
  }

  const handleTransitionClick = (to: ProjectStatus) => {
    // Block submission if WDC sign-off is not complete
    if (currentStatus === 'draft' && to === 'submitted' && !hasWdcSignoff) {
      onWdcSignoffRequired?.();
      return;
    }
    
    setSelectedTransition(to);
    setNotes('');
    setDialogOpen(true);
  };

  const handleConfirmTransition = () => {
    if (!selectedTransition) return;

    updateStatus(
      { 
        projectId, 
        newStatus: selectedTransition, 
        notes: notes || undefined 
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setSelectedTransition(null);
          setNotes('');
          onStatusChange?.();
        },
      }
    );
  };

  const isRejectAction = selectedTransition === 'rejected' || selectedTransition === 'cancelled';

  return (
    <>
      {/* WDC Sign-off Warning */}
      {needsWdcSignoff && (
        <Alert className="mb-3 border-warning/20 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            <strong>WDC Sign-off Required:</strong> {blockedReasons.join('. ')}
            <br />
            <span className="text-xs text-muted-foreground">
              Per Section 15(2)(a) CDF Act, projects cannot be submitted without WDC approval.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((to) => {
          const Icon = getActionIcon(to);
          const variant = getActionVariant(to);
          const label = getTransitionLabel(currentStatus, to);
          const isBlocked = currentStatus === 'draft' && to === 'submitted' && needsWdcSignoff;

          return (
            <Button
              key={to}
              variant={isBlocked ? 'outline' : variant}
              size="sm"
              onClick={() => handleTransitionClick(to)}
              disabled={isUpdating}
              className={isBlocked ? 'opacity-60' : undefined}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
              {isBlocked && ' (WDC Required)'}
            </Button>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isRejectAction && <AlertTriangle className="h-5 w-5 text-destructive" />}
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              You are about to change the status of <strong>{projectName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status Change Preview */}
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted">
              <Badge variant="secondary">{STATUS_LABELS[currentStatus]}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge 
                variant={isRejectAction ? 'destructive' : 'default'}
                className={cn(
                  !isRejectAction && "bg-success hover:bg-success/90"
                )}
              >
                {selectedTransition && STATUS_LABELS[selectedTransition]}
              </Badge>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {isRejectAction ? 'Reason for rejection (required)' : 'Notes (optional)'}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  isRejectAction 
                    ? "Please provide the reason for rejection..." 
                    : "Add any notes about this decision..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Warning for rejection */}
            {isRejectAction && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  This action will reject the project. The submitter will be notified and may revise and resubmit.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant={isRejectAction ? 'destructive' : 'default'}
              onClick={handleConfirmTransition}
              disabled={isUpdating || (isRejectAction && !notes.trim())}
            >
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
