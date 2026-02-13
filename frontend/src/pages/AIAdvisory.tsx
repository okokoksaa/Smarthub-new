import { useState } from 'react';
import { Bot, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments } from '@/hooks/usePayments';

export default function AIAdvisory() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: payments = [] } = usePayments();
  const advisories = payments
    .filter((p: any) => (p.ai_risk_score || 0) > 0)
    .map((p: any) => ({ id: p.id, entityName: p.payment_number || p.id, riskScore: p.ai_risk_score || 0, riskLevel: p.ai_risk_level || ((p.ai_risk_score || 0) >= 70 ? 'high' : (p.ai_risk_score || 0) >= 40 ? 'medium' : 'low'), summary: `Payment for ${p.beneficiary_name || 'beneficiary'} marked ${p.status}` }));

  const filteredAdvisories = advisories.filter((a) => a.entityName.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary.toLowerCase().includes(searchQuery.toLowerCase()));
  const highRiskCount = advisories.filter((a) => a.riskLevel === 'high').length;
  const mediumRiskCount = advisories.filter((a) => a.riskLevel === 'medium').length;

  return <div className="space-y-6"><div className="flex items-center gap-4"><Bot className="h-6 w-6" /><h1 className="text-2xl font-bold">AI Advisory</h1></div>
    <div className="grid grid-cols-3 gap-4"><Card><CardHeader><CardTitle>Total</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{advisories.length}</CardContent></Card><Card><CardHeader><CardTitle>High Risk</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-destructive">{highRiskCount}</CardContent></Card><Card><CardHeader><CardTitle>Medium Risk</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-warning">{mediumRiskCount}</CardContent></Card></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search advisories..." /></div>
    <Tabs defaultValue="all"><TabsList><TabsTrigger value="all">All ({advisories.length})</TabsTrigger><TabsTrigger value="high">High</TabsTrigger></TabsList><TabsContent value="all" className="space-y-3">{filteredAdvisories.map((a) => <Card key={a.id}><CardContent className="pt-4"><div className="flex items-center justify-between"><p className="font-medium">{a.entityName}</p><Badge variant={a.riskLevel === 'high' ? 'destructive' : 'secondary'}>{a.riskLevel} ({a.riskScore})</Badge></div><p className="text-sm text-muted-foreground mt-1">{a.summary}</p></CardContent></Card>)}</TabsContent><TabsContent value="high" className="space-y-3">{filteredAdvisories.filter((a) => a.riskLevel === 'high').map((a) => <Card key={a.id}><CardContent className="pt-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /><p className="font-medium">{a.entityName}</p></div><p className="text-sm text-muted-foreground">{a.summary}</p></CardContent></Card>)}</TabsContent></Tabs>
  </div>;
}
