import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Filter,
  Clock,
  CheckCircle2,
  TrendingUp,
  Wallet,
  FolderKanban,
  Plus,
} from 'lucide-react';

const reportTypes = [
  {
    id: 'budget-utilization',
    name: 'Budget Utilization Report',
    description: 'Comprehensive budget vs. expenditure analysis by constituency',
    category: 'Financial',
    frequency: 'Monthly',
    lastGenerated: '2024-02-20',
  },
  {
    id: 'project-status',
    name: 'Project Status Summary',
    description: 'Overview of all projects by status, sector, and completion rate',
    category: 'Operations',
    frequency: 'Weekly',
    lastGenerated: '2024-02-19',
  },
  {
    id: 'payment-reconciliation',
    name: 'Payment Reconciliation Report',
    description: 'Bank reconciliation status and discrepancy analysis',
    category: 'Financial',
    frequency: 'Daily',
    lastGenerated: '2024-02-20',
  },
  {
    id: 'cdfc-performance',
    name: 'CDFC Performance Report',
    description: 'Committee meeting attendance, quorum compliance, and decision metrics',
    category: 'Governance',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-31',
  },
  {
    id: 'compliance-audit',
    name: 'Compliance Audit Report',
    description: 'ZPPA compliance, document verification, and regulatory adherence',
    category: 'Compliance',
    frequency: 'Quarterly',
    lastGenerated: '2024-01-31',
  },
  {
    id: 'ai-analytics',
    name: 'AI Analytics Summary',
    description: 'Anomaly detection results, risk scores, and flagged transactions',
    category: 'AI/ML',
    frequency: 'Weekly',
    lastGenerated: '2024-02-18',
  },
];

const recentReports = [
  {
    id: 1,
    name: 'Q4 2023 Expenditure Return - Kabwata',
    type: 'Quarterly Return',
    generatedBy: 'Finance Officer',
    date: '2024-01-15',
    status: 'submitted',
    size: '2.4 MB',
  },
  {
    id: 2,
    name: 'February 2024 Budget Utilization - Lusaka Province',
    type: 'Budget Report',
    generatedBy: 'PLGO',
    date: '2024-02-20',
    status: 'draft',
    size: '4.1 MB',
  },
  {
    id: 3,
    name: 'TAC Appraisal Summary - Week 7',
    type: 'Operations Report',
    generatedBy: 'TAC Chair',
    date: '2024-02-19',
    status: 'approved',
    size: '1.8 MB',
  },
];

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredReports = reportTypes.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate, view, and export CDF performance reports
            </p>
          </div>
        </div>
        <Button className="group shadow-lg shadow-primary/25">
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Create Custom Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports Generated</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Submissions</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">12</div>
            <p className="text-sm text-muted-foreground">Quarterly returns due</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">94%</div>
            <p className="text-sm text-muted-foreground">On-time submissions</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Exports</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
              <Download className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">89</div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group hover:shadow-md transition-all bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                <Wallet className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Disbursed (2024)</p>
                <p className="text-3xl font-bold">K1.8B</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all bg-gradient-to-br from-success/5 to-transparent border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 transition-transform group-hover:scale-110">
                <FolderKanban className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects Completed</p>
                <p className="text-3xl font-bold text-success">187</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10 transition-transform group-hover:scale-110">
                <TrendingUp className="h-7 w-7 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Project Duration</p>
                <p className="text-3xl font-bold">4.2 months</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Financial">Financial</SelectItem>
            <SelectItem value="Operations">Operations</SelectItem>
            <SelectItem value="Governance">Governance</SelectItem>
            <SelectItem value="Compliance">Compliance</SelectItem>
            <SelectItem value="AI/ML">AI/ML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>
            Standard report templates for CDF monitoring and compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map((report) => (
              <Card key={report.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline">{report.category}</Badge>
                    <Badge variant="secondary">{report.frequency}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{report.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Last: {report.lastGenerated}
                    </span>
                    <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Download className="mr-2 h-3 w-3" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports and exports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report) => (
                <TableRow key={report.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      {report.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.type}</Badge>
                  </TableCell>
                  <TableCell>{report.generatedBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {report.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.status === 'approved' && (
                      <Badge variant="success">Approved</Badge>
                    )}
                    {report.status === 'submitted' && (
                      <Badge variant="info">Submitted</Badge>
                    )}
                    {report.status === 'draft' && (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.size}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
