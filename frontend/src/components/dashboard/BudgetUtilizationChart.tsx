import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Health', allocated: 450, utilized: 380 },
  { name: 'Education', allocated: 520, utilized: 445 },
  { name: 'Infrastructure', allocated: 680, utilized: 520 },
  { name: 'Water', allocated: 320, utilized: 290 },
  { name: 'Agriculture', allocated: 280, utilized: 180 },
];

export function BudgetUtilizationChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Utilization by Sector (K millions)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`K${value}M`, '']}
              />
              <Bar
                dataKey="allocated"
                fill="hsl(var(--muted))"
                radius={[0, 4, 4, 0]}
                name="Allocated"
              />
              <Bar
                dataKey="utilized"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                name="Utilized"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
