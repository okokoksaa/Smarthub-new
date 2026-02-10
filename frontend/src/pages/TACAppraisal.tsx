import { useState } from 'react';
import {
  UserCheck,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Users,
  Plus,
  Filter,
  Search,
  Eye,
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
import { Checkbox } from '@/components/ui/checkbox';

interface Appraisal {
  id: string;
  projectName: string;
  projectNumber: string;
  sector: string;
  budget: number;
  status: 'pending' | 'desk_review' | 'field_review' | 'approved' | 'rejected' | 'revise';
  reviewers: { name: string; completed: boolean }[];
  dueDate: string;
  completeness: number;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
  status: 'pending' | 'passed' | 'failed' | 'na';
}

const mockAppraisals: Appraisal[] = [
  { 
    id: '1', 
    projectName: 'Kanyama Health Post Extension', 
    projectNumber: 'PRJ-2024-001',
    sector: 'Health', 
    budget: 1250000, 
    status: 'field_review',
    reviewers: [
      { name: 'Eng. Mumba', completed: true },
      { name: 'Eng. Phiri', completed: false },
    ],
    dueDate: '2024-01-20',
    completeness: 75,
  },
  { 
    id: '2', 
    projectName: 'Matero Classroom Block', 
    projectNumber: 'PRJ-2024-002',
    sector: 'Education', 
    budget: 980000, 
    status: 'desk_review',
    reviewers: [
      { name: 'Eng. Banda', completed: false },
      { name: 'Arch. Mwale', completed: false },
    ],
    dueDate: '2024-01-22',
    completeness: 45,
  },
  { 
    id: '3', 
    projectName: 'Chilenje Market Rehabilitation', 
    projectNumber: 'PRJ-2024-003',
    sector: 'Community', 
    budget: 650000, 
    status: 'approved',
    reviewers: [
      { name: 'Eng. Chanda', completed: true },
      { name: 'QS Tembo', completed: true },
    ],
    dueDate: '2024-01-15',
    completeness: 100,
  },
  { 
    id: '4', 
    projectName: 'Munali Borehole Project', 
    projectNumber: 'PRJ-2024-004',
    sector: 'Water', 
    budget: 420000, 
    status: 'pending',
    reviewers: [],
    dueDate: '2024-01-25',
    completeness: 0,
  },
];

const mockChecklist: ChecklistItem[] = [
  { id: '1', category: 'Documentation', item: 'Scope of Requirements (SoR) Complete', required: true, status: 'passed' },
  { id: '2', category: 'Documentation', item: 'Bill of Quantities (BOQ) Attached', required: true, status: 'passed' },
  { id: '3', category: 'Documentation', item: 'Architectural/Engineering Designs', required: true, status: 'pending' },
  { id: '4', category: 'Documentation', item: 'Environmental Impact Assessment', required: false, status: 'na' },
  { id: '5', category: 'ZPPA', item: 'ZPPA Threshold Check', required: true, status: 'passed' },
  { id: '6', category: 'ZPPA', item: 'Procurement Method Justified', required: true, status: 'pending' },
  { id: '7', category: 'Viability', item: 'Cost Estimate Reasonable', required: true, status: 'passed' },
  { id: '8', category: 'Viability', item: 'Implementation Timeline Realistic', required: true, status: 'pending' },
  { id: '9', category: 'Viability', item: 'Community Benefit Demonstrated', required: true, status: 'passed' },
  { id: '10', category: 'Viability', item: 'Maintenance Plan Included', required: false, status: 'failed' },
];

export default function TACAppraisal() {
  const [activeTab, setActiveTab] = useState('appraisals');
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pending Assignment</Badge>;
      case 'desk_review': return <Badge variant="info">Desk Review</Badge>;
      case 'field_review': return <Badge variant="warning">Field Review</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'revise': return <Badge variant="warning">Revise & Resubmit</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getChecklistStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'na': return <span className="text-muted-foreground text-xs">N/A</span>;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Technical Appraisal Committee (TAC)</h1>
            <p className="text-muted-foreground">
              Documented appraisals with SoR/BOQ/designs and approve/reject/revise outcomes
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Appraisal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Pending Appraisals</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-info">5</p>
                <p className="text-sm text-muted-foreground">In Review</p>
              </div>
              <Eye className="h-8 w-8 text-info/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">45</p>
                <p className="text-sm text-muted-foreground">Approved (YTD)</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">3</p>
                <p className="text-sm text-muted-foreground">Awaiting 2nd Review</p>
              </div>
              <Users className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="appraisals" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Appraisal Forms
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            ZPPA Checklist
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-2">
            <Users className="h-4 w-4" />
            Two-Reviewer Rule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appraisals" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Appraisals</CardTitle>
                  <CardDescription>Desk and field reviews with technical assessment</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search appraisals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
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
                    <TableHead>Project</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewers</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAppraisals.map((appraisal) => (
                    <TableRow key={appraisal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appraisal.projectName}</p>
                          <p className="text-sm text-muted-foreground">{appraisal.projectNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{appraisal.sector}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(appraisal.budget)}</TableCell>
                      <TableCell>{getStatusBadge(appraisal.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {appraisal.reviewers.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          ) : (
                            appraisal.reviewers.map((r, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-sm">
                                {r.completed ? (
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                ) : (
                                  <Clock className="h-3 w-3 text-warning" />
                                )}
                                {r.name}
                              </div>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={appraisal.completeness} className="h-2 w-16" />
                          <span className="text-sm">{appraisal.completeness}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{appraisal.dueDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Enforcement Rule</h4>
                  <p className="text-sm text-muted-foreground">
                    Projects cannot move forward without at least two completed appraisals and required technical 
                    artefacts (SoR, BOQ, designs as applicable).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ZPPA Checklist & Viability Assessment</CardTitle>
              <CardDescription>Ensure all required documentation and checks are complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['Documentation', 'ZPPA', 'Viability'].map((category) => (
                  <div key={category}>
                    <h4 className="font-medium mb-3">{category}</h4>
                    <div className="space-y-2">
                      {mockChecklist
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox checked={item.status === 'passed'} disabled />
                              <div>
                                <p className="text-sm font-medium">{item.item}</p>
                                {item.required && (
                                  <Badge variant="outline" className="mt-1 text-[10px]">Required</Badge>
                                )}
                              </div>
                            </div>
                            {getChecklistStatusIcon(item.status)}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Reviewer Rule Configuration</CardTitle>
              <CardDescription>Configurable requirement for dual technical review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">Minimum Reviewers Required</h4>
                      <p className="text-sm text-muted-foreground">
                        Number of independent technical reviewers before a project can be approved
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-1">2</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Active TAC Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['Eng. Mumba (Civil)', 'Eng. Phiri (Structural)', 'Arch. Mwale', 'QS Tembo', 'Eng. Banda (Electrical)'].map((name, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{name}</span>
                            <Badge variant="success">Active</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Review Assignment Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Eng. Mumba</span>
                          <span className="text-muted-foreground">3 pending</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Eng. Phiri</span>
                          <span className="text-muted-foreground">2 pending</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Arch. Mwale</span>
                          <span className="text-muted-foreground">4 pending</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
