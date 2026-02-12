import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Users,
  FileCheck,
  MessageSquare,
  Calendar,
  MapPin,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Application {
  id: string;
  type: 'project' | 'grant' | 'loan' | 'bursary';
  title: string;
  applicant: string;
  ward: string;
  submittedDate: string;
  status: 'draft' | 'pending_wdc' | 'wdc_approved' | 'forwarded_cdfc' | 'rejected';
  amount: number;
}

interface Meeting {
  id: string;
  date: string;
  ward: string;
  status: 'scheduled' | 'completed' | 'minutes_pending';
  attendees: number;
  chairSigned: boolean;
}

const mockApplications: Application[] = [
  { id: '1', type: 'project', title: 'Chilenje Community Borehole', applicant: 'Chilenje WDC', ward: 'Chilenje', submittedDate: '2024-01-10', status: 'wdc_approved', amount: 450000 },
  { id: '2', type: 'grant', title: 'Women Empowerment Group', applicant: 'Kanyama Women Assoc.', ward: 'Kanyama', submittedDate: '2024-01-12', status: 'pending_wdc', amount: 50000 },
  { id: '3', type: 'bursary', title: 'Secondary School Bursary', applicant: 'John Banda', ward: 'Matero', submittedDate: '2024-01-08', status: 'forwarded_cdfc', amount: 15000 },
  { id: '4', type: 'loan', title: 'Youth Cooperative Loan', applicant: 'Munali Youth Coop', ward: 'Munali', submittedDate: '2024-01-14', status: 'draft', amount: 75000 },
  { id: '5', type: 'project', title: 'Market Shelter Construction', applicant: 'Kabwata WDC', ward: 'Kabwata', submittedDate: '2024-01-11', status: 'pending_wdc', amount: 380000 },
];

const mockMeetings: Meeting[] = [
  { id: '1', date: '2024-01-15', ward: 'Chilenje', status: 'completed', attendees: 12, chairSigned: true },
  { id: '2', date: '2024-01-18', ward: 'Kanyama', status: 'scheduled', attendees: 0, chairSigned: false },
  { id: '3', date: '2024-01-12', ward: 'Matero', status: 'minutes_pending', attendees: 10, chairSigned: false },
  { id: '4', date: '2024-01-20', ward: 'Munali', status: 'scheduled', attendees: 0, chairSigned: false },
];

export default function WardIntake() {
  const [activeTab, setActiveTab] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const notifyNotReady = (feature: string) => {
    toast({
      title: `${feature} is not implemented yet`,
      description: 'Button intentionally wired to feedback instead of a no-op.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'pending_wdc': return <Badge variant="warning">Pending WDC</Badge>;
      case 'wdc_approved': return <Badge variant="success">WDC Approved</Badge>;
      case 'forwarded_cdfc': return <Badge variant="info">Forwarded to CDFC</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'project': return <Badge variant="default">Project</Badge>;
      case 'grant': return <Badge variant="info">Grant</Badge>;
      case 'loan': return <Badge variant="warning">Loan</Badge>;
      case 'bursary': return <Badge variant="secondary">Bursary</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const getMeetingStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="info">Scheduled</Badge>;
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'minutes_pending': return <Badge variant="warning">Minutes Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `K${amount.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Ward Intake & Community (WDC)</h1>
            <p className="text-muted-foreground">
              Intake for projects, bursaries, empowerment — anchored at ward level
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/ward-intake?tab=applications&action=new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-warning">8</p>
                <p className="text-sm text-muted-foreground">Pending WDC Review</p>
              </div>
              <Clock className="h-8 w-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">12</p>
                <p className="text-sm text-muted-foreground">Forwarded to CDFC</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">3</p>
                <p className="text-sm text-muted-foreground">Missing Minutes</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            Application Wizard
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-2">
            <Users className="h-4 w-4" />
            WDC Meetings & Minutes
          </TabsTrigger>
          <TabsTrigger value="notices" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Community Notices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Applications</CardTitle>
                  <CardDescription>Projects, grants, loans, and bursaries at ward level</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[250px]"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => notifyNotReady('Advanced filters')}>
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
                    <TableHead>Application</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.title}</p>
                          <p className="text-sm text-muted-foreground">{app.applicant}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(app.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {app.ward}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(app.amount)}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{app.submittedDate}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/ward-intake?applicationId=${app.id}`)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    Applications cannot be forwarded to CDFC unless WDC meeting minutes with chair sign-off exist 
                    and residency thresholds are met (Section 15(2)(a) CDF Act).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>WDC Meetings</CardTitle>
                  <CardDescription>Schedule meetings and upload minutes</CardDescription>
                </div>
                <Button onClick={() => setActiveTab('meetings')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{meeting.ward} WDC Meeting</h4>
                        <p className="text-sm text-muted-foreground">
                          {meeting.date} • {meeting.attendees > 0 ? `${meeting.attendees} attendees` : 'No attendance yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getMeetingStatusBadge(meeting.status)}
                      {meeting.chairSigned ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Chair Signed
                        </Badge>
                      ) : (
                        <Badge variant="outline">Awaiting Signature</Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => navigate(`/ward-intake?meetingId=${meeting.id}&action=upload-minutes`)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Minutes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Polls & Notices</CardTitle>
              <CardDescription>Optional community engagement features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p>Community notices and polls feature coming soon</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  disabled
                  title="Community notices are intentionally not implemented yet"
                  onClick={() => notifyNotReady('Community notices')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notice (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
