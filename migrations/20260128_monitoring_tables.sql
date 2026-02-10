-- =============================================
-- M&E (Monitoring & Evaluation) Tables
-- Site visits with GPS geofencing, issues/defects tracking
-- =============================================

-- Add geofence columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS geofence_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS geofence_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geofence_radius INTEGER DEFAULT 500;

COMMENT ON COLUMN public.projects.geofence_lat IS 'Project location latitude for GPS verification';
COMMENT ON COLUMN public.projects.geofence_lng IS 'Project location longitude for GPS verification';
COMMENT ON COLUMN public.projects.geofence_radius IS 'Allowed radius in meters from project center';

-- Site Visits Table
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  visit_type TEXT NOT NULL CHECK (visit_type IN ('scheduled', 'unscheduled', 'follow_up', 'final_inspection')),
  visitor_id UUID NOT NULL REFERENCES auth.users(id),

  -- GPS Data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  gps_accuracy DECIMAL(6, 2),
  geofence_distance DECIMAL(8, 2),
  geofence_valid BOOLEAN NOT NULL DEFAULT true,

  -- Visit Details
  physical_progress INTEGER NOT NULL CHECK (physical_progress >= 0 AND physical_progress <= 100),
  outcome TEXT NOT NULL CHECK (outcome IN ('satisfactory', 'needs_improvement', 'unsatisfactory', 'work_stopped', 'project_complete')),
  observations TEXT NOT NULL,
  issues_found TEXT,
  recommendations TEXT,

  -- Site Conditions
  workers_present INTEGER,
  materials_on_site TEXT,
  equipment_on_site TEXT,
  safety_compliance TEXT,

  -- Evidence
  photo_ids UUID[],
  evidence_score INTEGER,
  evidence_max_score INTEGER DEFAULT 100,
  evidence_rating TEXT CHECK (evidence_rating IN ('excellent', 'good', 'fair', 'weak', 'insufficient')),
  evidence_factors JSONB,

  -- Timestamps
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible site visits"
  ON public.site_visits FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create site visits"
  ON public.site_visits FOR INSERT
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'cdfc_chair', 'tac_chair', 'tac_member', 'finance_officer']::app_role[])
  );

-- Project Issues/Defects Table
CREATE TABLE IF NOT EXISTS public.project_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  site_visit_id UUID REFERENCES public.site_visits(id),

  category TEXT NOT NULL CHECK (category IN ('quality', 'safety', 'delay', 'cost_overrun', 'materials', 'workmanship', 'design', 'environmental', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  corrective_action TEXT,
  resolution TEXT,

  photo_ids UUID[],

  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'deferred')),

  reported_by UUID REFERENCES auth.users(id),
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible issues"
  ON public.project_issues FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create issues"
  ON public.project_issues FOR INSERT
  WITH CHECK (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'cdfc_chair', 'tac_chair', 'tac_member', 'finance_officer']::app_role[])
  );

CREATE POLICY "Authorized users can update issues"
  ON public.project_issues FOR UPDATE
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'cdfc_chair', 'tac_chair']::app_role[])
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_site_visits_project ON public.site_visits(project_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_constituency ON public.site_visits(constituency_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON public.site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_project_issues_project ON public.project_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_status ON public.project_issues(status);
CREATE INDEX IF NOT EXISTS idx_project_issues_severity ON public.project_issues(severity);

-- Triggers for updated_at
CREATE TRIGGER update_site_visits_updated_at
  BEFORE UPDATE ON public.site_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_project_issues_updated_at
  BEFORE UPDATE ON public.project_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- CAPR Tracking for Ministry (90-day rule)
-- =============================================

CREATE TABLE IF NOT EXISTS public.capr_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  fiscal_year INTEGER NOT NULL,

  -- First sitting date (starts 90-day clock)
  first_sitting_date DATE NOT NULL,
  due_date DATE NOT NULL, -- Computed: first_sitting_date + 90 days

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'overdue')),

  -- Submission details
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),

  -- Required artifacts
  project_list_approved BOOLEAN DEFAULT false,
  budget_approved BOOLEAN DEFAULT false,
  cdfc_minutes_uploaded BOOLEAN DEFAULT false,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(constituency_id, fiscal_year)
);

ALTER TABLE public.capr_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible CAPR cycles"
  ON public.capr_cycles FOR SELECT
  USING (
    can_access_constituency(auth.uid(), constituency_id) OR
    has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'auditor']::app_role[])
  );

CREATE POLICY "Ministry can manage CAPR cycles"
  ON public.capr_cycles FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::app_role[]));

CREATE INDEX IF NOT EXISTS idx_capr_cycles_constituency ON public.capr_cycles(constituency_id);
CREATE INDEX IF NOT EXISTS idx_capr_cycles_status ON public.capr_cycles(status);
CREATE INDEX IF NOT EXISTS idx_capr_cycles_due_date ON public.capr_cycles(due_date);

