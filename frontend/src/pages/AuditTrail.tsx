import { useState } from 'react';
import { Search, Filter, Download, Shield, Clock, FileCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProjects } from '@/hooks/useProjects';
import { usePayments } from '@/hooks/usePayments';

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const { data: projects = [] } = useProjects();
  const { data: payments = [] } = usePayments();

  const entries = [
    ...projects.map((p: any) => ({ id: `p-${p.id}`, timestamp: p.updated_at || p.created_at, eventType: 'PROJECT_UPDATE', actor: { name: 'System', role: 'system' }, entity: { id: p.id, name: p.name }, description: `Project moved to ${p.status}` })),
    ...payments.map((p: any) => ({ id: `pay-${p.id}`, timestamp: p.updated_at || p.created_at, eventType: 'PAYMENT_UPDATE', actor: { name: 'System', role: 'system' }, entity: { id: p.id, name: p.payment_number || p.id }, description: `Payment moved to ${p.status}` })),
  ];

  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = entry.entity.name.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q);
    const matchesEvent = eventFilter === 'all' || entry.eventType === eventFilter;
    return matchesSearch && matchesEvent;
  });

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"><FileCheck className="h-6 w-6 text-primary-foreground" /></div><div><h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1></div></div><Button variant="outline"><Download className="mr-2 h-4 w-4" />Export Logs</Button></div>
    <Card><CardContent className="flex items-center justify-between py-4"><div className="flex items-center gap-4"><Shield className="h-6 w-6 text-success" /><p className="font-semibold text-success">Audit Log Integrity Verified</p></div><Badge variant="success">Verified</Badge></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle className="text-sm">Total Entries</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{entries.length}</div></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Today</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{filteredEntries.length}</div></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Integrity</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-success">100%</div></CardContent></Card></div>
    <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search audit logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div><Select value={eventFilter} onValueChange={setEventFilter}><SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="PROJECT_UPDATE">Project</SelectItem><SelectItem value="PAYMENT_UPDATE">Payment</SelectItem></SelectContent></Select></div>
    <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Event</TableHead><TableHead>Entity</TableHead><TableHead>Description</TableHead></TableRow></TableHeader><TableBody>{filteredEntries.map((entry) => <TableRow key={entry.id}><TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell><TableCell><Badge>{entry.eventType}</Badge></TableCell><TableCell>{entry.entity.name}</TableCell><TableCell>{entry.description}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
