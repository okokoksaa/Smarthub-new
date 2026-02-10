-- Create WDC sign-offs table to track meeting minutes and chair approvals for projects
CREATE TABLE public.wdc_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES public.wards(id),
  meeting_id UUID REFERENCES public.meetings(id),
  meeting_date DATE NOT NULL,
  meeting_minutes_url TEXT,
  chair_name TEXT NOT NULL,
  chair_nrc TEXT,
  chair_signed BOOLEAN NOT NULL DEFAULT false,
  chair_signed_at TIMESTAMP WITH TIME ZONE,
  chair_signature TEXT,
  attendees_count INTEGER NOT NULL DEFAULT 0,
  quorum_met BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.wdc_signoffs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view WDC sign-offs for accessible projects"
ON public.wdc_signoffs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = wdc_signoffs.project_id
    AND can_access_constituency(auth.uid(), p.constituency_id)
  )
);

CREATE POLICY "Authorized users can create WDC sign-offs"
ON public.wdc_signoffs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = wdc_signoffs.project_id
    AND can_access_constituency(auth.uid(), p.constituency_id)
  )
  AND has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'cdfc_chair'::app_role, 'cdfc_member'::app_role, 'wdc_member'::app_role])
);

CREATE POLICY "Authorized users can update WDC sign-offs"
ON public.wdc_signoffs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = wdc_signoffs.project_id
    AND can_access_constituency(auth.uid(), p.constituency_id)
  )
  AND has_any_role(auth.uid(), ARRAY['super_admin'::app_role, 'cdfc_chair'::app_role, 'wdc_member'::app_role])
);

-- Add trigger for updated_at
CREATE TRIGGER update_wdc_signoffs_updated_at
  BEFORE UPDATE ON public.wdc_signoffs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_wdc_signoffs_project_id ON public.wdc_signoffs(project_id);