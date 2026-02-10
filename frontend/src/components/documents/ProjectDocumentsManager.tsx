import { useState } from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Upload,
  QrCode,
  Lock,
  Trash2,
  Eye,
  AlertTriangle,
  Shield,
  FileCheck,
  Loader2,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProjectDocuments,
  useMakeDocumentImmutable,
  useDeleteDocument,
  Document,
} from '@/hooks/useDocuments';
import DocumentQRCode from './DocumentQRCode';
import DocumentUploadDialog from './DocumentUploadDialog';

interface ProjectDocumentsManagerProps {
  projectId: string;
  constituencyId: string;
  wardId?: string;
  readOnly?: boolean;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  application: 'Application Form',
  invoice: 'Invoice / Receipt',
  meeting_minutes: 'Meeting Minutes',
  approval_letter: 'Approval Letter',
  site_photo: 'Site Photo',
  wdc_signoff: 'WDC Sign-off',
  procurement_bid: 'Procurement Bid',
  contract: 'Contract',
  completion_certificate: 'Completion Certificate',
  other: 'Other',
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProjectDocumentsManager = ({
  projectId,
  constituencyId,
  wardId,
  readOnly = false,
}: ProjectDocumentsManagerProps) => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: documents, isLoading, refetch } = useProjectDocuments(projectId);
  const makeImmutableMutation = useMakeDocumentImmutable();
  const deleteMutation = useDeleteDocument();

  const handleViewQR = (doc: Document) => {
    setSelectedDocument(doc);
    setShowQRDialog(true);
  };

  const handleSign = (doc: Document) => {
    setSelectedDocument(doc);
    setShowSignDialog(true);
  };

  const handleDelete = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  const confirmSign = async () => {
    if (!selectedDocument) return;
    
    await makeImmutableMutation.mutateAsync(selectedDocument.id);
    setShowSignDialog(false);
    setSelectedDocument(null);
    refetch();
  };

  const confirmDelete = async () => {
    if (!selectedDocument) return;
    
    await deleteMutation.mutateAsync(selectedDocument);
    setShowDeleteDialog(false);
    setSelectedDocument(null);
    refetch();
  };

  const handleViewDocument = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Compliance & Evidence</CardTitle>
                <CardDescription>
                  Official documents and evidence for this project
                </CardDescription>
              </div>
            </div>
            {!readOnly && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium truncate max-w-[200px]" title={doc.file_name}>
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {doc.is_immutable ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">
                          <Lock className="h-3 w-3 mr-1" />
                          Signed & Locked
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <FileText className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDocument(doc)}
                          title="View Document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewQR(doc)}
                          title="View QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        {!readOnly && !doc.is_immutable && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSign(doc)}
                              title="Digitally Sign"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc)}
                              title="Delete"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {doc.is_immutable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDocument(doc)}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No Documents</h3>
              <p className="text-muted-foreground mb-4">
                No evidence documents have been uploaded for this project yet.
              </p>
              {!readOnly && (
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        projectId={projectId}
        constituencyId={constituencyId}
        wardId={wardId}
        onSuccess={() => refetch()}
      />

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Document Verification QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to verify the authenticity of this document.
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="flex flex-col items-center gap-4 py-4">
              <DocumentQRCode
                documentId={selectedDocument.id}
                documentName={selectedDocument.file_name}
                size={180}
                showActions={true}
              />
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-mono text-xs break-all">
                  Hash: {selectedDocument.file_hash.substring(0, 32)}...
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign/Lock Confirmation Dialog */}
      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Digitally Sign This Document
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to <strong>permanently lock</strong> this document in the National Digital Archives.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                <p className="font-medium mb-1">⚠️ This action cannot be undone</p>
                <ul className="text-sm space-y-1">
                  <li>• The document will be marked as officially signed</li>
                  <li>• It cannot be edited or deleted after signing</li>
                  <li>• Your user role will be recorded as the signatory</li>
                  <li>• The timestamp will be permanently recorded</li>
                </ul>
              </div>
              {selectedDocument && (
                <p className="text-sm">
                  Document: <strong>{selectedDocument.file_name}</strong>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={makeImmutableMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSign}
              disabled={makeImmutableMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {makeImmutableMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Confirm Digital Signature
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
              {selectedDocument && (
                <p className="mt-2">
                  Document: <strong>{selectedDocument.file_name}</strong>
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectDocumentsManager;
