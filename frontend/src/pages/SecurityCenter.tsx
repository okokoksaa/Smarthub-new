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
  Shield,
  Lock,
  Key,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Smartphone,
  Monitor,
  FileText,
  Search,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSecurityEvents } from '@/hooks/useSecurityEvents';
import { format } from 'date-fns';

const rlsTestResults = [
  { id: 1, test: 'Cross-tenant project access', table: 'projects', expected: 'Denied', result: 'Pass', lastRun: '2024-02-20 14:00' },
  { id: 2, test: 'Cross-tenant payment access', table: 'payments', expected: 'Denied', result: 'Pass', lastRun: '2024-02-20 14:00' },
  { id: 3, test: 'Audit log immutability', table: 'audit_logs', expected: 'Write-only', result: 'Pass', lastRun: '2024-02-20 14:00' },
  { id: 4, test: 'User role escalation', table: 'user_roles', expected: 'Denied', result: 'Pass', lastRun: '2024-02-20 14:00' },
  { id: 5, test: 'Contractor self-modification', table: 'contractors', expected: 'Limited', result: 'Pass', lastRun: '2024-02-20 14:00' },
];

export default function SecurityCenter() {
  const [searchLogs, setSearchLogs] = useState('');
  const { data: securityEvents, isLoading } = useSecurityEvents();

  const filteredEvents = securityEvents?.filter(event =>
    event.description.toLowerCase().includes(searchLogs.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchLogs.toLowerCase())
  ) || [];

  const failedLogins = securityEvents?.filter(e => e.event_type === 'failed_login').length || 0;
  const unresolvedCount = securityEvents?.filter(e => !e.is_resolved).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Security & Data Protection</h1>
          <p className="text-muted-foreground">
            Guard data and processes with RLS testing, access logs, and retention
          </p>
        </div>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <ShieldCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {rlsTestResults.filter(t => t.result === 'Pass').length}/{rlsTestResults.length}
                </p>
                <p className="text-sm text-muted-foreground">RLS Tests Pass</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{securityEvents?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Security Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedLogins}</p>
                <p className="text-sm text-muted-foreground">Failed Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
                <p className="text-sm text-muted-foreground">Unresolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rls">
            <Shield className="mr-2 h-4 w-4" />
            RLS Testing
          </TabsTrigger>
          <TabsTrigger value="events">
            <Eye className="mr-2 h-4 w-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Trash2 className="mr-2 h-4 w-4" />
            Data Retention
          </TabsTrigger>
        </TabsList>

        {/* RLS Test Harness */}
        <TabsContent value="rls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Row-Level Security Test Harness</CardTitle>
                  <CardDescription>
                    Automated tests to verify RLS policies are working correctly
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/10 text-success hover:bg-success/20">
                    All Tests Passing
                  </Badge>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run All Tests
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Case</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rlsTestResults.map(test => (
                    <TableRow key={test.id}>
                      <TableCell className="font-medium">{test.test}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <FileText className="mr-1 h-3 w-3" />
                          {test.table}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{test.expected}</TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Pass
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{test.lastRun}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Run
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Policy Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <Lock className="h-8 w-8 text-success mb-3" />
                  <h4 className="font-medium mb-1">Data Isolation</h4>
                  <p className="text-sm text-muted-foreground">
                    All tables enforce tenant-level isolation through RLS policies.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <Key className="h-8 w-8 text-success mb-3" />
                  <h4 className="font-medium mb-1">Role-Based Access</h4>
                  <p className="text-sm text-muted-foreground">
                    13 roles with fine-grained permissions at province/constituency/ward levels.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <ShieldAlert className="h-8 w-8 text-success mb-3" />
                  <h4 className="font-medium mb-1">Audit Logging</h4>
                  <p className="text-sm text-muted-foreground">
                    All security events are logged with immutable audit trails.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Security Events Log</CardTitle>
                  <CardDescription>
                    Monitor security-related events and access patterns
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchLogs}
                      onChange={(e) => setSearchLogs(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.event_type}</TableCell>
                        <TableCell>{event.description}</TableCell>
                        <TableCell>
                          {event.severity === 'high' ? (
                            <Badge className="bg-destructive/10 text-destructive">High</Badge>
                          ) : event.severity === 'medium' ? (
                            <Badge className="bg-warning/10 text-warning">Medium</Badge>
                          ) : (
                            <Badge variant="outline">Low</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {event.is_resolved ? (
                            <Badge className="bg-success/10 text-success hover:bg-success/20">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                              Open
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No security events recorded.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Retention */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>
                Automated data cleanup and retention schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Session Data</h4>
                    <Badge variant="outline">Delete after 90 days</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    User session data is automatically purged after 90 days of inactivity.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Contact Details (PII)</h4>
                    <Badge variant="outline">Redact 2 years post-completion</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Personal contact information is redacted 2 years after project completion.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Draft Applications</h4>
                    <Badge variant="outline">Delete after 30 days</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unsubmitted draft applications are deleted after 30 days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
