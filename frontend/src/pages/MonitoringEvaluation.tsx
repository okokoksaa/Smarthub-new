import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  FileText,
  BarChart3,
  Target,
} from "lucide-react";

// Mock data for M&E
const projectInspections = [
  {
    id: "1",
    projectName: "Chilenje Health Post",
    constituency: "Kanyama",
    lastInspection: "2024-01-15",
    status: "on_track",
    progress: 75,
    issues: 0,
  },
  {
    id: "2",
    projectName: "Matero School Block",
    constituency: "Matero",
    lastInspection: "2024-01-10",
    status: "delayed",
    progress: 45,
    issues: 2,
  },
  {
    id: "3",
    projectName: "Kabwata Borehole",
    constituency: "Kabwata",
    lastInspection: "2024-01-12",
    status: "on_track",
    progress: 90,
    issues: 0,
  },
  {
    id: "4",
    projectName: "Munali Road Rehabilitation",
    constituency: "Munali",
    lastInspection: "2024-01-08",
    status: "at_risk",
    progress: 30,
    issues: 3,
  },
];

const kpiMetrics = [
  { name: "Projects On Track", value: 78, target: 85, unit: "%" },
  { name: "Budget Utilization", value: 67, target: 75, unit: "%" },
  { name: "Completion Rate", value: 82, target: 90, unit: "%" },
  { name: "Beneficiary Reach", value: 45000, target: 50000, unit: "" },
];

export default function MonitoringEvaluation() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">On Track</Badge>;
      case "delayed":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Delayed</Badge>;
      case "at_risk":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">At Risk</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoring & Evaluation</h1>
          <p className="text-muted-foreground">Track project progress, conduct inspections, and measure outcomes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Camera className="mr-2 h-4 w-4" />
            Site Visit
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpiMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardHeader className="pb-2">
              <CardDescription>{metric.name}</CardDescription>
              <CardTitle className="text-2xl">
                {metric.value.toLocaleString()}{metric.unit}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Progress value={(metric.value / metric.target) * 100} className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  Target: {metric.target.toLocaleString()}{metric.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">405</div>
            <p className="text-xs text-muted-foreground">Across 156 constituencies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">316</div>
            <p className="text-xs text-muted-foreground">78% of projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delayed</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">67</div>
            <p className="text-xs text-muted-foreground">17% of projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">22</div>
            <p className="text-xs text-muted-foreground">5% of projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inspections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inspections">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Site Inspections
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="mr-2 h-4 w-4" />
            Performance Tracking
          </TabsTrigger>
          <TabsTrigger value="outcomes">
            <BarChart3 className="mr-2 h-4 w-4" />
            Outcome Measurement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
              <CardDescription>Site visits and inspection reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Last Inspection</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectInspections.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.projectName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {project.constituency}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(project.lastInspection).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="w-16" />
                          <span className="text-sm">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        {project.issues > 0 ? (
                          <Badge variant="destructive">{project.issues}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tracking</CardTitle>
              <CardDescription>Monitor KPIs and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Performance charts and metrics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle>Outcome Measurement</CardTitle>
              <CardDescription>Track beneficiary impact and development outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Outcome measurement data will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
