import { useState } from 'react';
import {
  Briefcase,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Calendar,
  BarChart3,
  Globe,
  Filter,
  Search,
  Eye,
  Send,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMinistryDashboard,
  useCAPRCycles,
  useMinisterialInbox,
  useGazettePublications,
  useApproveMinisterialItem,
  useRejectMinisterialItem,
  type CAPRCycle,
  type MinisterialItem,
  type GazettePublication,
} from '@/hooks/useMinistry';

export default function MinistryDashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  const { data: dashboardSummary, isLoading: dashboardLoading } = useMinistryDashboard();
  const { data: caprCycles = [], isLoading: caprLoading } = useCAPRCycles();
  const { data: inboxItems = [], isLoading: inboxLoading } = useMinisterialInbox();
  const { data: gazettes = [], isLoading: gazettesLoading } = useGazettePublications();

  // Mutations
  const approveMutation = useApproveMinisterialItem();
  const rejectMutation = useRejectMinisterialItem();

  const handleApprove = (itemId: string) => {
    approveMutation.mutate({ itemId });
  };

  const handleReject = (itemId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectMutation.mutate({ itemId, reason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">Pending</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'deferred': return <Badge variant="secondary">Deferred</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive">Urgent</Badge>;
      case 'high': return <Badge variant="warning">High</Badge>;
      default: return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getCAPRStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      case 'due_soon': return <Badge variant="warning">Due Soon</Badge>;
      default: return <Badge variant="success">On Track</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ministry (MLGRD/HQ) Dashboard</h1>
            <p className="text-muted-foreground">
              National approvals for constituency project lists and CAPR oversight
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          National Level
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{dashboardSummary?.pending_approvals || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-warning">{dashboardSummary?.urgent_items || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Urgent Items</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-destructive">{dashboardSummary?.capr_overdue || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">CAPR Overdue</p>
              </div>
              <Clock className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {dashboardLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-success">
                    {dashboardSummary?.provinces_published || 0}/{dashboardSummary?.total_provinces || 10}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">Provinces Published</p>
              </div>
              <Globe className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Minister Inbox
          </TabsTrigger>
          <TabsTrigger value="gazette" className="gap-2">
            <Globe className="h-4 w-4" />
            Gazette/Portal Publication
          </TabsTrigger>
          <TabsTrigger value="capr" className="gap-2">
            <Calendar className="h-4 w-4" />
            CAPR Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Minister's Inbox</CardTitle>
                  <CardDescription>National-level decisions and approvals</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search..." className="w-[200px]" />
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inboxLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : inboxItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No pending items
                      </TableCell>
                    </TableRow>
                  ) : (
                    inboxItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">Submitted: {item.submitted_date}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.province}</TableCell>
                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{item.due_date}</TableCell>
                        <TableCell>
                          {item.status === 'pending' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(item.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(item.id)}
                                disabled={rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm">View</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gazette" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gazette/Public Portal Publication Log</CardTitle>
                  <CardDescription>Track publication status by province</CardDescription>
                </div>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Publish to Portal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gazettesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : gazettes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No gazette publications</p>
                ) : (
                  gazettes.map((gazette) => (
                    <div key={gazette.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileCheck className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{gazette.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {gazette.status === 'published' ? `Published: ${gazette.published_date}` : `${gazette.approved_projects_count} approved projects awaiting publication`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={gazette.status === 'published' ? 'success' : gazette.status === 'pending' ? 'warning' : 'secondary'}>
                          {gazette.status === 'published' ? 'Published' : gazette.status === 'pending' ? 'Pending' : 'Draft'}
                        </Badge>
                        {gazette.status === 'published' && gazette.url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={gazette.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                        ) : gazette.status === 'pending' ? (
                          <Button size="sm">Publish</Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capr" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CAPR Tracker (90-Day Rule)</CardTitle>
              <CardDescription>Track Constituency Annual Project Review cycles - due 90 days from first sitting</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>First Sitting</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Artifacts</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {caprLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : caprCycles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No CAPR cycles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    caprCycles.map((cycle) => (
                      <TableRow key={cycle.id} className={cycle.status === 'overdue' ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{cycle.constituency_name}</TableCell>
                        <TableCell>{cycle.province_name}</TableCell>
                        <TableCell>{cycle.first_sitting_date}</TableCell>
                        <TableCell>
                          <div>
                            <p>{cycle.due_date}</p>
                            <p className={`text-xs ${cycle.days_remaining < 0 ? 'text-destructive' : cycle.days_remaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {cycle.days_remaining < 0 ? `${Math.abs(cycle.days_remaining)} days overdue` : `${cycle.days_remaining} days remaining`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getCAPRStatusBadge(cycle.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(cycle.artifacts.filter(a => a.submitted).length / cycle.artifacts.length) * 100}
                              className="h-2 w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              {cycle.artifacts.filter(a => a.submitted).length}/{cycle.artifacts.length}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* CAPR Enforcement */}
          <Card className="mt-4 border-info/20 bg-info/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-info">CAPR Enforcement</h4>
                  <p className="text-sm text-muted-foreground">
                    Disbursement gates can require Minister approval. CAPR cycles show due soon/overdue status clearly, 
                    computed as 90 days from first committee sitting date.
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
