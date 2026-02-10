import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import { mockAIAdvisories } from '@/data/mockData';
import { cn } from '@/lib/utils';

const riskLevelStyles = {
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function AIAdvisoryPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">AI Advisory Alerts</CardTitle>
        </div>
        <Badge variant="secondary" className="font-normal">
          {mockAIAdvisories.length} Active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAIAdvisories.slice(0, 3).map((advisory) => (
          <div
            key={advisory.id}
            className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                riskLevelStyles[advisory.riskLevel]
              )}
            >
              {advisory.riskLevel === 'high' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{advisory.entityName}</p>
                <Badge
                  variant="outline"
                  className={cn('text-xs', riskLevelStyles[advisory.riskLevel])}
                >
                  Risk: {advisory.riskScore}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {advisory.summary}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  {advisory.entityType}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(advisory.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
        <Button variant="ghost" className="w-full text-sm" size="sm">
          View All Advisories
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
