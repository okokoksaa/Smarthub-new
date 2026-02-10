-- =====================================================
-- SPRINT 2: INTEGRITY & EVIDENCE LAYER
-- Schema Remediation + Document System of Record
-- =====================================================

-- 1. SCHEMA REMEDIATION: Add ward_id to audit_logs
ALTER TABLE public.audit_logs 
ADD COLUMN ward_id UUID REFERENCES public.wards(id);

-- 2. SCHEMA REMEDIATION: Add ward_id to budgets
ALTER TABLE public.budgets 
ADD COLUMN ward_id UUID REFERENCES public.wards(id);

-- 3. Create document_type enum
CREATE TYPE public.document_type AS ENUM (
  'application',
  'invoice', 
  'meeting_minutes',
  'approval_letter',
  'site_photo',
  'wdc_signoff',
  'procurement_bid',
  'contract',
  'completion_certificate',
  'other'
);

-- 4. Create documents table (System of Record)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES public.profiles(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  file_hash TEXT NOT NULL, -- SHA-256 hash for QR verification system
  document_type public.document_type NOT NULL,
  description TEXT,
  is_immutable BOOLEAN NOT NULL DEFAULT false,
  immutable_at TIMESTAMP WITH TIME ZONE,
  immutable_by UUID REFERENCES public.profiles(id),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  ward_id UUID REFERENCES public.wards(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create indexes for performance
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_constituency_id ON public.documents(constituency_id);
CREATE INDEX idx_documents_ward_id ON public.documents(ward_id);
CREATE INDEX idx_documents_file_hash ON public.documents(file_hash);
CREATE INDEX idx_documents_document_type ON public.documents(document_type);
CREATE INDEX idx_audit_logs_ward_id ON public.audit_logs(ward_id);
CREATE INDEX idx_budgets_ward_id ON public.budgets(ward_id);

-- 6. Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for documents table

-- SELECT: Users can view documents for accessible constituencies
CREATE POLICY "Users can view accessible documents"
ON public.documents
FOR SELECT
USING (can_access_constituency(auth.uid(), constituency_id));

-- INSERT: Authorized users can upload documents
CREATE POLICY "Authorized users can upload documents"
ON public.documents
FOR INSERT
WITH CHECK (
  can_access_constituency(auth.uid(), constituency_id) AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'ministry_official'::app_role, 'plgo'::app_role, 'cdfc_chair'::app_role, 'cdfc_member'::app_role, 'finance_officer'::app_role, 'wdc_member'::app_role])
);

-- UPDATE: Only non-immutable documents can be updated by authorized users
CREATE POLICY "Authorized users can update non-immutable documents"
ON public.documents
FOR UPDATE
USING (
  is_immutable = false AND
  can_access_constituency(auth.uid(), constituency_id) AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'ministry_official'::app_role, 'plgo'::app_role, 'cdfc_chair'::app_role, 'finance_officer'::app_role])
);

-- DELETE: Only super_admin can delete, and only non-immutable documents
CREATE POLICY "Super admins can delete non-immutable documents"
ON public.documents
FOR DELETE
USING (
  is_immutable = false AND
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 8. Update audit_logs RLS to include ward filtering
DROP POLICY IF EXISTS "Auditors can view all audit logs" ON public.audit_logs;

CREATE POLICY "Users can view accessible audit logs"
ON public.audit_logs
FOR SELECT
USING (
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'auditor'::app_role, 'ministry_official'::app_role])
  OR (
    constituency_id IS NOT NULL AND can_access_constituency(auth.uid(), constituency_id)
  )
);

-- 9. Update budgets RLS to include ward-level access
DROP POLICY IF EXISTS "Users can view accessible budgets" ON public.budgets;

CREATE POLICY "Users can view accessible budgets"
ON public.budgets
FOR SELECT
USING (can_access_constituency(auth.uid(), constituency_id));

-- 10. Trigger for documents updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- 11. Function to make a document immutable (for approval workflow)
CREATE OR REPLACE FUNCTION public.make_document_immutable(doc_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.documents
  SET 
    is_immutable = true,
    immutable_at = now(),
    immutable_by = auth.uid()
  WHERE id = doc_id
    AND is_immutable = false;
  
  RETURN FOUND;
END;
$$;

-- 12. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cdf-documents',
  'cdf-documents',
  false, -- Private bucket with RLS
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- 13. Storage bucket RLS policies

-- SELECT: Users can view documents in their accessible constituencies
CREATE POLICY "Users can view accessible files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cdf-documents' AND
  (
    -- Super admins and ministry officials can view all
    has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'ministry_official'::app_role, 'auditor'::app_role])
    OR
    -- Others must have access via document record
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_url LIKE '%' || storage.objects.name
        AND can_access_constituency(auth.uid(), d.constituency_id)
    )
  )
);

-- INSERT: Authenticated users with proper roles can upload
CREATE POLICY "Authorized users can upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cdf-documents' AND
  auth.uid() IS NOT NULL AND
  has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'ministry_official'::app_role, 'plgo'::app_role, 'cdfc_chair'::app_role, 'cdfc_member'::app_role, 'finance_officer'::app_role, 'wdc_member'::app_role])
);

-- UPDATE: Users can update their own uploads if not immutable
CREATE POLICY "Users can update own uploads"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cdf-documents' AND
  auth.uid() IS NOT NULL AND
  NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_url LIKE '%' || storage.objects.name
      AND d.is_immutable = true
  )
);

-- DELETE: Only super_admin can delete files, and only if not immutable
CREATE POLICY "Super admins can delete non-immutable files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cdf-documents' AND
  has_role(auth.uid(), 'super_admin'::app_role) AND
  NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_url LIKE '%' || storage.objects.name
      AND d.is_immutable = true
  )
);