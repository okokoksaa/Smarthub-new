import { useState } from 'react';
import { Filter, Download, Search, AlertTriangle, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsTable } from '@/components/payments/PaymentsTable';
import { mockPayments } from '@/data/mockData';

export default function Payments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch =
      payment.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.contractorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = mockPayments.filter(
    (p) => ['pending', 'panel_a_review', 'panel_b_review', 'authorized'].includes(p.status)
  ).length;
  const flaggedCount = mockPayments.filter(
    (p) => p.aiRiskScore !== undefined && p.aiRiskScore >= 50
  ).length;
  const executedCount = mockPayments.filter((p) => p.status === 'executed').length;

  const totalPendingAmount = mockPayments
    .filter((p) => p.status !== 'executed' && p.status !== 'rejected')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <CreditCard className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="text-muted-foreground">
              Review and authorize payment vouchers for approved projects
            </p>
          </div>
        </div>
        <Button variant="outline" className="group">
          <Download className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">
              Total value: K{(totalPendingAmount / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className={`group hover:shadow-md transition-all ${flaggedCount > 0 ? 'border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AI Flagged
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 transition-transform group-hover:scale-110">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-destructive">{flaggedCount}</span>
              <Badge variant="destructive" className="text-xs">
                Requires Review
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              High-risk transactions detected
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Executed This Month
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{executedCount}</div>
            <p className="text-sm text-muted-foreground">
              K250K processed
            </p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockPayments.length}</div>
            <p className="text-sm text-muted-foreground">
              All time records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">All Payments</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-background">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="text-destructive data-[state=active]:bg-background">
              Flagged ({flaggedCount})
            </TabsTrigger>
            <TabsTrigger value="executed" className="data-[state=active]:bg-background">Executed</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="panel_a_review">Panel A Review</SelectItem>
                <SelectItem value="panel_b_review">Panel B Review</SelectItem>
                <SelectItem value="authorized">Authorized</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <PaymentsTable payments={filteredPayments} />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PaymentsTable
            payments={filteredPayments.filter((p) =>
              ['pending', 'panel_a_review', 'panel_b_review', 'authorized'].includes(p.status)
            )}
          />
        </TabsContent>
        <TabsContent value="flagged" className="mt-4">
          <PaymentsTable
            payments={filteredPayments.filter(
              (p) => p.aiRiskScore !== undefined && p.aiRiskScore >= 50
            )}
          />
        </TabsContent>
        <TabsContent value="executed" className="mt-4">
          <PaymentsTable
            payments={filteredPayments.filter((p) => p.status === 'executed')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
