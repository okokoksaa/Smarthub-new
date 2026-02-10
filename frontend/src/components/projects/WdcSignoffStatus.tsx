import { useState } from 'react';
import { format } from 'date-fns';
import { useCanSubmitProject } from '@/hooks/useWdcSignoff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Users,
  Calendar,
  ExternalLink,
  Home,
} from 'lucide-react';
import { WdcSignoffForm } from './WdcSignoffForm';

interface WdcSignoffStatusProps {
  projectId: string;
  projectName: string;
  wardId?: string;
  showDetails?: boolean;
  onSignoffComplete?: () => void;
}

export function WdcSignoffStatus({
  projectId,
  projectName,
  wardId,
  showDetails = false,
}: WdcSignoffStatusProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { canSubmit, blockedReasons, signoff, isLoading } = useCanSubmitProject(projectId);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!showDetails) {
    // Compact view for lists
    return (
      <>
        <div className="flex items-center gap-2">
          {canSubmit ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              WDC Approved
            </Badge>
          ) : signoff ? (
            <Badge variant="warning" className="gap-1 cursor-pointer" onClick={() => setFormOpen(true)}>
              <AlertTriangle className="h-3 w-3" />
              WDC Pending
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 cursor-pointer" onClick={() => setFormOpen(true)}>
              <XCircle className="h-3 w-3" />
              No WDC Record
            </Badge>
          )}
        </div>
        
        <WdcSignoffForm
          open={formOpen}
          onOpenChange={setFormOpen}
          projectId={projectId}
          projectName={projectName}
          wardId={wardId}
        />
      </>
    );
  }

  // Detailed view
  return (
    <>
      <Card className={canSubmit ? 'border-success/20' : 'border-warning/20'}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                canSubmit ? 'bg-success/10' : 'bg-warning/10'
              }`}>
                <FileCheck className={`h-5 w-5 ${canSubmit ? 'text-success' : 'text-warning'}`} />
              </div>
              <div>
                <h4 className="font-medium">WDC Sign-off Status</h4>
                {canSubmit ? (
                  <p className="text-sm text-success">Requirements met - can submit to CDFC</p>
                ) : (
                  <p className="text-sm text-warning">
                    {blockedReasons.join('. ')}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              {signoff ? 'Update' : 'Add Sign-off'}
            </Button>
          </div>

          {signoff && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Meeting Date:</span>
                <span className="font-medium">{format(new Date(signoff.meeting_date), 'PP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Attendees:</span>
                <span className="font-medium">{signoff.attendees_count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Chair:</span>
                <span className="font-medium">{signoff.chair_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Quorum:</span>
                {signoff.quorum_met ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Met
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Met
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Chair Signed:</span>
                {signoff.chair_signed ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    No
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Residency:</span>
                {signoff.residency_threshold_met ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Verified
                  </Badge>
                )}
              </div>
              {signoff.residents_count !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Residents:</span>
                  <span className="font-medium">
                    {signoff.residents_count} / {(signoff.residents_count || 0) + (signoff.non_residents_count || 0)}
                  </span>
                </div>
              )}
              {signoff.meeting_minutes_url && (
                <div className="flex items-center gap-2">
                  <a
                    href={signoff.meeting_minutes_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View Minutes
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <WdcSignoffForm
        open={formOpen}
        onOpenChange={setFormOpen}
        projectId={projectId}
        projectName={projectName}
        wardId={wardId}
      />
    </>
  );
}
