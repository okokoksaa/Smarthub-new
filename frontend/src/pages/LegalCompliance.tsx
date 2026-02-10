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
  Scale,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Shield,
  Gavel,
  BookOpen,
} from "lucide-react";

// Mock data
const complianceItems = [
  {
    id: "1",
    regulation: "CDF Act Section 12",
    description: "Quarterly expenditure returns submission",
    dueDate: "2024-01-31",
    status: "compliant",
    constituency: "All",
  },
  {
    id: "2",
    regulation: "ZPPA Guidelines",
    description: "Procurement threshold compliance",
    dueDate: "2024-02-15",
    status: "pending",
    constituency: "Kabwata",
  },
  {
    id: "3",
    regulation: "Financial Management Act",
    description: "Annual audit submission",
    dueDate: "2024-03-31",
    status: "pending",
    constituency: "All",
  },
  {
    id: "4",
    regulation: "CDF Act Section 8",
    description: "CDFC meeting minutes filing",
    dueDate: "2024-01-20",
    status: "non_compliant",
    constituency: "Matero",
  },
];

const legalCases = [
  {
    id: "1",
    caseNumber: "LC-2024-001",
    title: "Contractor dispute - Chilenje Project",
    status: "active",
    filedDate: "2024-01-05",
    type: "Contract Dispute",
  },
  {
    id: "2",
    caseNumber: "LC-2024-002",
    title: "Land acquisition - Munali",
    status: "resolved",
    filedDate: "2023-11-15",
    type: "Land Issue",
  },
  {
    id: "3",
    caseNumber: "LC-2023-045",
    title: "Procurement irregularity review",
    status: "under_review",
    filedDate: "2023-12-20",
    type: "Compliance Review",
  },
];

export default function LegalCompliance() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Compliant</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "non_compliant":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Non-Compliant</Badge>;
      case "active":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Active</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Resolved</Badge>;
      case "under_review":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Under Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Legal & Compliance</h1>
          <p className="text-muted-foreground">Monitor regulatory compliance and manage legal matters</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Regulations
          </Button>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
            <p className="text-xs text-muted-foreground">Across all requirements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Due this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Gavel className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Legal matters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">3</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Compliance Tracker
          </TabsTrigger>
          <TabsTrigger value="legal">
            <Scale className="mr-2 h-4 w-4" />
            Legal Cases
          </TabsTrigger>
          <TabsTrigger value="regulations">
            <BookOpen className="mr-2 h-4 w-4" />
            Regulations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>Track regulatory compliance deadlines and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regulation</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.regulation}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.constituency}</TableCell>
                      <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Review</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal Cases</CardTitle>
              <CardDescription>Active and resolved legal matters</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Filed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legalCases.map((case_) => (
                    <TableRow key={case_.id}>
                      <TableCell className="font-medium">{case_.caseNumber}</TableCell>
                      <TableCell>{case_.title}</TableCell>
                      <TableCell>{case_.type}</TableCell>
                      <TableCell>{new Date(case_.filedDate).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusBadge(case_.status)}</TableCell>
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

        <TabsContent value="regulations">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Framework</CardTitle>
              <CardDescription>CDF Act, ZPPA guidelines, and other applicable regulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Regulatory documentation and guidelines will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
