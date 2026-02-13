import { useMemo, useState } from 'react';
import { Filter, Download, Search, AlertTriangle, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { usePayments } from '@/hooks/usePayments';
import type { Payment as UiPayment } from '@/types/cdf';

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: apiPayments = [] } = usePayments();

  const payments: UiPayment[] = useMemo(() => apiPayments.map((p: any) => ({
    id: p.payment_number || p.id,
    projectId: p.project_id,
    projectName: p.project?.name || 'Unknown Project',
    amount: Number(p.amount || 0),
    status: p.status === 'submitted' ? 'pending' : p.status === 'finance_review' ? 'panel_a_review' : p.status === 'panel_a_pending' ? 'panel_a_review' : p.status === 'panel_b_pending' ? 'panel_b_review' : p.status,
    contractorName: p.beneficiary_name || 'Unknown',
    milestone: p.milestone || 'N/A',
    requestedAt: p.created_at,
    aiRiskScore: p.ai_risk_score,
    aiFlags: p.ai_flags || [],
  })) as UiPayment[], [apiPayments]);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.projectName.toLowerCase().includes(searchQuery.toLowerCase()) || payment.id.toLowerCase().includes(searchQuery.toLowerCase()) || payment.contractorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = payments.filter((p) => ['pending', 'panel_a_review', 'panel_b_review', 'authorized'].includes(p.status)).length;
  const flaggedCount = payments.filter((p) => (p.aiRiskScore || 0) >= 50).length;
  const executedCount = payments.filter((p) => p.status === 'executed').length;
  const totalPendingAmount = payments.filter((p) => p.status !== 'executed' && p.status !== 'rejected').reduce((sum, p) => sum + p.amount, 0);

  return <div className="space-y-6 animate-in fade-in duration-500">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg"><CreditCard className="h-6 w-6 text-primary-foreground" /></div><div><h1 className="text-2xl font-bold tracking-tight">Payments</h1></div></div><Button variant="outline" className="group"><Download className="mr-2 h-4 w-4" />Export Report</Button></div>

    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Pending Approval</CardTitle><Clock className="h-5 w-5 text-warning" /></CardHeader><CardContent><div className="text-3xl font-bold">{pendingCount}</div><p className="text-sm text-muted-foreground">K{(totalPendingAmount / 1000).toFixed(0)}K</p></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">AI Flagged</CardTitle><AlertTriangle className="h-5 w-5 text-destructive" /></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{flaggedCount}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Executed</CardTitle><CheckCircle2 className="h-5 w-5 text-success" /></CardHeader><CardContent><div className="text-3xl font-bold text-success">{executedCount}</div></CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Total Payments</CardTitle><CreditCard className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold">{payments.length}</div></CardContent></Card>
    </div>

    <Tabs defaultValue="all" className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="bg-muted/50"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger><TabsTrigger value="flagged">Flagged ({flaggedCount})</TabsTrigger><TabsTrigger value="executed">Executed</TabsTrigger></TabsList>
        <div className="flex gap-2"><div className="relative w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search payments..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-background" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px] bg-background"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="panel_a_review">Panel A Review</SelectItem><SelectItem value="panel_b_review">Panel B Review</SelectItem><SelectItem value="authorized">Authorized</SelectItem><SelectItem value="executed">Executed</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
      </div>
      <TabsContent value="all"><PaymentsTable payments={filteredPayments} /></TabsContent>
      <TabsContent value="pending"><PaymentsTable payments={filteredPayments.filter((p) => ['pending', 'panel_a_review', 'panel_b_review', 'authorized'].includes(p.status))} /></TabsContent>
      <TabsContent value="flagged"><PaymentsTable payments={filteredPayments.filter((p) => (p.aiRiskScore || 0) >= 50)} /></TabsContent>
      <TabsContent value="executed"><PaymentsTable payments={filteredPayments.filter((p) => p.status === 'executed')} /></TabsContent>
    </Tabs>
  </div>;
}
