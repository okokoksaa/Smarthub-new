import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  ToggleLeft,
  Calendar,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  MapPin,
  Info,
} from 'lucide-react';

const featureFlags = [
  {
    id: 'deemed_approval',
    name: 'Deemed Approval',
    description: 'Auto-approve items after SLA deadline passes',
    enabled: false,
    category: 'Workflow',
  },
  {
    id: 'public_portal',
    name: 'Public Transparency Portal',
    description: 'Enable public access to approved project data',
    enabled: true,
    category: 'Access',
  },
  {
    id: 'red_flag_engine',
    name: 'Red Flag Analytics',
    description: 'Enable AI-powered fraud detection on tenders',
    enabled: true,
    category: 'Security',
  },
  {
    id: 'sms_notifications',
    name: 'SMS Notifications',
    description: 'Send SMS alerts for urgent items',
    enabled: true,
    category: 'Notifications',
  },
  {
    id: 'gps_validation',
    name: 'GPS Geofence Validation',
    description: 'Require GPS within project geofence for site visits',
    enabled: true,
    category: 'M&E',
  },
  {
    id: 'two_reviewer_rule',
    name: 'Two-Reviewer Rule (TAC)',
    description: 'Require two technical appraisals before approval',
    enabled: true,
    category: 'Workflow',
  },
  {
    id: 'loan_training_gate',
    name: 'Loan Training Gate',
    description: 'Block loan disbursement until training is complete',
    enabled: true,
    category: 'Programs',
  },
  {
    id: 'capr_tracking',
    name: 'CAPR 90-Day Tracking',
    description: 'Track and enforce CAPR submission deadlines',
    enabled: true,
    category: 'Compliance',
  },
];

const publicHolidays = [
  { id: 1, name: 'New Year\'s Day', date: '2024-01-01', province: 'All' },
  { id: 2, name: 'Youth Day', date: '2024-03-12', province: 'All' },
  { id: 3, name: 'Good Friday', date: '2024-03-29', province: 'All' },
  { id: 4, name: 'Easter Monday', date: '2024-04-01', province: 'All' },
  { id: 5, name: 'Labour Day', date: '2024-05-01', province: 'All' },
  { id: 6, name: 'Africa Day', date: '2024-05-25', province: 'All' },
  { id: 7, name: 'Heroes Day', date: '2024-07-01', province: 'All' },
  { id: 8, name: 'Unity Day', date: '2024-07-02', province: 'All' },
  { id: 9, name: 'Farmers Day', date: '2024-08-05', province: 'All' },
  { id: 10, name: 'Independence Day', date: '2024-10-24', province: 'All' },
  { id: 11, name: 'Christmas Day', date: '2024-12-25', province: 'All' },
];

const retentionPolicies = [
  {
    id: 1,
    dataType: 'Audit Logs',
    retentionPeriod: '7 years',
    action: 'Archive',
    status: 'active',
  },
  {
    id: 2,
    dataType: 'Session Logs',
    retentionPeriod: '90 days',
    action: 'Delete',
    status: 'active',
  },
  {
    id: 3,
    dataType: 'Payment Records',
    retentionPeriod: '10 years',
    action: 'Archive',
    status: 'active',
  },
  {
    id: 4,
    dataType: 'Draft Applications',
    retentionPeriod: '30 days',
    action: 'Delete',
    status: 'active',
  },
  {
    id: 5,
    dataType: 'PII - Contact Details',
    retentionPeriod: '2 years post-completion',
    action: 'Redact',
    status: 'active',
  },
  {
    id: 6,
    dataType: 'Document Attachments',
    retentionPeriod: '5 years',
    action: 'Archive',
    status: 'active',
  },
];

export default function AdminControlPanel() {
  const [flags, setFlags] = useState(featureFlags);

  const toggleFlag = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const categories = [...new Set(flags.map(f => f.category))];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Control Panel</h1>
        <p className="text-muted-foreground">
          Configure tenant settings, feature flags, and system policies
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ToggleLeft className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {flags.filter(f => f.enabled).length}/{flags.length}
                </p>
                <p className="text-sm text-muted-foreground">Features Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publicHolidays.length}</p>
                <p className="text-sm text-muted-foreground">Holidays Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Trash2 className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{retentionPolicies.length}</p>
                <p className="text-sm text-muted-foreground">Retention Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Building2 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">10</p>
                <p className="text-sm text-muted-foreground">Provinces Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="flags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flags">
            <ToggleLeft className="mr-2 h-4 w-4" />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Working Days
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Trash2 className="mr-2 h-4 w-4" />
            Retention Policies
          </TabsTrigger>
        </TabsList>

        {/* Feature Flags */}
        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>
                    Enable or disable features per tenant
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {flags.filter(f => f.category === category).map(flag => (
                      <div
                        key={flag.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          {flag.enabled ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{flag.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {flag.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={() => toggleFlag(flag.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Days Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Public Holidays Calendar</CardTitle>
                  <CardDescription>
                    Configure public holidays for SLA calculations
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicHolidays.map(holiday => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(holiday.date).toLocaleDateString('en-ZM', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <MapPin className="mr-1 h-3 w-3" />
                          {holiday.province}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
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
              <CardTitle>Working Days Configuration</CardTitle>
              <CardDescription>
                Define standard working hours and days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Working Days</Label>
                  <div className="flex gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <Button
                        key={day}
                        variant={i < 5 ? 'default' : 'outline'}
                        size="sm"
                        className="w-10"
                      >
                        {day[0]}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <div className="flex items-center gap-2">
                    <Input type="time" defaultValue="08:00" className="w-32" />
                    <span className="text-muted-foreground">to</span>
                    <Input type="time" defaultValue="17:00" className="w-32" />
                  </div>
                </div>
              </div>
              <Button>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Policies */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Retention Policies</CardTitle>
                  <CardDescription>
                    Configure data retention and PII minimization rules
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionPolicies.map(policy => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.dataType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {policy.retentionPeriod}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            policy.action === 'Delete'
                              ? 'border-destructive/50 text-destructive'
                              : policy.action === 'Redact'
                              ? 'border-warning/50 text-warning'
                              : ''
                          }
                        >
                          {policy.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
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
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Retention Job Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last Retention Job</p>
                  <p className="text-sm text-muted-foreground">
                    Ran 2 hours ago • Processed 1,245 records
                  </p>
                </div>
                <Badge className="bg-success/10 text-success hover:bg-success/20">
                  Completed
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Next scheduled run</span>
                  <span className="text-muted-foreground">Tonight at 02:00</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
