import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  FileText,
  Vote,
  Upload,
  Clock,
} from 'lucide-react';
import { mockAuditEntries } from '@/data/mockData';

const eventTypeIcons: Record<string, React.ReactNode> = {
  PROJECT_APPROVED: <CheckCircle className="h-4 w-4 text-emerald-600" />,
  PAYMENT_SUBMITTED: <FileText className="h-4 w-4 text-primary" />,
  CDFC_VOTE: <Vote className="h-4 w-4 text-blue-600" />,
  DOCUMENT_UPLOADED: <Upload className="h-4 w-4 text-amber-600" />,
};

const roleLabels: Record<string, string> = {
  plgo: 'PLGO',
  finance_officer: 'Finance Officer',
  cdfc_chair: 'CDFC Chair',
  wdc_member: 'WDC Member',
};

export function RecentActivityFeed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Activity</CardTitle>
        <Badge variant="secondary" className="font-normal">
          <Clock className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px] px-6">
          <div className="space-y-4 pb-4">
            {mockAuditEntries.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                    {eventTypeIcons[entry.eventType] || (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {index < mockAuditEntries.length - 1 && (
                    <div className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-border" />
                  )}
                </div>
                <div className="flex-1 space-y-1 pb-4">
                  <p className="text-sm font-medium">{entry.action.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {entry.entity.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      by {entry.actor.name} ({roleLabels[entry.actor.role] || entry.actor.role})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
