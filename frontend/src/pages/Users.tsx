import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Users as UsersIcon,
  Search,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MoreHorizontal,
  Key,
  UserCog,
  History,
} from 'lucide-react';

const systemUsers = [
  {
    id: 1,
    name: 'John Mwale',
    email: 'john.mwale@gov.zm',
    phone: '+260 97 123 4567',
    role: 'cdfc_chair',
    roleLabel: 'CDFC Chair',
    constituency: 'Kabwata',
    province: 'Lusaka',
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2024-02-20 14:35',
    createdAt: '2023-01-15',
  },
  {
    id: 2,
    name: 'Mary Banda',
    email: 'mary.banda@gov.zm',
    phone: '+260 96 234 5678',
    role: 'finance_officer',
    roleLabel: 'Finance Officer',
    constituency: 'Kabwata',
    province: 'Lusaka',
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2024-02-20 09:15',
    createdAt: '2023-02-20',
  },
  {
    id: 3,
    name: 'Peter Zulu',
    email: 'peter.zulu@gov.zm',
    phone: '+260 95 345 6789',
    role: 'tac_member',
    roleLabel: 'TAC Member',
    constituency: null,
    province: 'Lusaka',
    status: 'active',
    mfaEnabled: false,
    lastLogin: '2024-02-19 16:45',
    createdAt: '2023-03-10',
  },
  {
    id: 4,
    name: 'Grace Phiri',
    email: 'grace.phiri@gov.zm',
    phone: '+260 97 456 7890',
    role: 'plgo',
    roleLabel: 'PLGO',
    constituency: null,
    province: 'Lusaka',
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2024-02-20 11:20',
    createdAt: '2023-01-05',
  },
  {
    id: 5,
    name: 'James Tembo',
    email: 'james.tembo@gov.zm',
    phone: '+260 96 567 8901',
    role: 'wdc_member',
    roleLabel: 'WDC Member',
    constituency: 'Kabwata',
    province: 'Lusaka',
    status: 'pending',
    mfaEnabled: false,
    lastLogin: null,
    createdAt: '2024-02-15',
  },
  {
    id: 6,
    name: 'Sarah Mulenga',
    email: 'sarah.mulenga@gov.zm',
    phone: '+260 95 678 9012',
    role: 'ministry_official',
    roleLabel: 'Ministry Official',
    constituency: null,
    province: null,
    status: 'active',
    mfaEnabled: true,
    lastLogin: '2024-02-20 08:00',
    createdAt: '2022-11-01',
  },
];

const roles = [
  { value: 'ministry_official', label: 'Ministry Official', count: 45, level: 'National' },
  { value: 'auditor', label: 'Auditor (OAG)', count: 28, level: 'National' },
  { value: 'plgo', label: 'PLGO', count: 10, level: 'Provincial' },
  { value: 'tac_chair', label: 'TAC Chair', count: 10, level: 'Provincial' },
  { value: 'tac_member', label: 'TAC Member', count: 90, level: 'Provincial' },
  { value: 'cdfc_chair', label: 'CDFC Chair', count: 156, level: 'Constituency' },
  { value: 'cdfc_member', label: 'CDFC Member', count: 1248, level: 'Constituency' },
  { value: 'finance_officer', label: 'Finance Officer', count: 250, level: 'Constituency' },
  { value: 'wdc_member', label: 'WDC Member', count: 1872, level: 'Ward' },
  { value: 'mp', label: 'Member of Parliament', count: 156, level: 'Constituency' },
  { value: 'contractor', label: 'Contractor', count: 847, level: 'External' },
];

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = systemUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users, roles, and access permissions
          </p>
        </div>
        <Button className="shadow-sm hover-lift">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,712</div>
            <p className="text-xs text-muted-foreground mt-1">Across all roles</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">4,589</div>
            <p className="text-xs text-muted-foreground mt-1">97.4% of total</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MFA Enabled</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,892</div>
            <p className="text-xs text-muted-foreground mt-1">82.6% adoption</p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Activation</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">123</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting first login</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>
                All registered users with their roles and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">{user.roleLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm">{user.constituency || user.province || 'National'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <Badge variant="success" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="ghost" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLogin || 'Never'}
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : user.status === 'pending' ? (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
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

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
              <CardDescription>System roles and user counts by access level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['National', 'Provincial', 'Constituency', 'Ward', 'External'].map((level) => (
                  <div key={level} className="space-y-3">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest">
                      {level} Level
                    </h3>
                    <div className="grid gap-3">
                      {roles
                        .filter((role) => role.level === level)
                        .map((role) => (
                          <div
                            key={role.value}
                            className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <UserCog className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{role.label}</p>
                                <p className="text-sm text-muted-foreground">{role.level} access</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">{role.count} users</Badge>
                              <Button variant="outline" size="sm">
                                Manage
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <CardDescription>Recent user authentication and access events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    user: 'John Mwale',
                    action: 'Login successful',
                    time: '2024-02-20 14:35',
                    ip: '203.0.113.45',
                    type: 'success',
                  },
                  {
                    user: 'Mary Banda',
                    action: 'Password changed',
                    time: '2024-02-20 09:15',
                    ip: '203.0.113.46',
                    type: 'info',
                  },
                  {
                    user: 'Peter Zulu',
                    action: 'MFA disabled',
                    time: '2024-02-19 16:45',
                    ip: '203.0.113.47',
                    type: 'warning',
                  },
                  {
                    user: 'Grace Phiri',
                    action: 'Role updated',
                    time: '2024-02-20 11:20',
                    ip: '203.0.113.48',
                    type: 'info',
                  },
                ].map((log, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        log.type === 'success' ? 'bg-success/10' :
                        log.type === 'warning' ? 'bg-warning/10' : 'bg-info/10'
                      }`}>
                        <History className={`h-5 w-5 ${
                          log.type === 'success' ? 'text-success' :
                          log.type === 'warning' ? 'text-warning' : 'text-info'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{log.user}</p>
                        <p className="text-sm text-muted-foreground">{log.action}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{log.time}</p>
                      <p className="text-xs">IP: {log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>Role-based access control configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-muted">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Key className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Permission matrix configuration</p>
                  <p className="text-sm text-muted-foreground mt-1">Contact system administrator for changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
