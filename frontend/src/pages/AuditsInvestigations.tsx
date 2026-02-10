import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Search,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Eye,
  Flag,
} from "lucide-react";

// Mock data
const audits = [
  {
    id: "1",
    auditNumber: "AUD-2024-001",
    title: "Q4 2023 Financial Audit - Lusaka Province",
    type: "Financial",
    startDate: "2024-01-10",
    status: "in_progress",
    findings: 3,
  },
  {
    id: "2",
    auditNumber: "AUD-2024-002",
    title: "Procurement Process Review - Copperbelt",
    type: "Compliance",
    startDate: "2024-01-05",
    status: "completed",
    findings: 7,
  },
  {
    id: "3",
    auditNumber: "AUD-2023-089",
    title: "Project Completion Audit - Northern Province",
    type: "Performance",
    startDate: "2023-12-15",
    status: "completed",
    findings: 2,
  },
  {
    id: "4",
    auditNumber: "AUD-2024-003",
    title: "Special Audit - Contractor Performance",
    type: "Special",
    startDate: "2024-01-15",
    status: "planned",
    findings: 0,
  },
];

const investigations = [
  {
    id: "1",
    caseNumber: "INV-2024-001",
    title: "Alleged fund misappropriation - Kabwata",
    priority: "high",
    status: "active",
    reportedDate: "2024-01-08",
    assignedTo: "Investigation Unit A",
  },
  {
    id: "2",
    caseNumber: "INV-2024-002",
    title: "Contractor misconduct review",
    priority: "medium",
    status: "under_review",
    reportedDate: "2024-01-12",
    assignedTo: "Investigation Unit B",
  },
  {
    id: "3",
    caseNumber: "INV-2023-045",
    title: "Procurement irregularity - Munali",
    priority: "low",
    status: "closed",
    reportedDate: "2023-11-20",
    assignedTo: "Investigation Unit A",
  },
];

export default function AuditsInvestigations() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">In Progress</Badge>;
      case "planned":
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Planned</Badge>;
      case "active":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Active</Badge>;
      case "under_review":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Under Review</Badge>;
      case "closed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audits & Investigations</h1>
          <p className="text-muted-foreground">Manage audits, investigations, and oversight activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Flag className="mr-2 h-4 w-4" />
            Report Issue
          </Button>
          <Button>
            <FileSearch className="mr-2 h-4 w-4" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Audits</CardTitle>
            <FileSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Across all provinces</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Investigations</CardTitle>
            <Search className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">4</div>
            <p className="text-xs text-muted-foreground">2 high priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Findings This Month</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">From 3 audits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="audits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audits">
            <FileSearch className="mr-2 h-4 w-4" />
            Audits
          </TabsTrigger>
          <TabsTrigger value="investigations">
            <Search className="mr-2 h-4 w-4" />
            Investigations
          </TabsTrigger>
          <TabsTrigger value="findings">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Findings & Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <CardTitle>Audit Schedule</CardTitle>
              <CardDescription>Planned and ongoing audit activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-medium">{audit.auditNumber}</TableCell>
                      <TableCell>{audit.title}</TableCell>
                      <TableCell>{audit.type}</TableCell>
                      <TableCell>{new Date(audit.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell>
                        {audit.findings > 0 ? (
                          <Badge variant="outline">{audit.findings}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigations">
          <Card>
            <CardHeader>
              <CardTitle>Active Investigations</CardTitle>
              <CardDescription>Ongoing and completed investigation cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reported Date</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investigations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.caseNumber}</TableCell>
                      <TableCell>{inv.title}</TableCell>
                      <TableCell>{getPriorityBadge(inv.priority)}</TableCell>
                      <TableCell>{new Date(inv.reportedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{inv.assignedTo}</TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <CardTitle>Audit Findings & Recommendations</CardTitle>
              <CardDescription>Track findings resolution and implementation of recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Findings and recommendations tracking will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
