import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Search,
  Plus,
  Clock,
  Users,
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Vote,
} from 'lucide-react';

const upcomingMeetings = [
  {
    id: 1,
    title: 'CDFC Monthly Review - Kabwata',
    type: 'CDFC',
    date: '2024-02-25',
    time: '09:00',
    location: 'Kabwata Civic Centre',
    attendees: 9,
    agendaItems: 5,
    status: 'scheduled',
  },
  {
    id: 2,
    title: 'TAC Appraisal Session - Lusaka Province',
    type: 'TAC',
    date: '2024-02-26',
    time: '10:00',
    location: 'Provincial Administration Office',
    attendees: 12,
    agendaItems: 8,
    status: 'scheduled',
  },
  {
    id: 3,
    title: 'WDC Project Prioritization - Chalimbana',
    type: 'WDC',
    date: '2024-02-27',
    time: '14:00',
    location: 'Chalimbana Community Hall',
    attendees: 6,
    agendaItems: 3,
    status: 'scheduled',
  },
];

const pastMeetings = [
  {
    id: 4,
    title: 'CDFC Project Approval - Kabwata',
    type: 'CDFC',
    date: '2024-02-18',
    time: '09:00',
    location: 'Kabwata Civic Centre',
    attendance: '8/9',
    decisions: 4,
    minutesStatus: 'approved',
    quorumMet: true,
  },
  {
    id: 5,
    title: 'TAC Technical Review',
    type: 'TAC',
    date: '2024-02-15',
    time: '10:00',
    location: 'Provincial Administration Office',
    attendance: '10/12',
    decisions: 6,
    minutesStatus: 'approved',
    quorumMet: true,
  },
  {
    id: 6,
    title: 'CDFC Emergency Session - Matero',
    type: 'CDFC',
    date: '2024-02-12',
    time: '15:00',
    location: 'Matero Local Court',
    attendance: '5/9',
    decisions: 2,
    minutesStatus: 'draft',
    quorumMet: true,
  },
];

const votingRecords = [
  {
    id: 1,
    project: 'Kabwata Primary School Classroom',
    projectId: 'PROJ-2024-00123',
    meeting: 'CDFC-2024-02-18',
    votes: { approve: 7, reject: 1, abstain: 0 },
    result: 'approved',
    date: '2024-02-18',
  },
  {
    id: 2,
    project: 'Matero Health Post Equipment',
    projectId: 'PROJ-2024-00156',
    meeting: 'CDFC-2024-02-18',
    votes: { approve: 6, reject: 2, abstain: 0 },
    result: 'approved',
    date: '2024-02-18',
  },
  {
    id: 3,
    project: 'Kanyama Market Rehabilitation',
    projectId: 'PROJ-2024-00089',
    meeting: 'CDFC-2024-02-12',
    votes: { approve: 3, reject: 2, abstain: 0 },
    result: 'approved',
    date: '2024-02-12',
  },
];

export default function Meetings() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Calendar className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Meeting Management</h1>
            <p className="text-muted-foreground">
              Schedule meetings, record attendance, and manage voting
            </p>
          </div>
        </div>
        <Button className="group shadow-lg shadow-primary/25">
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Schedule Meeting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Meetings</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meetings Held</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">48</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quorum Compliance</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
              <Users className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">96%</div>
            <p className="text-sm text-muted-foreground">Meetings with quorum</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Minutes</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <FileText className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">3</div>
            <p className="text-sm text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-background">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-background">Past Meetings</TabsTrigger>
          <TabsTrigger value="voting" className="data-[state=active]:bg-background">Voting Records</TabsTrigger>
          <TabsTrigger value="minutes" className="data-[state=active]:bg-background">Meeting Minutes</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Scheduled CDFC, TAC, and WDC meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="group flex items-center justify-between rounded-xl border p-4 hover:shadow-md hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-105">
                        <Calendar className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{meeting.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {meeting.date} at {meeting.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {meeting.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-medium">{meeting.type}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Users className="h-4 w-4" />
                        {meeting.attendees}
                      </div>
                      <Button variant="outline" size="sm">
                        View Agenda
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Meetings</CardTitle>
              <CardDescription>Completed meetings with attendance and decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Decisions</TableHead>
                    <TableHead>Minutes</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastMeetings.map((meeting) => (
                    <TableRow key={meeting.id} className="group hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-muted-foreground">{meeting.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{meeting.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {meeting.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {meeting.quorumMet ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          {meeting.attendance}
                        </div>
                      </TableCell>
                      <TableCell>{meeting.decisions} decisions</TableCell>
                      <TableCell>
                        {meeting.minutesStatus === 'approved' ? (
                          <Badge variant="success">Approved</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          View Minutes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voting Records</CardTitle>
              <CardDescription>
                Individual vote tracking for project approvals and decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votingRecords.map((record) => (
                    <TableRow key={record.id} className="group hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.project}</p>
                          <p className="text-sm text-muted-foreground">{record.projectId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.meeting}</Badge>
                      </TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-success font-medium">
                            <CheckCircle2 className="h-4 w-4" />
                            {record.votes.approve}
                          </span>
                          <span className="flex items-center gap-1 text-destructive font-medium">
                            ✗ {record.votes.reject}
                          </span>
                          <span className="text-muted-foreground">○ {record.votes.abstain}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Approved</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Vote className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minutes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Minutes</CardTitle>
              <CardDescription>
                View and approve meeting minutes and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="group flex items-center justify-between rounded-xl border p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {meeting.date} • {meeting.attendance} attendance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {meeting.minutesStatus === 'approved' ? (
                        <Badge variant="success">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending Approval
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        View Minutes
                      </Button>
                      {meeting.minutesStatus === 'draft' && (
                        <Button size="sm">Approve</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
