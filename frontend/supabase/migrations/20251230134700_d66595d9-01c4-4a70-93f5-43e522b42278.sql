
-- =============================================
-- ENUMS FOR NEW MODULES
-- =============================================

-- Procurement status enum
CREATE TYPE public.procurement_status AS ENUM (
  'draft',
  'published',
  'bid_opening',
  'evaluation',
  'awarded',
  'contracted',
  'completed',
  'cancelled'
);

-- Grant status enum
CREATE TYPE public.grant_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'disbursed',
  'completed',
  'rejected'
);

-- Bursary status enum
CREATE TYPE public.bursary_status AS ENUM (
  'submitted',
  'shortlisted',
  'approved',
  'disbursed',
  'rejected',
  'withdrawn'
);

-- Return status enum
CREATE TYPE public.return_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'revision_required'
);

-- Integration status enum
CREATE TYPE public.integration_status AS ENUM (
  'active',
  'inactive',
  'error',
  'pending'
);

-- =============================================
-- PROCUREMENT TABLE
-- =============================================
CREATE TABLE public.procurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  project_id UUID REFERENCES public.projects(id),
  procurement_method TEXT NOT NULL DEFAULT 'open_bidding',
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  contract_value NUMERIC,
  status public.procurement_status NOT NULL DEFAULT 'draft',
  publish_date DATE,
  closing_date DATE,
  bid_opening_date DATE,
  award_date DATE,
  awarded_contractor_id UUID REFERENCES public.contractors(id),
  zppa_reference TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.procurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible procurements"
  ON public.procurements FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create procurements"
  ON public.procurements FOR INSERT
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'cdfc_chair', 'finance_officer']::app_role[])
  );

CREATE POLICY "Authorized users can update procurements"
  ON public.procurements FOR UPDATE
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'cdfc_chair', 'finance_officer']::app_role[])
  );

-- =============================================
-- BUDGETS TABLE
-- =============================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  fiscal_year INTEGER NOT NULL,
  total_allocation NUMERIC NOT NULL DEFAULT 0,
  projects_allocation NUMERIC NOT NULL DEFAULT 0,
  empowerment_allocation NUMERIC NOT NULL DEFAULT 0,
  bursaries_allocation NUMERIC NOT NULL DEFAULT 0,
  admin_allocation NUMERIC NOT NULL DEFAULT 0,
  disbursed_amount NUMERIC NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(constituency_id, fiscal_year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible budgets"
  ON public.budgets FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Admins can manage budgets"
  ON public.budgets FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::app_role[]));

-- =============================================
-- EXPENDITURE RETURNS TABLE
-- =============================================
CREATE TABLE public.expenditure_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  fiscal_year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_received NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  projects_spent NUMERIC NOT NULL DEFAULT 0,
  empowerment_spent NUMERIC NOT NULL DEFAULT 0,
  bursaries_spent NUMERIC NOT NULL DEFAULT 0,
  admin_spent NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  status public.return_status NOT NULL DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(constituency_id, fiscal_year, quarter)
);

ALTER TABLE public.expenditure_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible returns"
  ON public.expenditure_returns FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Finance officers can manage returns"
  ON public.expenditure_returns FOR ALL
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'plgo']::app_role[])
  )
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'plgo']::app_role[])
  );

-- =============================================
-- EMPOWERMENT GRANTS TABLE
-- =============================================
CREATE TABLE public.empowerment_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_number TEXT NOT NULL UNIQUE,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  ward_id UUID REFERENCES public.wards(id),
  applicant_name TEXT NOT NULL,
  applicant_nrc TEXT,
  applicant_phone TEXT,
  applicant_address TEXT,
  group_name TEXT,
  group_size INTEGER,
  grant_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_amount NUMERIC NOT NULL,
  approved_amount NUMERIC,
  status public.grant_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  completion_report TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empowerment_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible grants"
  ON public.empowerment_grants FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create grants"
  ON public.empowerment_grants FOR INSERT
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen']::app_role[])
  );

CREATE POLICY "Authorized users can update grants"
  ON public.empowerment_grants FOR UPDATE
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'plgo', 'finance_officer']::app_role[])
  );

-- =============================================
-- BURSARY APPLICATIONS TABLE
-- =============================================
CREATE TABLE public.bursary_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  ward_id UUID REFERENCES public.wards(id),
  academic_year INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  student_nrc TEXT,
  student_phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_nrc TEXT,
  institution_name TEXT NOT NULL,
  institution_type TEXT NOT NULL,
  program_of_study TEXT,
  year_of_study INTEGER,
  tuition_fees NUMERIC NOT NULL DEFAULT 0,
  accommodation_fees NUMERIC DEFAULT 0,
  book_allowance NUMERIC DEFAULT 0,
  total_requested NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC,
  status public.bursary_status NOT NULL DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  disbursed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bursary_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible bursaries"
  ON public.bursary_applications FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create bursaries"
  ON public.bursary_applications FOR INSERT
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen']::app_role[])
  );

CREATE POLICY "Authorized users can update bursaries"
  ON public.bursary_applications FOR UPDATE
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'plgo', 'finance_officer']::app_role[])
  );

-- =============================================
-- SYSTEM INTEGRATIONS TABLE
-- =============================================
CREATE TABLE public.system_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  integration_type TEXT NOT NULL,
  description TEXT,
  endpoint_url TEXT,
  status public.integration_status NOT NULL DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integrations"
  ON public.system_integrations FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::app_role[]))
  WITH CHECK (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::app_role[]));

CREATE POLICY "Authenticated users can view integrations"
  ON public.system_integrations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- SYSTEM METRICS TABLE
-- =============================================
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system metrics"
  ON public.system_metrics FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::app_role[]));

CREATE POLICY "System can insert metrics"
  ON public.system_metrics FOR INSERT
  WITH CHECK (true);

-- =============================================
-- SECURITY EVENTS TABLE
-- =============================================
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'auditor', 'ministry_official']::app_role[]));

CREATE POLICY "System can insert security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update security events"
  ON public.security_events FOR UPDATE
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::app_role[]));

-- =============================================
-- UPDATE TRIGGERS
-- =============================================
CREATE TRIGGER update_procurements_updated_at
  BEFORE UPDATE ON public.procurements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_expenditure_returns_updated_at
  BEFORE UPDATE ON public.expenditure_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_empowerment_grants_updated_at
  BEFORE UPDATE ON public.empowerment_grants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bursary_applications_updated_at
  BEFORE UPDATE ON public.bursary_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_system_integrations_updated_at
  BEFORE UPDATE ON public.system_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_procurements_constituency ON public.procurements(constituency_id);
CREATE INDEX idx_procurements_status ON public.procurements(status);
CREATE INDEX idx_budgets_constituency_year ON public.budgets(constituency_id, fiscal_year);
CREATE INDEX idx_expenditure_returns_constituency ON public.expenditure_returns(constituency_id);
CREATE INDEX idx_empowerment_grants_constituency ON public.empowerment_grants(constituency_id);
CREATE INDEX idx_empowerment_grants_status ON public.empowerment_grants(status);
CREATE INDEX idx_bursary_applications_constituency ON public.bursary_applications(constituency_id);
CREATE INDEX idx_bursary_applications_status ON public.bursary_applications(status);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_created ON public.security_events(created_at);
CREATE INDEX idx_system_metrics_type ON public.system_metrics(metric_type, recorded_at);
