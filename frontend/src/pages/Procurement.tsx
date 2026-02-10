import { useState } from 'react';
import {
  ShoppingCart,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Search,
  Plus,
  Eye,
  Award,
  Users,
  TrendingUp,
  AlertCircle,
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
import { Skeleton } from '@/components/ui/skeleton';
import { useProcurements } from '@/hooks/useProcurements';
import { format } from 'date-fns';

export default function Procurement() {
  const [activeTab, setActiveTab] = useState('tenders');
  const { data: procurements, isLoading, error } = useProcurements();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'info'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      published: { variant: 'info', label: 'Published' },
      bid_opening: { variant: 'warning', label: 'Bid Opening' },
      evaluation: { variant: 'info', label: 'Evaluation' },
      awarded: { variant: 'success', label: 'Awarded' },
      contracted: { variant: 'success', label: 'Contracted' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  const totalValue = procurements?.reduce((sum, p) => sum + Number(p.estimated_value), 0) || 0;
  const activeTenders = procurements?.filter(t => ['published', 'bid_opening'].includes(t.status)).length || 0;
  const pendingEvaluations = procurements?.filter(e => e.status === 'evaluation').length || 0;
  const awardedCount = procurements?.filter(p => ['awarded', 'contracted', 'completed'].includes(p.status)).length || 0;

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
            <p>Failed to load procurements. Please try again.</p>
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
            <ShoppingCart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
            <p className="text-muted-foreground">
              Run compliant procurement with sealed bids, evaluation, and contract award
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Tender
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                <p className="text-sm text-muted-foreground">Total Estimated Value</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-info/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-info">{activeTenders}</p>
                <p className="text-sm text-muted-foreground">Active Tenders</p>
              </div>
              <FileText className="h-8 w-8 text-info/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">{pendingEvaluations}</p>
                <p className="text-sm text-muted-foreground">Pending Evaluations</p>
              </div>
              <Users className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{awardedCount}</p>
                <p className="text-sm text-muted-foreground">Awards</p>
              </div>
              <Award className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tenders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Tenders & Sealed Bids
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2">
            <Users className="h-4 w-4" />
            Evaluation Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenders" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenders & Sealed Bids</CardTitle>
                  <CardDescription>Time-locked sealed bids with audit events on opening</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tenders..." className="pl-9 w-[250px]" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {procurements && procurements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Est. Value</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procurements.map((procurement) => (
                      <TableRow key={procurement.id}>
                        <TableCell className="font-mono text-sm">{procurement.procurement_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {procurement.status === 'bid_opening' && <Lock className="h-4 w-4 text-warning" />}
                            <span className="font-medium">{procurement.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{procurement.procurement_method.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(Number(procurement.estimated_value))}</TableCell>
                        <TableCell>
                          {procurement.publish_date && procurement.closing_date && (
                            <div className="text-sm">
                              <p>{format(new Date(procurement.publish_date), 'MMM d, yyyy')}</p>
                              <p className="text-muted-foreground">to {format(new Date(procurement.closing_date), 'MMM d, yyyy')}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(procurement.status)}</TableCell>
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
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No procurements found.</p>
                  <Button className="mt-4">Create First Tender</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Sealed Bid Protection</h4>
                  <p className="text-sm text-muted-foreground">
                    Bids remain unreadable until the official opening time. All bid openings are logged 
                    as audit events. Contracts cannot be created unless: plan approved, SoR uploaded, 
                    funding/design confirmed, and evaluation exists.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Matrix & Award</CardTitle>
              <CardDescription>Bid evaluations and award recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {procurements?.filter(p => p.status === 'evaluation').length ? (
                <div className="space-y-4">
                  {procurements.filter(p => p.status === 'evaluation').map((procurement) => (
                    <div key={procurement.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{procurement.title}</h4>
                          <p className="text-sm text-muted-foreground">{procurement.procurement_number}</p>
                        </div>
                        {getStatusBadge(procurement.status)}
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Value</p>
                          <p className="font-medium">{formatCurrency(Number(procurement.estimated_value))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Method</p>
                          <p className="font-medium">{procurement.procurement_method.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button size="sm">
                            <Award className="h-4 w-4 mr-2" />
                            Complete Evaluation
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No evaluations in progress.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
