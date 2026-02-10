import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Globe,
  Search,
  MapPin,
  Wallet,
  FolderKanban,
  CheckCircle2,
  Clock,
  QrCode,
  MessageSquare,
  Download,
  ExternalLink,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  usePublicProjects,
  usePublicConstituencies,
  useNationalStats,
  useSubmitFeedback,
  type FeedbackSubmission,
} from '@/hooks/usePublicPortal';

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `K${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `K${(amount / 1000000).toFixed(1)}M`;
  }
  return `K${amount.toLocaleString()}`;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PublicPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [constituencyFilter, setConstituencyFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackSubmission>>({
    feedback_type: 'inquiry',
  });

  // API Queries
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = usePublicProjects({
    constituencyId: constituencyFilter !== 'all' ? constituencyFilter : undefined,
    sector: sectorFilter !== 'all' ? sectorFilter : undefined,
    search: searchQuery || undefined,
  });

  const { data: constituencies, isLoading: constituenciesLoading } = usePublicConstituencies();
  const { data: nationalStats, isLoading: statsLoading } = useNationalStats();
  const submitFeedback = useSubmitFeedback();

  const handleFeedbackSubmit = () => {
    if (feedbackData.subject && feedbackData.message && feedbackData.feedback_type) {
      submitFeedback.mutate(feedbackData as FeedbackSubmission, {
        onSuccess: () => {
          setFeedbackOpen(false);
          setFeedbackData({ feedback_type: 'inquiry' });
        },
      });
    }
  };

  const projects = projectsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Public Header */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Globe className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CDF Public Transparency Portal</h1>
            <p className="text-muted-foreground">
              Track Constituency Development Fund projects in your area
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-background">
            <CheckCircle2 className="mr-1 h-3 w-3 text-success" />
            Real-time Data
          </Badge>
          <Badge variant="outline" className="bg-background">
            <QrCode className="mr-1 h-3 w-3" />
            QR Verification
          </Badge>
          <Badge variant="outline" className="bg-background">
            <MessageSquare className="mr-1 h-3 w-3" />
            Submit Feedback
          </Badge>
        </div>
      </div>

      {/* National Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget (2024)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(nationalStats?.total_budget_allocated || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {nationalStats?.total_constituencies || 156} constituencies
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {nationalStats?.projects_by_status?.implementation?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">
                  {nationalStats?.projects_by_status?.completed?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">This fiscal year</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {nationalStats?.national_utilization_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">National average</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Projects</CardTitle>
          <CardDescription>Find CDF projects by name, constituency, or sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={constituencyFilter} onValueChange={setConstituencyFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Constituency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Constituencies</SelectItem>
                {constituencies?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                <SelectItem value="water_sanitation">Water & Sanitation</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="community_development">Community Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Published Projects</CardTitle>
          <CardDescription>
            Approved CDF projects available for public viewing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <LoadingSkeleton />
          ) : projectsError ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-5 w-5 mr-2" />
              Failed to load projects. Please try again.
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Constituency</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.id.slice(0, 8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {project.constituency_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.sector}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(project.budget)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.status === 'completed' ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20">
                          Completed
                        </Badge>
                      ) : project.status === 'implementation' ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Approved</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="View Details">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Verify Document">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Constituency Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Constituency Performance</CardTitle>
          <CardDescription>
            Compare budget utilization and project completion across constituencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {constituenciesLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-4">
              {constituencies?.slice(0, 10).map((constituency) => {
                const utilizationPercent = constituency.utilization_rate || 0;
                return (
                  <div key={constituency.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{constituency.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {constituency.completed_projects}/{constituency.total_projects} projects completed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(constituency.disbursed_amount)} /{' '}
                          {formatCurrency(constituency.total_budget)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {utilizationPercent}% utilized
                        </p>
                      </div>
                    </div>
                    <Progress value={utilizationPercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="pt-6 text-center">
            <QrCode className="mx-auto h-10 w-10 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Verify Document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Scan QR code to verify document authenticity
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="/verify">Start Verification</a>
            </Button>
          </CardContent>
        </Card>

        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogTrigger asChild>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="mx-auto h-10 w-10 mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Submit Feedback</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Report issues or provide feedback on projects
                </p>
                <Button variant="outline" className="w-full">
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Feedback</DialogTitle>
              <DialogDescription>
                Share your feedback, suggestions, or report issues about CDF projects.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Feedback Type</Label>
                <Select
                  value={feedbackData.feedback_type}
                  onValueChange={(v) =>
                    setFeedbackData({ ...feedbackData, feedback_type: v as FeedbackSubmission['feedback_type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inquiry">General Inquiry</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="appreciation">Appreciation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  placeholder="Brief subject of your feedback"
                  value={feedbackData.subject || ''}
                  onChange={(e) => setFeedbackData({ ...feedbackData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <Textarea
                  placeholder="Provide details about your feedback..."
                  rows={4}
                  value={feedbackData.message || ''}
                  onChange={(e) => setFeedbackData({ ...feedbackData, message: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Your Name (optional)</Label>
                  <Input
                    placeholder="Name"
                    value={feedbackData.contact_name || ''}
                    onChange={(e) => setFeedbackData({ ...feedbackData, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone (optional)</Label>
                  <Input
                    placeholder="Phone number"
                    value={feedbackData.contact_phone || ''}
                    onChange={(e) => setFeedbackData({ ...feedbackData, contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleFeedbackSubmit}
                disabled={!feedbackData.subject || !feedbackData.message || submitFeedback.isPending}
              >
                {submitFeedback.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="pt-6 text-center">
            <Download className="mx-auto h-10 w-10 mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Download Reports</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Access published constituency reports
            </p>
            <Button variant="outline" className="w-full">
              Browse Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
