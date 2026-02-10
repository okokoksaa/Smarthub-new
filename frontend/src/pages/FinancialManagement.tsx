import { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  Building,
  Users,
  FileText,
  Plus,
  Filter,
  Search,
  ArrowUpRight,
  CreditCard,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useBudgets } from '@/hooks/useBudgets';
import { useProjects } from '@/hooks/useProjects';

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  balance: number;
  type: 'main' | 'imprest' | 'project';
  panelASignatories: string[];
  panelBSignatories: string[];
}

interface DisbursementRequest {
  id: string;
  quarter: string;
  fiscalYear: string;
  amount: number;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'disbursed' | 'rejected';
  submittedDate?: string;
  approvedDate?: string;
  disbursedDate?: string;
}

const mockBankAccounts: BankAccount[] = [
  { id: '1', accountName: 'Kanyama CDF Main Account', accountNumber: '1234567890', bankName: 'Zambia National Commercial Bank', balance: 5200000, type: 'main', panelASignatories: ['John Mwale (MP)', 'Mary Banda (CDFC Chair)'], panelBSignatories: ['Peter Zulu (Finance)', 'Grace Tembo (Works)'] },
  { id: '2', accountName: 'Kanyama CDF Imprest', accountNumber: '0987654321', bankName: 'Zambia National Commercial Bank', balance: 150000, type: 'imprest', panelASignatories: ['Mary Banda (CDFC Chair)'], panelBSignatories: ['Peter Zulu (Finance)'] },
];

const mockDisbursements: DisbursementRequest[] = [
  { id: '1', quarter: 'Q1', fiscalYear: '2024', amount: 2500000, status: 'disbursed', submittedDate: '2024-01-15', approvedDate: '2024-01-25', disbursedDate: '2024-02-01' },
  { id: '2', quarter: 'Q2', fiscalYear: '2024', amount: 2500000, status: 'approved', submittedDate: '2024-04-10', approvedDate: '2024-04-20' },
  { id: '3', quarter: 'Q3', fiscalYear: '2024', amount: 2500000, status: 'submitted', submittedDate: '2024-07-05' },
  { id: '4', quarter: 'Q4', fiscalYear: '2024', amount: 2500000, status: 'draft' },
];

export default function FinancialManagement() {
  const [activeTab, setActiveTab] = useState('commitments');
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(2024);
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; label: string }> = {
      active: { variant: 'info', label: 'Active' },
      implementation: { variant: 'info', label: 'Active' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'info', label: 'Submitted' },
      reviewed: { variant: 'warning', label: 'Under Review' },
      approved: { variant: 'success', label: 'Approved' },
      disbursed: { variant: 'success', label: 'Disbursed' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate totals from real data
  const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.total_allocation), 0) || 0;
  const totalDisbursed = budgets?.reduce((sum, b) => sum + Number(b.disbursed_amount), 0) || 0;
  
  // Project commitments from real data
  const activeProjects = projects?.filter(p => ['implementation', 'approved', 'tac_appraisal', 'cdfc_review', 'plgo_review'].includes(p.status)) || [];
  const totalCommitments = activeProjects.reduce((sum, p) => sum + Number(p.budget), 0);
  const totalSpent = activeProjects.reduce((sum, p) => sum + Number(p.spent), 0);
  const totalBalance = totalCommitments - totalSpent;
  const totalBankBalance = mockBankAccounts.reduce((sum, a) => sum + a.balance, 0);

  const isLoading = budgetsLoading || projectsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Management</h1>
            <p className="text-muted-foreground">
              Commitments, disbursements, payments, and bank account management
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Commitment
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalCommitments)}</p>
                <p className="text-sm text-muted-foreground">Total Commitments</p>
              </div>
              <FileText className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20 bg-gradient-to-br from-info/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-info">{formatCurrency(totalBalance)}</p>
                <p className="text-sm text-muted-foreground">Commitment Balance</p>
              </div>
              <TrendingDown className="h-8 w-8 text-info/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalBankBalance)}</p>
                <p className="text-sm text-muted-foreground">Bank Balance</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="commitments" className="gap-2">
            <FileText className="h-4 w-4" />
            Commitment Ledger
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <Building className="h-4 w-4" />
            Bank Accounts
          </TabsTrigger>
          <TabsTrigger value="disbursements" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Disbursement Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commitments" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commitment Ledger & Variations</CardTitle>
                  <CardDescription>Track project commitments and approved variations</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search commitments..." className="pl-9 w-[250px]" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active project commitments found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProjects.map((project) => {
                      const budget = Number(project.budget);
                      const spent = Number(project.spent);
                      const balance = budget - spent;
                      const utilization = budget > 0 ? (spent / budget) * 100 : 0;
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-sm text-muted-foreground font-mono">{project.project_number}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(budget)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(spent)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(balance)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="h-2 w-16" />
                              <span className="text-sm">{utilization.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Payment Control</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment totals cannot exceed commitment + approved variations. All variations 
                    require CDFC approval and supporting documentation before being added to the commitment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts & Signatories</CardTitle>
              <CardDescription>Panel A/B signatory requirements for payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBankAccounts.map((account) => (
                  <div key={account.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.accountName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {account.bankName} • {account.accountNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                        <Badge variant={account.type === 'main' ? 'default' : account.type === 'imprest' ? 'secondary' : 'info'}>
                          {account.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          Panel A Signatories
                        </p>
                        <ul className="space-y-1">
                          {account.panelASignatories.map((sig, idx) => (
                            <li key={idx} className="text-sm">{sig}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-info" />
                          Panel B Signatories
                        </p>
                        <ul className="space-y-1">
                          {account.panelBSignatories.map((sig, idx) => (
                            <li key={idx} className="text-sm">{sig}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signatory Enforcement Notice */}
          <Card className="mt-4 border-info/20 bg-info/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-info">Two-Panel Authorization</h4>
                  <p className="text-sm text-muted-foreground">
                    All payments require at least one Panel A and one Panel B signatory approval before 
                    execution. Digital signatures are cryptographically verified.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disbursements" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quarterly Disbursement Requests</CardTitle>
                  <CardDescription>Track and submit quarterly funding requests</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockDisbursements.map((disbursement) => (
                  <Card key={disbursement.id} className={disbursement.status === 'disbursed' ? 'border-success/20' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold">{disbursement.quarter} {disbursement.fiscalYear}</h4>
                          <p className="text-2xl font-bold text-primary">{formatCurrency(disbursement.amount)}</p>
                        </div>
                        {getStatusBadge(disbursement.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                        {disbursement.submittedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span>{new Date(disbursement.submittedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {disbursement.approvedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved:</span>
                            <span>{new Date(disbursement.approvedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {disbursement.disbursedDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Disbursed:</span>
                            <span>{new Date(disbursement.disbursedDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
