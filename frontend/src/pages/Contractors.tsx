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
  Briefcase,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Building2,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';

const contractors = [
  {
    id: 'CONT-001',
    name: 'ABC Construction Ltd',
    zppaRegistration: 'ZPPA-2024-12345',
    category: 'Grade 1 (>K5M)',
    status: 'verified',
    activeProjects: 3,
    completedProjects: 12,
    totalValue: 8500000,
    performance: 94,
    phone: '+260 97 111 2222',
    email: 'info@abcconstruction.zm',
  },
  {
    id: 'CONT-002',
    name: 'XYZ Building Services',
    zppaRegistration: 'ZPPA-2024-23456',
    category: 'Grade 2 (K1M-K5M)',
    status: 'verified',
    activeProjects: 2,
    completedProjects: 8,
    totalValue: 4200000,
    performance: 88,
    phone: '+260 96 222 3333',
    email: 'contact@xyzbuilding.zm',
  },
  {
    id: 'CONT-003',
    name: 'Quality Works Zambia',
    zppaRegistration: 'ZPPA-2024-34567',
    category: 'Grade 2 (K1M-K5M)',
    status: 'pending',
    activeProjects: 1,
    completedProjects: 5,
    totalValue: 2800000,
    performance: 76,
    phone: '+260 95 333 4444',
    email: 'info@qualityworks.zm',
  },
  {
    id: 'CONT-004',
    name: 'Premier Contractors',
    zppaRegistration: 'ZPPA-2024-45678',
    category: 'Grade 1 (>K5M)',
    status: 'verified',
    activeProjects: 4,
    completedProjects: 15,
    totalValue: 12500000,
    performance: 97,
    phone: '+260 97 444 5555',
    email: 'info@premiercontractors.zm',
  },
];

const pendingClaims = [
  {
    id: 'CLAIM-001',
    contractor: 'ABC Construction Ltd',
    project: 'Kabwata Primary School',
    projectId: 'PROJ-2024-00123',
    milestone: 'Roofing Complete',
    amount: 450000,
    submittedDate: '2024-02-18',
    status: 'panel_a_review',
  },
  {
    id: 'CLAIM-002',
    contractor: 'XYZ Building Services',
    project: 'Munali Health Post',
    projectId: 'PROJ-2024-00124',
    milestone: 'Final Completion',
    amount: 180000,
    submittedDate: '2024-02-20',
    status: 'submitted',
  },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `K${(amount / 1000000).toFixed(1)}M`;
  }
  return `K${amount.toLocaleString()}`;
}

export default function Contractors() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContractors = contractors.filter((contractor) =>
    contractor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contractor Management</h1>
          <p className="text-muted-foreground">
            Manage registered contractors, verify ZPPA compliance, and track performance
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Contractor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Registered Contractors</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ZPPA Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">789</div>
            <p className="text-xs text-muted-foreground">93% verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">312</div>
            <p className="text-xs text-muted-foreground">Ongoing contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Wallet className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">45</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Contractors</TabsTrigger>
          <TabsTrigger value="claims">Payment Claims</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="verification">ZPPA Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Contractors</CardTitle>
              <CardDescription>
                All contractors registered in the CDF system with ZPPA verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor</TableHead>
                    <TableHead>ZPPA Registration</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractors.map((contractor) => (
                    <TableRow key={contractor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contractor.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contractor.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contractor.zppaRegistration}</Badge>
                      </TableCell>
                      <TableCell>{contractor.category}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{contractor.activeProjects}</span> active
                          <span className="text-muted-foreground">
                            {' '}
                            / {contractor.completedProjects} completed
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(contractor.totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={contractor.performance} className="h-2 w-16" />
                          <span
                            className={
                              contractor.performance >= 90
                                ? 'text-success'
                                : contractor.performance >= 75
                                ? 'text-warning'
                                : 'text-destructive'
                            }
                          >
                            {contractor.performance}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contractor.status === 'verified' ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
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

        <TabsContent value="claims" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Claims</CardTitle>
              <CardDescription>
                Pending payment claims from contractors for completed milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim ID</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.id}</TableCell>
                      <TableCell>{claim.contractor}</TableCell>
                      <TableCell>
                        <div>
                          <p>{claim.project}</p>
                          <p className="text-sm text-muted-foreground">{claim.projectId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{claim.milestone}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(claim.amount)}
                      </TableCell>
                      <TableCell>{claim.submittedDate}</TableCell>
                      <TableCell>
                        {claim.status === 'panel_a_review' ? (
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                            Panel A Review
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Submitted</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor Performance</CardTitle>
              <CardDescription>
                Performance metrics based on project completion, quality, and timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {contractors
                  .sort((a, b) => b.performance - a.performance)
                  .map((contractor, index) => (
                    <div key={contractor.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {contractor.completedProjects} projects completed •{' '}
                              {formatCurrency(contractor.totalValue)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <TrendingUp
                            className={`h-4 w-4 ${
                              contractor.performance >= 90
                                ? 'text-success'
                                : contractor.performance >= 75
                                ? 'text-warning'
                                : 'text-destructive'
                            }`}
                          />
                          <span
                            className={`text-lg font-bold ${
                              contractor.performance >= 90
                                ? 'text-success'
                                : contractor.performance >= 75
                                ? 'text-warning'
                                : 'text-destructive'
                            }`}
                          >
                            {contractor.performance}%
                          </span>
                        </div>
                      </div>
                      <Progress value={contractor.performance} className="h-2" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ZPPA Verification Status</CardTitle>
              <CardDescription>
                Track contractor registration and compliance with ZPPA requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contractors.map((contractor) => (
                  <div
                    key={contractor.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          contractor.status === 'verified' ? 'bg-success/10' : 'bg-warning/10'
                        }`}
                      >
                        {contractor.status === 'verified' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Clock className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{contractor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contractor.zppaRegistration} • {contractor.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {contractor.status === 'verified' ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          Verified
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline">Pending Verification</Badge>
                          <Button size="sm">Verify</Button>
                        </>
                      )}
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
