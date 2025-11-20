
import React, { useState, useRef, useCallback } from 'react';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Trash2 
} from 'lucide-react';

interface DocumentUploadProps {
  label: string;
  description?: string;
  acceptedTypes?: string[]; // e.g. ['application/pdf', 'image/jpeg']
  maxSizeMB?: number;
  onUploadComplete: (file: File) => void;
  onRemove: () => void;
  isUploaded?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  description,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxSizeMB = 10,
  onUploadComplete,
  onRemove,
  isUploaded = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploaded) {
        setIsDragging(true);
    }
  }, [isUploaded]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    // Size Check
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit.`);
      return false;
    }
    
    // Type Check (Simple extension/mime check)
    // Note: In production, check 'file.type' carefully or use a library.
    // This is a basic check.
    // If acceptedTypes contains generic 'image/*', we check start.
    const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
            const base = type.split('/')[0];
            return file.type.startsWith(base);
        }
        return file.type === type;
    });

    if (!isValidType && acceptedTypes.length > 0) {
       setError(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`);
       return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    setError(null);
    if (!validateFile(file)) return;

    setUploading(true);
    setProgress(0);

    // Simulate Upload
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setFileName(file.name);
          onUploadComplete(file);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploaded) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [isUploaded, onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setFileName(null);
      setProgress(0);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRemove();
  };

  // Success State
  if (isUploaded) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-green-100 text-green-600 rounded-full shrink-0">
             <CheckCircle size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{fileName || label}</p>
            <p className="text-xs text-green-600 font-medium">Upload Complete • Verified</p>
          </div>
        </div>
        <button 
          onClick={handleRemove}
          className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors"
          title="Remove file"
        >
           <Trash2 size={16} />
        </button>
      </div>
    );
  }

  // Uploading State
  if (uploading) {
    return (
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
         <div className="flex items-center gap-3 mb-2">
            <Loader2 size={20} className="text-blue-600 animate-spin" />
            <p className="font-bold text-slate-800 text-sm">Uploading...</p>
            <span className="text-xs text-blue-600 font-mono ml-auto">{progress}%</span>
         </div>
         <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
         </div>
      </div>
    );
  }

  // Default / Drop State
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer group
        ${isDragging 
           ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-1' 
           : error 
             ? 'border-red-300 bg-red-50 hover:border-red-400'
             : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
        }
      `}
    >
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept={acceptedTypes.join(',')}
         onChange={handleFileSelect}
      />

      <div className="flex items-center gap-4">
         <div className={`p-3 rounded-full shrink-0 ${isDragging ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
            {error ? <AlertCircle size={24} className="text-red-500" /> : <UploadCloud size={24} />}
         </div>
         <div className="flex-1">
            {error ? (
               <div>
                  <p className="font-bold text-red-600 text-sm">{error}</p>
                  <p className="text-xs text-red-500 mt-1">Click to try again</p>
               </div>
            ) : (
               <div>
                  <p className="font-bold text-slate-700 text-sm group-hover:text-blue-700">{label}</p>
                  {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
                  <p className="text-[10px] text-slate-400 mt-2">
                     Drag & drop or click to upload (Max {maxSizeMB}MB)
                  </p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
