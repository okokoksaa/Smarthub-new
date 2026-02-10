import { useState } from 'react';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Calendar,
  FileText,
  CreditCard,
  AlertCircle,
  School,
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
import { useBursaryApplications } from '@/hooks/useBursaryApplications';
import { format } from 'date-fns';

export default function BursaryManagement() {
  const [activeTab, setActiveTab] = useState('applications');
  const { data: applications, isLoading, error } = useBursaryApplications();

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; label: string }> = {
      submitted: { variant: 'info', label: 'Submitted' },
      shortlisted: { variant: 'warning', label: 'Shortlisted' },
      approved: { variant: 'success', label: 'Approved' },
      disbursed: { variant: 'success', label: 'Disbursed' },
      rejected: { variant: 'destructive', label: 'Rejected' },
      withdrawn: { variant: 'secondary', label: 'Withdrawn' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryBadge = (institutionType: string) => {
    const colors: Record<string, 'default' | 'info' | 'warning' | 'secondary'> = {
      primary: 'secondary',
      secondary: 'default',
      tertiary: 'info',
      skills: 'warning',
    };
    return <Badge variant={colors[institutionType] || 'secondary'}>{institutionType.toUpperCase()}</Badge>;
  };

  const totalApplications = applications?.length || 0;
  const approvedCount = applications?.filter(a => ['approved', 'disbursed'].includes(a.status)).length || 0;
  const pendingCount = applications?.filter(a => ['submitted', 'shortlisted'].includes(a.status)).length || 0;
  const totalRequested = applications?.reduce((sum, a) => sum + Number(a.total_requested), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
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
            <p>Failed to load bursary applications. Please try again.</p>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bursary Management</h1>
            <p className="text-muted-foreground">
              Term-by-term bursaries with 5 working-day payment SLA
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/40" />
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
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalRequested)}</p>
                <p className="text-sm text-muted-foreground">Total Requested</p>
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Application & Eligibility</CardTitle>
                  <CardDescription>Residency ≥6 months required; youth bands for skills training</CardDescription>
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
              {applications && applications.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.student_name}</p>
                            <p className="text-sm text-muted-foreground font-mono">{app.application_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryBadge(app.institution_type)}</TableCell>
                        <TableCell>{app.institution_name}</TableCell>
                        <TableCell>{(app as any).wards?.name || 'N/A'}</TableCell>
                        <TableCell>{formatCurrency(Number(app.total_requested))}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {app.academic_year}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
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
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bursary applications found.</p>
                  <Button className="mt-4">Create First Application</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-info/20 bg-info/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <School className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-info">Eligibility Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    Applicants must have resided in the constituency for at least 6 months. 
                    Skills training bursaries have youth band requirements (18-35 years). 
                    All applications require a valid admission letter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payments & Term Verification</CardTitle>
                  <CardDescription>5 working-day payment SLA after approval with enrolment verification</CardDescription>
                </div>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payments
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending payments.</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment SLA Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Payment Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment insert is blocked unless status = approved and admission letter exists. 
                    SLA chip shows due soon/overdue status. Payments must be processed within 5 working days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
