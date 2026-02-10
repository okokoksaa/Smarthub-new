import { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  RefreshCw,
  ArrowLeftRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useExpenditureReturns } from '@/hooks/useExpenditureReturns';
import { format } from 'date-fns';

export default function ExpenditureReturns() {
  const [activeTab, setActiveTab] = useState('returns');
  const { data: returns, isLoading, error } = useExpenditureReturns();

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'info', label: 'Submitted' },
      under_review: { variant: 'warning', label: 'Under Review' },
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      revision_required: { variant: 'warning', label: 'Revision Required' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const submittedCount = returns?.filter(r => r.status !== 'draft').length || 0;
  const approvedCount = returns?.filter(r => r.status === 'approved').length || 0;
  const underReviewCount = returns?.filter(r => r.status === 'under_review').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load expenditure returns. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
            <FileSpreadsheet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expenditure Returns & Reconciliations</h1>
            <p className="text-muted-foreground">
              Quarterly financial discipline: cashbook, bank statement, reconciliation
            </p>
          </div>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{submittedCount}</p>
                <p className="text-sm text-muted-foreground">Returns Submitted</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{underReviewCount}</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{returns?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Returns</p>
              </div>
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="returns" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Quarterly Returns
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Bank Reconciliation
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <Upload className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="returns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Uploads & Review</CardTitle>
              <CardDescription>Submit quarterly expenditure returns with supporting documents</CardDescription>
            </CardHeader>
            <CardContent>
              {returns && returns.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {returns.map((ret) => (
                    <Card key={ret.id} className={ret.status === 'approved' ? 'border-success/20' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold">Q{ret.quarter} {ret.fiscal_year}</h4>
                            {getStatusBadge(ret.status)}
                          </div>
                          {ret.status === 'draft' ? (
                            <Button size="sm">Prepare Return</Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Received</p>
                              <p className="font-medium">{formatCurrency(Number(ret.total_received))}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Spent</p>
                              <p className="font-medium">{formatCurrency(Number(ret.total_spent))}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground">Balance</p>
                              <p className={`font-medium ${Number(ret.balance) < 0 ? 'text-destructive' : 'text-success'}`}>
                                {formatCurrency(Number(ret.balance))}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Period</p>
                              <p className="font-medium text-sm">
                                {format(new Date(ret.period_start), 'MMM d')} - {format(new Date(ret.period_end), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {ret.submitted_at && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground pt-2">
                              <Calendar className="h-3 w-3" />
                              Submitted: {format(new Date(ret.submitted_at), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expenditure returns found.</p>
                  <Button className="mt-4">Create First Return</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-destructive/20 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-destructive">Disbursement Blocking</h4>
                  <p className="text-sm text-muted-foreground">
                    Q&gt;1 disbursements are blocked until the prior quarter's return exists and is 
                    optionally reviewed/approved. This ensures proper financial accountability.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank CSV Import & Auto-Match</CardTitle>
                  <CardDescription>Automatic matching with manual exception queue</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run Auto-Match
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bank reconciliation data will appear here once bank statements are imported.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>Cashbooks, bank statements, and supporting documents</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded yet.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