CREATE TRIGGER update_capr_cycles_updated_at
  BEFORE UPDATE ON public.capr_cycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- Red-Flag Analytics Tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.red_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What triggered the flag
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'price_clustering', 'bid_timing_anomaly', 'document_similarity',
    'ip_clustering', 'sequential_pricing', 'single_bidder_pattern',
    'late_payment', 'budget_overrun', 'progress_discrepancy'
  )),

  -- Affected entities
  entity_type TEXT NOT NULL CHECK (entity_type IN ('procurement', 'payment', 'project', 'contractor')),
  entity_id UUID NOT NULL,
  constituency_id UUID REFERENCES public.constituencies(id),

  -- Flag details
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score DECIMAL(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB, -- Supporting data for the flag

  -- Related entities (for pattern detection)
  related_entities UUID[],

  -- Status
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'confirmed', 'dismissed', 'escalated')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.red_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors and admins can view red flags"
  ON public.red_flags FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'auditor', 'ministry_official']::app_role[]));

CREATE POLICY "Auditors can update red flags"
  ON public.red_flags FOR UPDATE
  USING (has_any_role(auth.uid(), ARRAY['super_admin', 'auditor']::app_role[]));

CREATE INDEX IF NOT EXISTS idx_red_flags_type ON public.red_flags(flag_type);
CREATE INDEX IF NOT EXISTS idx_red_flags_entity ON public.red_flags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_red_flags_status ON public.red_flags(status);
CREATE INDEX IF NOT EXISTS idx_red_flags_severity ON public.red_flags(severity);

CREATE TRIGGER update_red_flags_updated_at
  BEFORE UPDATE ON public.red_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- Bank Reconciliation Tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),

  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  statement_period_start DATE NOT NULL,
  statement_period_end DATE NOT NULL,

  opening_balance NUMERIC NOT NULL,
  closing_balance NUMERIC NOT NULL,
  total_credits NUMERIC NOT NULL DEFAULT 0,
  total_debits NUMERIC NOT NULL DEFAULT 0,

  document_id UUID REFERENCES public.documents(id),

  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'matched', 'reconciled', 'error')),

  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reconciled_by UUID REFERENCES auth.users(id),
  reconciled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES public.bank_statements(id) ON DELETE CASCADE,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),

  transaction_date DATE NOT NULL,
  value_date DATE,
  reference TEXT,
  description TEXT NOT NULL,

  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,

  -- Matching
  matched_payment_id UUID REFERENCES public.payments(id),
  match_confidence DECIMAL(5, 2),
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'auto_matched', 'manual_matched', 'exception')),

  exception_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible bank statements"
  ON public.bank_statements FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Finance officers can manage bank statements"
  ON public.bank_statements FOR ALL
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'plgo']::app_role[])
  );

CREATE POLICY "Users can view accessible bank transactions"
  ON public.bank_transactions FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE INDEX IF NOT EXISTS idx_bank_statements_constituency ON public.bank_statements(constituency_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_statement ON public.bank_transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_match ON public.bank_transactions(match_status);

-- =============================================
-- Legal & Compliance Tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id),
  project_id UUID REFERENCES public.projects(id),
  procurement_id UUID REFERENCES public.procurements(id),

  contract_number TEXT NOT NULL UNIQUE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('works', 'goods', 'services', 'consultancy')),

  contractor_id UUID REFERENCES public.contractors(id),
  contractor_name TEXT NOT NULL,

  contract_value NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Local preference
  is_local_contractor BOOLEAN DEFAULT false,
  local_preference_justification TEXT, -- Required if non-local

  -- Documents
  contract_document_id UUID REFERENCES public.documents(id),

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'disputed')),

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID REFERENCES public.constituencies(id),

  opinion_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,

  -- Clause anchoring
  related_clauses JSONB, -- Array of {section, clause, text}

  opinion_text TEXT NOT NULL,
  recommendation TEXT,

  requested_by UUID REFERENCES auth.users(id),
  provided_by TEXT, -- Legal officer/firm name

  document_id UUID REFERENCES public.documents(id),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provided', 'implemented')),

  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provided_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_opinions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible contracts"
  ON public.contracts FOR SELECT
  USING (can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can manage contracts"
  ON public.contracts FOR ALL
  USING (
    can_access_constituency(auth.uid(), constituency_id) AND
    has_any_role(auth.uid(), ARRAY['super_admin', 'plgo', 'finance_officer']::app_role[])
  );

CREATE POLICY "Users can view accessible legal opinions"
  ON public.legal_opinions FOR SELECT
  USING (
    constituency_id IS NULL OR can_access_constituency(auth.uid(), constituency_id)
  );

CREATE INDEX IF NOT EXISTS idx_contracts_constituency ON public.contracts(constituency_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- =============================================
-- System Health Tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  job_name TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('cron', 'queue', 'manual', 'scheduled')),

  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failure', 'timeout', 'skipped')),
  last_run_duration_ms INTEGER,
  last_error TEXT,

  next_run_at TIMESTAMPTZ,

  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  is_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  check_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('database', 'api', 'queue', 'storage', 'external')),

  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER,

  details JSONB,
  error_message TEXT,

  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_jobs_name ON public.system_jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_type ON public.system_health_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_checked_at ON public.system_health_checks(checked_at);

-- Cleanup old health checks (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void AS $$
BEGIN
  DELETE FROM public.system_health_checks
  WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
