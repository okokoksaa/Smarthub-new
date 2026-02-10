import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Document type enum matching database
export type DocumentType =
  | 'application'
  | 'invoice'
  | 'meeting_minutes'
  | 'approval_letter'
  | 'site_photo'
  | 'wdc_signoff'
  | 'procurement_bid'
  | 'contract'
  | 'completion_certificate'
  | 'other';

// Document interface
export interface Document {
  id: string;
  project_id: string | null;
  uploader_id: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  file_hash: string;
  document_type: DocumentType;
  description: string | null;
  is_immutable: boolean;
  immutable_at: string | null;
  immutable_by: string | null;
  constituency_id: string;
  ward_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  project_id?: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  file_hash: string;
  document_type: DocumentType;
  description?: string;
  constituency_id: string;
  ward_id?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentFilters {
  project_id?: string;
  constituency_id?: string;
  ward_id?: string;
  document_type?: DocumentType;
  is_immutable?: boolean;
  page?: number;
  limit?: number;
}

// Generate SHA-256 hash from file
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hook to fetch documents with filters (via API)
export const useDocuments = (filters: DocumentFilters = {}) => {
  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.constituency_id) params.append('constituency_id', filters.constituency_id);
      if (filters.ward_id) params.append('ward_id', filters.ward_id);
      if (filters.document_type) params.append('document_type', filters.document_type);
      if (filters.is_immutable !== undefined) params.append('is_immutable', String(filters.is_immutable));
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const { data } = await api.get(`/documents?${params.toString()}`);
      return data;
    },
  });
};

// Hook to fetch documents for a project
export const useProjectDocuments = (projectId?: string) => {
  return useQuery({
    queryKey: ['documents', 'project', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data } = await api.get(`/documents/project/${projectId}`);
      return data.data as Document[];
    },
    enabled: !!projectId,
  });
};

// Hook to fetch documents for a constituency
export const useConstituencyDocuments = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['documents', 'constituency', constituencyId],
    queryFn: async () => {
      if (!constituencyId) return [];

      const { data } = await api.get(`/documents/constituency/${constituencyId}`);
      return data.data as Document[];
    },
    enabled: !!constituencyId,
  });
};

// Hook to get document statistics for a constituency
export const useDocumentStatistics = (constituencyId?: string) => {
  return useQuery({
    queryKey: ['documents', 'statistics', constituencyId],
    queryFn: async () => {
      if (!constituencyId) return null;

      const { data } = await api.get(`/documents/statistics/${constituencyId}`);
      return data.data;
    },
    enabled: !!constituencyId,
  });
};

// Hook to verify document by hash (for QR verification)
export const useVerifyDocument = () => {
  return useMutation({
    mutationFn: async (fileHash: string) => {
      const { data } = await api.post('/documents/verify', { file_hash: fileHash });
      return data.data;
    },
  });
};

// Hook to upload document (file to storage, then create record via API)
export const useUploadDocument = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      documentData
    }: {
      file: File;
      documentData: Omit<CreateDocumentData, 'file_url' | 'file_hash' | 'file_name' | 'file_size' | 'mime_type'>
    }) => {
      // Generate file hash
      const fileHash = await generateFileHash(file);

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${documentData.constituency_id}/${documentData.project_id || 'general'}/${Date.now()}_${fileHash.substring(0, 8)}.${fileExt}`;

      // Upload to Supabase storage (this is fine as direct upload)
      const { error: uploadError } = await supabase.storage
        .from('cdf-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cdf-documents')
        .getPublicUrl(filePath);

      // Create document record via API
      const { data } = await api.post('/documents', {
        project_id: documentData.project_id || null,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        file_hash: fileHash,
        document_type: documentData.document_type,
        description: documentData.description || null,
        constituency_id: documentData.constituency_id,
        ward_id: documentData.ward_id || null,
        metadata: documentData.metadata || null,
      });

      return data.data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`Document "${data.file_name}" uploaded successfully`);
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Failed to upload document';
      toast.error(message);
    },
  });
};

// Hook to create document record (without file upload - for when file is already uploaded)
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentData: CreateDocumentData) => {
      const { data } = await api.post('/documents', documentData);
      return data.data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`Document "${data.file_name}" created successfully`);
    },
    onError: (error: any) => {
      console.error('Create document error:', error);
      const message = error.response?.data?.message || 'Failed to create document';
      toast.error(message);
    },
  });
};

// Hook to make document immutable
export const useMakeDocumentImmutable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await api.post(`/documents/${documentId}/immutable`);
      return data.data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document marked as immutable');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to make document immutable';
      toast.error(message);
    },
  });
};

// Hook to delete document (only non-immutable)
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      await api.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete document';
      toast.error(message);
    },
  });
};
