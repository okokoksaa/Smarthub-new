import { useState } from 'react';
import {
  Gavel,
  Calendar,
  Users,
  AlertTriangle,
  Vote,
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Meeting {
  id: string;
  date: string;
  title: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'quorum_failed';
  quorum: { present: number; required: number };
  agendaItems: number;
}

interface COIDeclaration {
  id: string;
  member: string;
  role: string;
  projectId: string;
  projectName: string;
  relationship: string;
  declaredDate: string;
  status: 'active' | 'cleared';
}

interface RankingItem {
  id: string;
  projectName: string;
  ward: string;
  sector: string;
  budget: number;
  score: number;
  votes: { for: number; against: number; abstain: number };
  status: 'pending' | 'approved' | 'deferred';
}

const mockMeetings: Meeting[] = [
  { id: '1', date: '2024-01-20', title: 'Q1 Project Review', status: 'scheduled', quorum: { present: 0, required: 6 }, agendaItems: 8 },
  { id: '2', date: '2024-01-15', title: 'Emergency Session', status: 'completed', quorum: { present: 7, required: 6 }, agendaItems: 3 },
  { id: '3', date: '2024-01-10', title: 'Regular Monthly Meeting', status: 'completed', quorum: { present: 8, required: 6 }, agendaItems: 12 },
  { id: '4', date: '2024-01-05', title: 'Budget Allocation', status: 'quorum_failed', quorum: { present: 4, required: 6 }, agendaItems: 5 },
];

const mockCOIDeclarations: COIDeclaration[] = [
  { id: '1', member: 'John Phiri', role: 'CDFC Member', projectId: 'PRJ-001', projectName: 'Chilenje Borehole', relationship: 'Family owns land', declaredDate: '2024-01-10', status: 'active' },
  { id: '2', member: 'Mary Banda', role: 'Finance Officer', projectId: 'PRJ-003', projectName: 'Market Construction', relationship: 'Business partner is contractor', declaredDate: '2024-01-08', status: 'active' },
  { id: '3', member: 'Peter Mwale', role: 'WDC Rep', projectId: 'PRJ-002', projectName: 'School Renovation', relationship: 'None', declaredDate: '2024-01-12', status: 'cleared' },
];

const mockRankingItems: RankingItem[] = [
  { id: '1', projectName: 'Kanyama Health Post', ward: 'Kanyama', sector: 'Health', budget: 850000, score: 92, votes: { for: 7, against: 0, abstain: 1 }, status: 'approved' },
  { id: '2', projectName: 'Matero Market Shed', ward: 'Matero', sector: 'Community', budget: 450000, score: 78, votes: { for: 5, against: 2, abstain: 1 }, status: 'approved' },
  { id: '3', projectName: 'Munali Classroom Block', ward: 'Munali', sector: 'Education', budget: 1200000, score: 85, votes: { for: 0, against: 0, abstain: 0 }, status: 'pending' },
  { id: '4', projectName: 'Chilenje Road Grading', ward: 'Chilenje', sector: 'Roads', budget: 380000, score: 65, votes: { for: 3, against: 4, abstain: 1 }, status: 'deferred' },
];

export default function CDFCGovernance() {
  const [activeTab, setActiveTab] = useState('meetings');
  const [searchQuery, setSearchQuery] = useState('');

  const getMeetingStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="info">Scheduled</Badge>;
      case 'in_progress': return <Badge variant="warning">In Progress</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'quorum_failed': return <Badge variant="destructive">Quorum Failed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getRankingStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning">Pending Vote</Badge>;
      case 'approved': return <Badge variant="success">Approved</Badge>;
      case 'deferred': return <Badge variant="secondary">Deferred</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
            <Gavel className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CDFC Governance & Ranking</h1>
            <p className="text-muted-foreground">
              Committee process: quorum, conflicts recorded, votes traceable
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">12</p>
                <p className="text-sm text-muted-foreground">Meetings This Quarter</p>
              </div>
              <Calendar className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">3</p>
                <p className="text-sm text-muted-foreground">Active COI Declarations</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Projects Ranked</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="meetings" className="gap-2">
            <Calendar className="h-4 w-4" />
            Meeting Scheduler & Agenda
          </TabsTrigger>
          <TabsTrigger value="coi" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conflict-of-Interest
          </TabsTrigger>
          <TabsTrigger value="voting" className="gap-2">
            <Vote className="h-4 w-4" />
            Voting & Ranking Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CDFC Meetings</CardTitle>
                  <CardDescription>Schedule meetings and manage agendas</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search meetings..." className="w-[250px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {meeting.date} • {meeting.agendaItems} agenda items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getMeetingStatusBadge(meeting.status)}
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Quorum: {meeting.quorum.present}/{meeting.quorum.required}
                        </p>
                        <Progress 
                          value={(meeting.quorum.present / meeting.quorum.required) * 100} 
                          className="h-1.5 w-20"
                        />
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enforcement Notice */}
          <Card className="mt-4 border-warning/20 bg-warning/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Enforcement Rule</h4>
                  <p className="text-sm text-muted-foreground">
                    No vote can be recorded unless (a) quorum ≥ 6 members present and (b) the voter has filed 
                    a COI declaration for that agenda item.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coi" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conflict-of-Interest Declarations</CardTitle>
                  <CardDescription>Members must declare conflicts before voting on related items</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Declaration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Declared</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCOIDeclarations.map((coi) => (
                    <TableRow key={coi.id}>
                      <TableCell className="font-medium">{coi.member}</TableCell>
                      <TableCell>{coi.role}</TableCell>
                      <TableCell>{coi.projectName}</TableCell>
                      <TableCell>{coi.relationship}</TableCell>
                      <TableCell className="text-muted-foreground">{coi.declaredDate}</TableCell>
                      <TableCell>
                        {coi.status === 'active' ? (
                          <Badge variant="warning">Active</Badge>
                        ) : (
                          <Badge variant="success">Cleared</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voting" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Voting & Ranking Board</CardTitle>
                  <CardDescription>Prioritization of ongoing projects with traceable votes</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRankingItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold">#{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.projectName}</p>
                          <p className="text-sm text-muted-foreground">{item.ward}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.sector}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.budget)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.score} className="h-2 w-16" />
                          <span className="text-sm font-medium">{item.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-success flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" />{item.votes.for}
                          </span>
                          <span className="text-destructive flex items-center gap-0.5">
                            <XCircle className="h-3 w-3" />{item.votes.against}
                          </span>
                          <span className="text-muted-foreground">{item.votes.abstain}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRankingStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.status === 'pending' ? (
                          <Button size="sm">Vote</Button>
                        ) : (
                          <Button variant="ghost" size="sm">Details</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
