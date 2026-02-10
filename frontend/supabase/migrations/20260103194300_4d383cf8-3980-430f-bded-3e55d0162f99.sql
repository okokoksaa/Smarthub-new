-- Create a type for the verification response
CREATE TYPE public.document_verification_result AS (
  valid BOOLEAN,
  document_type TEXT,
  file_hash TEXT,
  upload_timestamp TIMESTAMPTZ,
  project_id UUID,
  project_name TEXT,
  project_status TEXT,
  uploader_role TEXT,
  is_immutable BOOLEAN
);

-- Create the public verification function
CREATE OR REPLACE FUNCTION public.verify_document_public(doc_id UUID)
RETURNS public.document_verification_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.document_verification_result;
  doc_record RECORD;
  uploader_role_text TEXT;
BEGIN
  -- Query the document with project info
  SELECT 
    d.id,
    d.document_type,
    d.file_hash,
    d.created_at,
    d.project_id,
    d.uploader_id,
    d.is_immutable,
    p.name as project_name,
    p.status as project_status
  INTO doc_record
  FROM public.documents d
  LEFT JOIN public.projects p ON p.id = d.project_id
  WHERE d.id = doc_id;
  
  -- If no document found, return invalid result
  IF doc_record.id IS NULL THEN
    result.valid := false;
    RETURN result;
  END IF;
  
  -- Get the uploader's role (sanitized - just the role name, not identity)
  SELECT ur.role::text
  INTO uploader_role_text
  FROM public.user_roles ur
  WHERE ur.user_id = doc_record.uploader_id
  LIMIT 1;
  
  -- If no role found, default to 'Official'
  IF uploader_role_text IS NULL THEN
    uploader_role_text := 'Official';
  END IF;
  
  -- Format the role for display
  uploader_role_text := REPLACE(INITCAP(REPLACE(uploader_role_text, '_', ' ')), 'Cdfc', 'CDFC');
  uploader_role_text := REPLACE(uploader_role_text, 'Wdc', 'WDC');
  uploader_role_text := REPLACE(uploader_role_text, 'Tac', 'TAC');
  uploader_role_text := REPLACE(uploader_role_text, 'Plgo', 'PLGO');
  
  -- Build the result
  result.valid := true;
  result.document_type := doc_record.document_type::text;
  result.file_hash := doc_record.file_hash;
  result.upload_timestamp := doc_record.created_at;
  result.project_id := doc_record.project_id;
  result.project_name := doc_record.project_name;
  result.project_status := doc_record.project_status::text;
  result.uploader_role := uploader_role_text;
  result.is_immutable := doc_record.is_immutable;
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.verify_document_public(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_document_public(UUID) TO authenticated;