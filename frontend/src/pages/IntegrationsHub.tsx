import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  Database,
  Upload,
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  FileCode,
  Link2,
  Plug,
  QrCode,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSystemIntegrations } from '@/hooks/useSystemIntegrations';
import { format } from 'date-fns';

const documentTemplates = [
  { id: 1, name: 'Project Approval Letter', format: 'PDF', qrEnabled: true, version: '2.1' },
  { id: 2, name: 'Payment Voucher', format: 'PDF', qrEnabled: true, version: '1.5' },
  { id: 3, name: 'Contract Award Notice', format: 'PDF', qrEnabled: true, version: '1.8' },
  { id: 4, name: 'Bursary Confirmation', format: 'PDF', qrEnabled: true, version: '1.3' },
  { id: 5, name: 'Site Visit Report', format: 'PDF', qrEnabled: false, version: '2.0' },
  { id: 6, name: 'Meeting Minutes', format: 'DOCX', qrEnabled: false, version: '1.2' },
  { id: 7, name: 'Grant Agreement', format: 'PDF', qrEnabled: true, version: '1.0' },
  { id: 8, name: 'Expenditure Return Form', format: 'XLSX', qrEnabled: false, version: '3.1' },
];

export default function IntegrationsHub() {
  const { data: integrations, isLoading, error } = useSystemIntegrations();

  const connectedCount = integrations?.filter(s => s.status === 'active').length || 0;
  const pendingCount = integrations?.filter(s => s.status === 'pending').length || 0;

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
      <div>
        <h1 className="text-2xl font-bold">Integrations & Data Pipelines</h1>
        <p className="text-muted-foreground">
          Manage external connections, data imports, and document generation
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Plug className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Systems Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Setup</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Recent Imports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <FileText className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{documentTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Doc Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connections">
            <Plug className="mr-2 h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="imports">
            <Upload className="mr-2 h-4 w-4" />
            Data Imports
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Doc Templates
          </TabsTrigger>
        </TabsList>

        {/* System Connections */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>External System Connections</CardTitle>
                  <CardDescription>
                    Manage integrations with external services
                  </CardDescription>
                </div>
                <Button>
                  <Link2 className="mr-2 h-4 w-4" />
                  Add Connection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {integrations && integrations.length > 0 ? (
                <div className="space-y-4">
                  {integrations.map(system => (
                    <div
                      key={system.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-2 ${
                          system.status === 'active' ? 'bg-success/10' : 'bg-muted'
                        }`}>
                          <Database className={`h-5 w-5 ${
                            system.status === 'active' ? 'text-success' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{system.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{system.integration_type}</span>
                            {system.last_sync_at && (
                              <>
                                <span>•</span>
                                <span>Last sync: {format(new Date(system.last_sync_at), 'MMM d, yyyy HH:mm')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {system.status === 'active' ? (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : system.status === 'error' ? (
                          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Error
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Sync
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No integrations configured yet.</p>
                  <Button className="mt-4">Add First Integration</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Imports */}
        <TabsContent value="imports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Imports</CardTitle>
                <CardDescription>
                  Data imports from external files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent imports.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload New Data</CardTitle>
                <CardDescription>Import data from files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">Drop files here</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    CSV, XLSX up to 10MB
                  </p>
                  <Button variant="outline" size="sm">
                    Browse Files
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Import Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Bank Statement', 'Projects', 'Contractors', 'Bursaries'].map(type => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        className="justify-start"
                      >
                        <FileCode className="mr-2 h-3 w-3" />
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Document Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Templates</CardTitle>
                  <CardDescription>
                    PDF generation templates with QR verification
                  </CardDescription>
                </div>
                <Button>
                  <FileText className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>QR Enabled</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentTemplates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{template.format}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.qrEnabled ? (
                          <QrCode className="h-4 w-4 text-success" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
