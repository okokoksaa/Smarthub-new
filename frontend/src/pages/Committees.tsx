import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Plus,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MoreHorizontal,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

// Mock data for committees
const mockCDFCs = [
  {
    id: 1,
    constituency: 'Kabwata',
    chair: 'John Mwale',
    members: 9,
    activeMembers: 8,
    meetingsThisQuarter: 4,
    lastMeeting: '2024-02-15',
    status: 'active',
    quorumMet: true,
  },
  {
    id: 2,
    constituency: 'Munali',
    chair: 'Mary Banda',
    members: 9,
    activeMembers: 9,
    meetingsThisQuarter: 5,
    lastMeeting: '2024-02-18',
    status: 'active',
    quorumMet: true,
  },
  {
    id: 3,
    constituency: 'Kanyama',
    chair: 'Peter Zulu',
    members: 9,
    activeMembers: 6,
    meetingsThisQuarter: 2,
    lastMeeting: '2024-01-28',
    status: 'warning',
    quorumMet: false,
  },
  {
    id: 4,
    constituency: 'Matero',
    chair: 'Grace Phiri',
    members: 9,
    activeMembers: 9,
    meetingsThisQuarter: 6,
    lastMeeting: '2024-02-20',
    status: 'active',
    quorumMet: true,
  },
];

const mockTACs = [
  {
    id: 1,
    province: 'Lusaka',
    chair: 'Dr. Emmanuel Lungu',
    members: 12,
    activeMembers: 11,
    appraisalsThisQuarter: 45,
    pendingAppraisals: 8,
    avgAppraisalDays: 5.2,
  },
  {
    id: 2,
    province: 'Copperbelt',
    chair: 'Eng. Sarah Mulenga',
    members: 10,
    activeMembers: 10,
    appraisalsThisQuarter: 38,
    pendingAppraisals: 5,
    avgAppraisalDays: 4.8,
  },
];

const mockMembers = [
  {
    id: 1,
    name: 'John Mwale',
    role: 'CDFC Chair',
    constituency: 'Kabwata',
    phone: '+260 97 123 4567',
    email: 'john.mwale@gov.zm',
    status: 'active',
    conflictsOfInterest: 0,
    meetingAttendance: '95%',
  },
  {
    id: 2,
    name: 'Mary Banda',
    role: 'CDFC Member',
    constituency: 'Kabwata',
    phone: '+260 96 234 5678',
    email: 'mary.banda@gov.zm',
    status: 'active',
    conflictsOfInterest: 1,
    meetingAttendance: '88%',
  },
  {
    id: 3,
    name: 'Peter Zulu',
    role: 'Finance Officer',
    constituency: 'Kabwata',
    phone: '+260 95 345 6789',
    email: 'peter.zulu@gov.zm',
    status: 'active',
    conflictsOfInterest: 0,
    meetingAttendance: '100%',
  },
];

export default function Committees() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Users className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Committee Management</h1>
            <p className="text-muted-foreground">
              Manage CDFC, TAC, and WDC committees across constituencies
            </p>
          </div>
        </div>
        <Button className="group shadow-lg shadow-primary/25">
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total CDFCs</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-muted-foreground">Across all constituencies</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">1,404</div>
            <p className="text-sm text-muted-foreground">9 per committee</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TAC Committees</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
              <Users className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10</div>
            <p className="text-sm text-muted-foreground">One per province</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quorum Issues</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">8</div>
            <p className="text-sm text-muted-foreground">Committees below quorum</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search committees or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cdfc" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="cdfc" className="data-[state=active]:bg-background">CDFC Committees</TabsTrigger>
          <TabsTrigger value="tac" className="data-[state=active]:bg-background">TAC Committees</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-background">All Members</TabsTrigger>
          <TabsTrigger value="conflicts" className="data-[state=active]:bg-background">Conflicts of Interest</TabsTrigger>
        </TabsList>

        <TabsContent value="cdfc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Constituency Development Fund Committees</CardTitle>
              <CardDescription>
                9-member committees responsible for project approval and oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Chair</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Meetings (Q)</TableHead>
                    <TableHead>Last Meeting</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCDFCs.map((cdfc) => (
                    <TableRow key={cdfc.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          {cdfc.constituency}
                        </div>
                      </TableCell>
                      <TableCell>{cdfc.chair}</TableCell>
                      <TableCell>
                        <span className={cdfc.activeMembers < 5 ? 'text-destructive font-medium' : ''}>
                          {cdfc.activeMembers}
                        </span>
                        /{cdfc.members}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {cdfc.meetingsThisQuarter}
                        </div>
                      </TableCell>
                      <TableCell>{cdfc.lastMeeting}</TableCell>
                      <TableCell>
                        {cdfc.status === 'active' ? (
                          <Badge variant="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Low Quorum
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tac" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Appraisal Committees</CardTitle>
              <CardDescription>
                Provincial committees responsible for technical project appraisal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Province</TableHead>
                    <TableHead>Chair</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Appraisals (Q)</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Avg. Days</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTACs.map((tac) => (
                    <TableRow key={tac.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">{tac.province}</TableCell>
                      <TableCell>{tac.chair}</TableCell>
                      <TableCell>
                        {tac.activeMembers}/{tac.members}
                      </TableCell>
                      <TableCell>{tac.appraisalsThisQuarter}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{tac.pendingAppraisals}</Badge>
                      </TableCell>
                      <TableCell>{tac.avgAppraisalDays} days</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Committee Members</CardTitle>
              <CardDescription>All registered committee members across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Constituency</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMembers.map((member) => (
                    <TableRow key={member.id} className="group hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {member.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{member.constituency}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {member.phone}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="ghost" className="font-bold">{member.meetingAttendance}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflicts of Interest Registry</CardTitle>
              <CardDescription>
                Track and manage declared conflicts of interest for committee members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <p className="font-medium">No active conflicts of interest to display</p>
                  <p className="text-sm">All declarations have been reviewed and cleared</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
