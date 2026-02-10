import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Building2,
  TrendingUp,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';

const complianceMetrics = {
  overallScore: 94,
  zppaCOmpliance: 97,
  documentCompleteness: 91,
  slaAdherence: 88,
  auditReadiness: 96,
};

const complianceIssues = [
  {
    id: 1,
    constituency: 'Kanyama',
    issue: 'Missing ZPPA contractor registration',
    project: 'PROJ-2024-00234',
    severity: 'high',
    deadline: '2024-02-25',
    status: 'pending',
  },
  {
    id: 2,
    constituency: 'Matero',
    issue: 'Incomplete site inspection report',
    project: 'PROJ-2024-00189',
    severity: 'medium',
    deadline: '2024-02-28',
    status: 'pending',
  },
  {
    id: 3,
    constituency: 'Kabwata',
    issue: 'Bank reconciliation overdue by 3 days',
    project: null,
    severity: 'medium',
    deadline: '2024-02-20',
    status: 'overdue',
  },
  {
    id: 4,
    constituency: 'Munali',
    issue: 'CDFC quorum not met for meeting',
    project: null,
    severity: 'low',
    deadline: '2024-02-22',
    status: 'resolved',
  },
];

const constituencyCompliance = [
  { name: 'Kabwata', score: 96, issues: 2, resolved: 15, pending: 2 },
  { name: 'Munali', score: 98, issues: 1, resolved: 18, pending: 1 },
  { name: 'Kanyama', score: 82, issues: 5, resolved: 10, pending: 5 },
  { name: 'Matero', score: 91, issues: 3, resolved: 14, pending: 3 },
];

const quarterlyReturns = [
  { quarter: 'Q4 2023', submitted: 152, total: 156, compliance: 97.4, dueDate: '2024-01-15' },
  { quarter: 'Q3 2023', submitted: 156, total: 156, compliance: 100, dueDate: '2023-10-15' },
  { quarter: 'Q2 2023', submitted: 148, total: 156, compliance: 94.9, dueDate: '2023-07-15' },
];

export default function Compliance() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Regulatory</h1>
          <p className="text-muted-foreground">
            Monitor CDF Act compliance, ZPPA requirements, and audit readiness
          </p>
        </div>
        <Button>
          <FileCheck className="mr-2 h-4 w-4" />
          Run Compliance Check
        </Button>
      </div>

      {/* Overall Compliance Score */}
      <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Compliance Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-success">
                  {complianceMetrics.overallScore}%
                </span>
                <Badge className="bg-success/10 text-success">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +2.3% from last month
                </Badge>
              </div>
            </div>
            <Shield className="h-16 w-16 text-success/30" />
          </div>
        </CardContent>
      </Card>

      {/* Compliance Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ZPPA Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.zppaCOmpliance}%</div>
            <Progress value={complianceMetrics.zppaCOmpliance} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Document Completeness</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceMetrics.documentCompleteness}%</div>
            <Progress value={complianceMetrics.documentCompleteness} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLA Adherence</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {complianceMetrics.slaAdherence}%
            </div>
            <Progress value={complianceMetrics.slaAdherence} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audit Readiness</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {complianceMetrics.auditReadiness}%
            </div>
            <Progress value={complianceMetrics.auditReadiness} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search compliance issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Active Issues</TabsTrigger>
          <TabsTrigger value="constituencies">By Constituency</TabsTrigger>
          <TabsTrigger value="returns">Quarterly Returns</TabsTrigger>
          <TabsTrigger value="checklist">Audit Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>
                Active compliance issues requiring attention or resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {issue.constituency}
                        </div>
                      </TableCell>
                      <TableCell>{issue.issue}</TableCell>
                      <TableCell>
                        {issue.project ? (
                          <Badge variant="outline">{issue.project}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {issue.severity === 'high' && (
                          <Badge variant="destructive">High</Badge>
                        )}
                        {issue.severity === 'medium' && (
                          <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                            Medium
                          </Badge>
                        )}
                        {issue.severity === 'low' && (
                          <Badge variant="secondary">Low</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {issue.deadline}
                        </div>
                      </TableCell>
                      <TableCell>
                        {issue.status === 'resolved' && (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Resolved
                          </Badge>
                        )}
                        {issue.status === 'pending' && (
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                        {issue.status === 'overdue' && (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Overdue
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constituencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Constituency Compliance Scores</CardTitle>
              <CardDescription>
                Compliance performance by constituency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {constituencyCompliance.map((constituency) => (
                  <div key={constituency.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{constituency.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {constituency.resolved} resolved, {constituency.pending} pending
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-2xl font-bold ${
                            constituency.score >= 95
                              ? 'text-success'
                              : constituency.score >= 85
                              ? 'text-warning'
                              : 'text-destructive'
                          }`}
                        >
                          {constituency.score}%
                        </div>
                        {constituency.score >= 95 ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : constituency.score >= 85 ? (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress value={constituency.score} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Expenditure Returns</CardTitle>
              <CardDescription>
                Track submission compliance for quarterly returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Compliance Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterlyReturns.map((qr) => (
                    <TableRow key={qr.quarter}>
                      <TableCell className="font-medium">{qr.quarter}</TableCell>
                      <TableCell>
                        {qr.submitted}/{qr.total} constituencies
                      </TableCell>
                      <TableCell>{qr.dueDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={qr.compliance} className="h-2 w-20" />
                          <span>{qr.compliance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {qr.compliance === 100 ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            {qr.total - qr.submitted} pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Readiness Checklist</CardTitle>
              <CardDescription>
                OAG audit preparation checklist and documentation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { item: 'All project approvals documented', complete: true },
                  { item: 'Payment vouchers with supporting documents', complete: true },
                  { item: 'Bank reconciliation statements (monthly)', complete: true },
                  { item: 'CDFC meeting minutes with attendance', complete: true },
                  { item: 'TAC appraisal reports', complete: true },
                  { item: 'Contractor registration verification', complete: false },
                  { item: 'Site inspection photographs', complete: false },
                  { item: 'Quarterly expenditure returns', complete: true },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <span className="font-medium">{item.item}</span>
                    {item.complete ? (
                      <Badge className="bg-success/10 text-success hover:bg-success/20">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        In Progress
                      </Badge>
                    )}
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
