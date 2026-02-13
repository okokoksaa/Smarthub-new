import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, FileText, Clock } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { usePayments } from '@/hooks/usePayments';

export function RecentActivityFeed() {
  const { data: projects = [] } = useProjects();
  const { data: payments = [] } = usePayments();

  const activities = [
    ...projects.slice(0, 5).map((p: any) => ({ id: p.id, type: 'project', title: p.name, action: `Project ${p.status}`, ts: p.updated_at || p.created_at })),
    ...payments.slice(0, 5).map((p: any) => ({ id: p.id, type: 'payment', title: p.payment_number || p.id, action: `Payment ${p.status}`, ts: p.updated_at || p.created_at })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 8);

  return <Card>
    <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Recent Activity</CardTitle><Badge variant="secondary" className="font-normal"><Clock className="mr-1 h-3 w-3" />Live</Badge></CardHeader>
    <CardContent className="p-0"><ScrollArea className="h-[340px] px-6"><div className="space-y-4 pb-4">{activities.map((entry, index) => <div key={`${entry.type}-${entry.id}`} className="flex gap-3"><div className="relative"><div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">{entry.type === 'project' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-primary" />}</div>{index < activities.length - 1 && <div className="absolute left-1/2 top-8 h-full w-px -translate-x-1/2 bg-border" />}</div><div className="flex-1 space-y-1 pb-4"><p className="text-sm font-medium">{entry.action}</p><Badge variant="outline" className="text-xs font-normal">{entry.title}</Badge><p className="text-xs text-muted-foreground">{new Date(entry.ts).toLocaleString()}</p></div></div>)}</div></ScrollArea></CardContent>
  </Card>;
}
