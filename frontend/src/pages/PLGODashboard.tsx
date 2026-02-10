import { useState } from 'react';
import {
  Building2,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck,
  Send,
  ExternalLink,
  Calendar,
  Filter,
  Search,
  RotateCcw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Submission {
  id: string;
  constituency: string;
  title: string;
  type: 'project_list' | 'payment_batch' | 'quarterly_return';
  submittedDate: string;
  dueDate: string;
  slaStatus: 'ok' | 'due_soon' | 'overdue';
  amount?: number;
  itemCount: number;
  status: 'pending' | 'approved' | 'approved_conditions' | 'rejected' | 'returned';
}

interface Publication {
  id: string;
  title: string;
  type: 'gazette' | 'notice' | 'report';
  publishedDate: string;
  url: string;
  checksum: string;
  downloads: number;
}

const mockSubmissions: Submission[] = [
  { id: '1', constituency: 'Kanyama', title: 'Q1 Project List 2024', type: 'project_list', submittedDate: '2024-01-08', dueDate: '2024-01-22', slaStatus: 'ok', itemCount: 12, status: 'pending' },
  { id: '2', constituency: 'Matero', title: 'Payment Batch #045', type: 'payment_batch', submittedDate: '2024-01-05', dueDate: '2024-01-19', slaStatus: 'due_soon', amount: 2500000, itemCount: 8, status: 'pending' },
  { id: '3', constituency: 'Chilenje', title: 'Q4 2023 Expenditure Return', type: 'quarterly_return', submittedDate: '2024-01-02', dueDate: '2024-01-16', slaStatus: 'overdue', amount: 8500000, itemCount: 1, status: 'pending' },
  { id: '4', constituency: 'Munali', title: 'Q1 Project List 2024', type: 'project_list', submittedDate: '2024-01-10', dueDate: '2024-01-24', slaStatus: 'ok', itemCount: 9, status: 'approved' },
  { id: '5', constituency: 'Kabwata', title: 'Payment Batch #044', type: 'payment_batch', submittedDate: '2024-01-03', dueDate: '2024-01-17', slaStatus: 'due_soon', amount: 1800000, itemCount: 5, status: 'approved_conditions' },
];

const mockPublications: Publication[] = [
  { id: '1', title: 'Approved Project List - Kanyama Q1 2024', type: 'gazette', publishedDate: '2024-01-14', url: '/publications/kanyama-q1-2024.pdf', checksum: 'sha256:a1b2c3...', downloads: 45 },
  { id: '2', title: 'Provincial CDF Utilization Report - Q4 2023', type: 'report', publishedDate: '2024-01-10', url: '/publications/province-q4-2023.pdf', checksum: 'sha256:d4e5f6...', downloads: 128 },
  { id: '3', title: 'Public Notice - Tender Awards December 2023', type: 'notice', publishedDate: '2024-01-05', url: '/publications/tender-awards-dec-2023.pdf', checksum: 'sha256:g7h8i9...', downloads: 89 },
];

export default function PLGODashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

  const getSlaChip = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
      case 'due_soon': return <Badge variant="warning">Due Soon</Badge>;
      default: return <Badge variant="success">On Track</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'approved_conditions': return <Badge variant="info">Approved with Conditions</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'returned': return <Badge variant="warning">Returned</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'project_list': return <Badge variant="default">Project List</Badge>;
      case 'payment_batch': return <Badge variant="info">Payment Batch</Badge>;
      case 'quarterly_return': return <Badge variant="warning">Quarterly Return</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const pendingCount = mockSubmissions.filter(s => s.status === 'pending').length;
  const overdueCount = mockSubmissions.filter(s => s.slaStatus === 'overdue').length;
  const dueSoonCount = mockSubmissions.filter(s => s.slaStatus === 'due_soon').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">PLGO Dashboard</h1>
            <p className="text-muted-foreground">
              Approve/return constituency submissions within 14 working days
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Lusaka Province
        </Badge>
      </div>

      {/* SLA Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">Overdue (SLA Breach)</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{dueSoonCount}</p>
                <p className="text-sm text-muted-foreground">Due Soon (≤3 days)</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">47</p>
                <p className="text-sm text-muted-foreground">Processed This Month</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Inbox & SLA Chips
            {pendingCount > 0 && <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="publications" className="gap-2">
            <Send className="h-4 w-4" />
            Publication Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Constituency Submissions</CardTitle>
                  <CardDescription>Review and approve within 14 working days SLA</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search submissions..." className="pl-9 w-[250px]" />
                  </div>
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
                    <TableHead>Submission</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Items/Amount</TableHead>
                    <TableHead>SLA Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSubmissions.map((submission) => (
                    <TableRow key={submission.id} className={submission.slaStatus === 'overdue' ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.title}</p>
                          <p className="text-sm text-muted-foreground">Submitted: {submission.submittedDate}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(submission.type)}</TableCell>
                      <TableCell className="font-medium">{submission.constituency}</TableCell>
                      <TableCell>
                        {submission.amount ? formatCurrency(submission.amount) : `${submission.itemCount} items`}
                      </TableCell>
                      <TableCell>{getSlaChip(submission.slaStatus)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {submission.dueDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.status === 'pending' ? (
                          <Dialog open={isDecisionModalOpen && selectedSubmission?.id === submission.id} onOpenChange={setIsDecisionModalOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setSelectedSubmission(submission)}>
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Review Submission</DialogTitle>
                                <DialogDescription>
                                  {submission.title} from {submission.constituency}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Decision</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="border-success text-success hover:bg-success/10">
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button variant="outline" className="border-info text-info hover:bg-info/10">
                                      <FileCheck className="h-4 w-4 mr-2" />
                                      Approve with Conditions
                                    </Button>
                                    <Button variant="outline" className="border-warning text-warning hover:bg-warning/10">
                                      <RotateCcw className="h-4 w-4 mr-2" />
                                      Return
                                    </Button>
                                    <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Comments/Conditions</Label>
                                  <Textarea placeholder="Enter your decision comments or conditions..." />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDecisionModalOpen(false)}>Cancel</Button>
                                <Button onClick={() => setIsDecisionModalOpen(false)}>Submit Decision</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-info/20 bg-info/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-info">SLA & Deemed Approval</h4>
                  <p className="text-sm text-muted-foreground">
                    Due dates are auto-computed by the working-days engine (excluding public holidays). 
                    Optional "deemed approval" feature can be enabled per tenant configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Publication Log</CardTitle>
                  <CardDescription>Published gazettes, notices, and reports with checksums</CardDescription>
                </div>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Publish New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPublications.map((pub) => (
                  <div key={pub.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileCheck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{pub.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{pub.publishedDate}</span>
                          <span>•</span>
                          <code className="text-xs bg-muted px-1 rounded">{pub.checksum}</code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={pub.type === 'gazette' ? 'default' : pub.type === 'notice' ? 'warning' : 'info'}>
                        {pub.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{pub.downloads} downloads</span>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
