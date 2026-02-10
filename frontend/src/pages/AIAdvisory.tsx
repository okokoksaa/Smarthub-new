import { useState } from 'react';
import {
  Bot,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Filter,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockAIAdvisories } from '@/data/mockData';
import { cn } from '@/lib/utils';

const riskLevelStyles = {
  low: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    icon: CheckCircle,
  },
  medium: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    icon: TrendingUp,
  },
  high: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
    icon: AlertTriangle,
  },
};

export default function AIAdvisory() {
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredAdvisories = mockAIAdvisories.filter(
    (advisory) => entityFilter === 'all' || advisory.entityType === entityFilter
  );

  const highRiskCount = mockAIAdvisories.filter((a) => a.riskLevel === 'high').length;
  const mediumRiskCount = mockAIAdvisories.filter((a) => a.riskLevel === 'medium').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Advisory</h1>
            <p className="text-muted-foreground">
              AI-powered anomaly detection and compliance recommendations
            </p>
          </div>
        </div>
        <Button variant="outline" className="group">
          <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180" />
          Refresh Analysis
        </Button>
      </div>

      {/* AI Disclaimer */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex items-start gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-primary">AI Advisory Notice</p>
            <p className="text-muted-foreground">
              AI analysis is advisory only. All decisions require human review and approval. 
              AI recommendations should be verified against source documents and local context.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Advisories</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <Bot className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockAIAdvisories.length}</div>
            <p className="text-sm text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 transition-transform group-hover:scale-110">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{highRiskCount}</div>
            <p className="text-sm text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Risk</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{mediumRiskCount}</div>
            <p className="text-sm text-muted-foreground">Review recommended</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI Accuracy</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">98.2%</div>
            <p className="text-sm text-muted-foreground">30-day accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-background">All ({mockAIAdvisories.length})</TabsTrigger>
            <TabsTrigger value="high" className="text-destructive data-[state=active]:bg-background">
              High Risk ({highRiskCount})
            </TabsTrigger>
            <TabsTrigger value="medium" className="data-[state=active]:bg-background">Medium ({mediumRiskCount})</TabsTrigger>
          </TabsList>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px] bg-background">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="contractor">Contractors</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredAdvisories.map((advisory) => {
            const style = riskLevelStyles[advisory.riskLevel];
            const Icon = style.icon;

            return (
              <Card key={advisory.id} className={cn('group transition-all duration-300 hover:shadow-lg', style.border)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110', style.bg)}>
                        <Icon className={cn('h-6 w-6', style.text)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{advisory.entityName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            {advisory.entityType}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {advisory.entityId}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn('text-sm font-bold px-3 py-1', style.bg, style.text)}>
                        Risk: {advisory.riskScore}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(advisory.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{advisory.summary}</p>
                  
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      AI Recommendations
                    </p>
                    <ul className="space-y-2">
                      {advisory.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button size="sm" className="shadow-lg shadow-primary/25">
                      Review & Acknowledge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {filteredAdvisories
            .filter((a) => a.riskLevel === 'high')
            .map((advisory) => {
              const style = riskLevelStyles[advisory.riskLevel];
              const Icon = style.icon;

              return (
                <Card key={advisory.id} className={cn('group transition-all duration-300 hover:shadow-lg', style.border)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', style.bg)}>
                          <Icon className={cn('h-6 w-6', style.text)} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{advisory.entityName}</CardTitle>
                          <Badge variant="outline" className="text-xs font-normal mt-1">
                            {advisory.entityType}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={cn('text-sm font-bold', style.bg, style.text)}>
                        Risk: {advisory.riskScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{advisory.summary}</p>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {filteredAdvisories
            .filter((a) => a.riskLevel === 'medium')
            .map((advisory) => {
              const style = riskLevelStyles[advisory.riskLevel];
              const Icon = style.icon;

              return (
                <Card key={advisory.id} className={cn('group transition-all duration-300 hover:shadow-lg', style.border)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', style.bg)}>
                          <Icon className={cn('h-6 w-6', style.text)} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{advisory.entityName}</CardTitle>
                          <Badge variant="outline" className="text-xs font-normal mt-1">
                            {advisory.entityType}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={cn('text-sm font-bold', style.bg, style.text)}>
                        Risk: {advisory.riskScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{advisory.summary}</p>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
