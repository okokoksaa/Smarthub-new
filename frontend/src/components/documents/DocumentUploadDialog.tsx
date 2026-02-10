import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, X, Loader2, AlertCircle } from 'lucide-react';
import { useUploadDocument, DocumentType } from '@/hooks/useDocuments';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  constituencyId: string;
  wardId?: string;
  onSuccess?: () => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'application', label: 'Application Form' },
  { value: 'invoice', label: 'Invoice / Receipt' },
  { value: 'meeting_minutes', label: 'Meeting Minutes' },
  { value: 'approval_letter', label: 'Approval Letter' },
  { value: 'site_photo', label: 'Site Photo' },
  { value: 'wdc_signoff', label: 'WDC Sign-off Document' },
  { value: 'procurement_bid', label: 'Procurement Bid' },
  { value: 'contract', label: 'Contract Document' },
  { value: 'completion_certificate', label: 'Completion Certificate' },
  { value: 'other', label: 'Other Document' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const DocumentUploadDialog = ({
  open,
  onOpenChange,
  projectId,
  constituencyId,
  wardId,
  onSuccess,
}: DocumentUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else {
        setError('Invalid file type. Please upload a valid document.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const handleSubmit = async () => {
    if (!file || !documentType) {
      setError('Please select a file and document type.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        file,
        documentData: {
          project_id: projectId,
          document_type: documentType,
          description: description || undefined,
          constituency_id: constituencyId,
          ward_id: wardId,
        },
      });

      // Reset form
      setFile(null);
      setDocumentType('');
      setDescription('');
      setError(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError('Failed to upload document. Please try again.');
    }
  };

  const handleClose = () => {
    if (!uploadMutation.isPending) {
      setFile(null);
      setDocumentType('');
      setDescription('');
      setError(null);
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Official Document
          </DialogTitle>
          <DialogDescription>
            Upload evidence documents for this project. Files will be hashed for verification.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
              ${file ? 'bg-success/5 border-success' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-success" />
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium text-foreground">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className={`h-12 w-12 mx-auto ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <p className="font-medium text-foreground">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (PDF, images, Word, Excel - max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type *</Label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file || !documentType || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading & Hashing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
