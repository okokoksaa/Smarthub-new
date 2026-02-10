import { useState } from 'react';
import {
  Users,
  HandCoins,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  Building,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useEmpowermentGrants } from '@/hooks/useEmpowermentGrants';
import { format } from 'date-fns';

export default function EmpowermentGrants() {
  const [activeTab, setActiveTab] = useState('applications');
  const { data: grants, isLoading, error } = useEmpowermentGrants();

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; label: string }> = {
      submitted: { variant: 'info', label: 'Submitted' },
      under_review: { variant: 'warning', label: 'Under Review' },
      approved: { variant: 'success', label: 'Approved' },
      disbursed: { variant: 'success', label: 'Disbursed' },
      completed: { variant: 'success', label: 'Completed' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalGrants = grants?.length || 0;
  const approvedCount = grants?.filter(a => ['approved', 'disbursed', 'completed'].includes(a.status)).length || 0;
  const disbursedAmount = grants?.filter(a => a.status === 'disbursed').reduce((sum, a) => sum + Number(a.approved_amount || 0), 0) || 0;
  const pendingCount = grants?.filter(a => ['submitted', 'under_review'].includes(a.status)).length || 0;

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
            <p>Failed to load empowerment grants. Please try again.</p>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
            <HandCoins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Empowerment Grants & Loans</h1>
            <p className="text-muted-foreground">
              Grant/loan pipeline with de-duplication and training gates
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalGrants}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
              <HandCoins className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-info">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
              <Clock className="h-8 w-8 text-info/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{formatCurrency(disbursedAmount)}</p>
                <p className="text-sm text-muted-foreground">Disbursed</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success/40" />
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications" className="gap-2">
            <Users className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Training Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eligibility & Group Size Checks</CardTitle>
                  <CardDescription>Grants require ≥10 members; loans require financial literacy training</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search applications..." className="pl-9 w-[250px]" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {grants && grants.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant / Group</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grants.map((grant) => (
                      <TableRow key={grant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{grant.group_name || grant.applicant_name}</p>
                            <p className="text-sm text-muted-foreground">{grant.grant_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{grant.grant_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{grant.group_size || 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(grant.requested_amount))}</TableCell>
                        <TableCell>{(grant as any).wards?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(grant.submitted_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(grant.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No grant applications found.</p>
                  <Button className="mt-4">Create First Application</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Disbursement Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Disbursements are disabled until training attendance is recorded and identity 
                    de-dupe passes (NRC + name fuzzy match). Groups with flagged members must 
                    resolve duplicates before proceeding.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Training Sessions</CardTitle>
                  <CardDescription>Loans require financial literacy training before disbursement</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Training
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No training sessions scheduled.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
