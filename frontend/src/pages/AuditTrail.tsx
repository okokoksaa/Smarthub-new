import { useState } from 'react';
import { Search, Filter, Download, Shield, Clock, FileCheck, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockAuditEntries } from '@/data/mockData';

const eventTypeStyles: Record<string, { bg: string; text: string }> = {
  PROJECT_APPROVED: { bg: 'bg-success/10', text: 'text-success' },
  PAYMENT_SUBMITTED: { bg: 'bg-info/10', text: 'text-info' },
  CDFC_VOTE: { bg: 'bg-primary/10', text: 'text-primary' },
  DOCUMENT_UPLOADED: { bg: 'bg-warning/10', text: 'text-warning' },
};

const roleLabels: Record<string, string> = {
  plgo: 'PLGO',
  finance_officer: 'Finance Officer',
  cdfc_chair: 'CDFC Chair',
  wdc_member: 'WDC Member',
  ministry_official: 'Ministry Official',
  auditor: 'Auditor',
};

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  const filteredEntries = mockAuditEntries.filter((entry) => {
    const matchesSearch =
      entry.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || entry.eventType === eventFilter;

    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <FileCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
            <p className="text-muted-foreground">
              Immutable record of all system actions and decisions
            </p>
          </div>
        </div>
        <Button variant="outline" className="group">
          <Download className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Export Logs
        </Button>
      </div>

      {/* Integrity Status */}
      <Card className="border-success/20 bg-gradient-to-r from-success/5 to-transparent">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-success">Audit Log Integrity Verified</p>
              <p className="text-sm text-muted-foreground">
                Last verification: {new Date().toLocaleString()} • Hash chain intact
              </p>
            </div>
          </div>
          <Badge variant="success" className="px-3 py-1 text-sm">
            Blockchain-Secured
          </Badge>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-md transition-all border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24,567</div>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Entries</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 transition-transform group-hover:scale-110">
              <Clock className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,234</div>
            <p className="text-sm text-muted-foreground">Since midnight</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Users</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 transition-transform group-hover:scale-110">
              <FileCheck className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-sm text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-all border-success/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Integrity Score</CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 transition-transform group-hover:scale-110">
              <Shield className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">100%</div>
            <p className="text-sm text-muted-foreground">Fully verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="PROJECT_APPROVED">Project Approved</SelectItem>
            <SelectItem value="PAYMENT_SUBMITTED">Payment Submitted</SelectItem>
            <SelectItem value="CDFC_VOTE">CDFC Vote</SelectItem>
            <SelectItem value="DOCUMENT_UPLOADED">Document Uploaded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-[300px]">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const style = eventTypeStyles[entry.eventType] || { bg: 'bg-muted', text: 'text-muted-foreground' };
                return (
                  <TableRow key={entry.id} className="group hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${style.bg} ${style.text} border-0`}>
                        {entry.eventType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{entry.actor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabels[entry.actor.role] || entry.actor.role}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{entry.entity.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {entry.entity.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {entry.description}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
