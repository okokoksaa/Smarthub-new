-- Create enum types for CDF system
CREATE TYPE public.app_role AS ENUM (
  'super_admin',
  'ministry_official',
  'auditor',
  'plgo',
  'tac_chair',
  'tac_member',
  'cdfc_chair',
  'cdfc_member',
  'finance_officer',
  'wdc_member',
  'mp',
  'contractor',
  'citizen'
);

CREATE TYPE public.project_status AS ENUM (
  'draft',
  'submitted',
  'cdfc_review',
  'tac_appraisal',
  'plgo_review',
  'approved',
  'implementation',
  'completed',
  'rejected',
  'cancelled'
);

CREATE TYPE public.payment_status AS ENUM (
  'draft',
  'submitted',
  'finance_review',
  'panel_a_pending',
  'panel_b_pending',
  'approved',
  'executed',
  'rejected',
  'cancelled'
);

CREATE TYPE public.project_sector AS ENUM (
  'education',
  'health',
  'water',
  'roads',
  'agriculture',
  'community',
  'energy',
  'governance',
  'other'
);

CREATE TYPE public.risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create provinces table
CREATE TABLE public.provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create districts table
CREATE TABLE public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id UUID NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create constituencies table
CREATE TABLE public.constituencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  total_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  allocated_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  disbursed_budget NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create wards table
CREATE TABLE public.wards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  population INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create user_assignments table (links users to constituencies/wards)
CREATE TABLE public.user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  province_id UUID REFERENCES public.provinces(id) ON DELETE CASCADE,
  district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
  constituency_id UUID REFERENCES public.constituencies(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES public.wards(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, constituency_id, ward_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sector public.project_sector NOT NULL,
  constituency_id UUID NOT NULL REFERENCES public.constituencies(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES public.wards(id) ON DELETE SET NULL,
  budget NUMERIC(15,2) NOT NULL,
  spent NUMERIC(15,2) NOT NULL DEFAULT 0,
  status public.project_status NOT NULL DEFAULT 'draft',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  beneficiaries INTEGER,
  location_description TEXT,
  gps_latitude NUMERIC(10,7),
  gps_longitude NUMERIC(10,7),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  contractor_id UUID,
  ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_risk_level public.risk_level,
  ai_risk_factors JSONB,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  milestone TEXT,
  status public.payment_status NOT NULL DEFAULT 'draft',
  beneficiary_name TEXT NOT NULL,
  beneficiary_account TEXT,
  beneficiary_bank TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
  ai_risk_level public.risk_level,
  ai_flags JSONB,
  created_by UUID REFERENCES auth.users(id),
  panel_a_approved_at TIMESTAMPTZ,
  panel_a_approved_by UUID REFERENCES auth.users(id),
  panel_b_approved_at TIMESTAMPTZ,
  panel_b_approved_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_logs table (immutable)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role public.app_role,
  action TEXT NOT NULL,
  data_before JSONB,
  data_after JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  constituency_id UUID REFERENCES public.constituencies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_advisories table
CREATE TABLE public.ai_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  advisory_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  risk_level public.risk_level NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  recommendations JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create committees table
CREATE TABLE public.committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  committee_type TEXT NOT NULL,
  constituency_id UUID REFERENCES public.constituencies(id) ON DELETE CASCADE,
  province_id UUID REFERENCES public.provinces(id) ON DELETE CASCADE,
  chair_id UUID REFERENCES auth.users(id),
  secretary_id UUID REFERENCES auth.users(id),
  quorum_required INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create committee_members table
CREATE TABLE public.committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(committee_id, user_id)
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  quorum_present INTEGER,
  agenda JSONB,
  minutes TEXT,
  minutes_approved BOOLEAN NOT NULL DEFAULT false,
  minutes_approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_attendees table
CREATE TABLE public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  attendance_time TIMESTAMPTZ,
  signature TEXT,
  UNIQUE(meeting_id, user_id)
);

-- Create contractors table
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  zppa_registration TEXT,
  zppa_category TEXT,
  tax_clearance_valid BOOLEAN NOT NULL DEFAULT false,
  tax_clearance_expiry DATE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  bank_name TEXT,
  bank_account TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key to projects for contractor
ALTER TABLE public.projects 
ADD CONSTRAINT projects_contractor_fk 
FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Create function to get user's constituency assignments
CREATE OR REPLACE FUNCTION public.get_user_constituencies(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(constituency_id)
  FROM public.user_assignments
  WHERE user_id = _user_id
    AND constituency_id IS NOT NULL
$$;

-- Create function to check if user can access constituency
CREATE OR REPLACE FUNCTION public.can_access_constituency(_user_id UUID, _constituency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- National level access (Ministry, Auditor, Super Admin)
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
      AND role IN ('super_admin', 'ministry_official', 'auditor')
  ) OR EXISTS (
    -- Provincial level access (PLGO, TAC)
    SELECT 1 FROM public.user_assignments ua
    JOIN public.constituencies c ON c.id = _constituency_id
    JOIN public.districts d ON d.id = c.district_id
    WHERE ua.user_id = _user_id
      AND ua.province_id = d.province_id
  ) OR EXISTS (
    -- Direct constituency assignment
    SELECT 1 FROM public.user_assignments
    WHERE user_id = _user_id
      AND constituency_id = _constituency_id
  )
$$;

-- RLS Policies for provinces (read for all authenticated)
CREATE POLICY "Anyone can view provinces"
ON public.provinces FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for districts (read for all authenticated)
CREATE POLICY "Anyone can view districts"
ON public.districts FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for constituencies
CREATE POLICY "Anyone can view constituencies"
ON public.constituencies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage constituencies"
ON public.constituencies FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::public.app_role[]));

-- RLS Policies for wards
CREATE POLICY "Anyone can view wards"
ON public.wards FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'auditor']::public.app_role[]));

-- RLS Policies for user_roles (security critical)
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for user_assignments
CREATE POLICY "Users can view own assignments"
ON public.user_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage assignments"
ON public.user_assignments FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official']::public.app_role[]));

-- RLS Policies for projects
CREATE POLICY "Users can view accessible projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.can_access_constituency(auth.uid(), constituency_id));

CREATE POLICY "Authorized users can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  public.can_access_constituency(auth.uid(), constituency_id) AND
  public.has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'cdfc_member', 'wdc_member', 'citizen']::public.app_role[])
);

CREATE POLICY "Authorized users can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (
  public.can_access_constituency(auth.uid(), constituency_id) AND
  public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo', 'cdfc_chair', 'finance_officer']::public.app_role[])
);

-- RLS Policies for payments
CREATE POLICY "Users can view accessible payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_id
      AND public.can_access_constituency(auth.uid(), p.constituency_id)
  )
);

CREATE POLICY "Finance officers can create payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer']::public.app_role[])
);

CREATE POLICY "Authorized users can update payments"
ON public.payments FOR UPDATE
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'cdfc_chair', 'plgo']::public.app_role[])
);

-- RLS Policies for audit_logs (read-only for auditors and admins)
CREATE POLICY "Auditors can view all audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'auditor', 'ministry_official']::public.app_role[]));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS Policies for ai_advisories
CREATE POLICY "Users can view accessible advisories"
ON public.ai_advisories FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for committees
CREATE POLICY "Anyone can view committees"
ON public.committees FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage committees"
ON public.committees FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::public.app_role[]));

-- RLS Policies for committee_members
CREATE POLICY "Anyone can view committee members"
ON public.committee_members FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for meetings
CREATE POLICY "Users can view accessible meetings"
ON public.meetings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Committee chairs can manage meetings"
ON public.meetings FOR ALL
TO authenticated
USING (
  public.has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'tac_chair']::public.app_role[])
);

-- RLS Policies for meeting_attendees
CREATE POLICY "Anyone can view meeting attendees"
ON public.meeting_attendees FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for contractors
CREATE POLICY "Anyone can view contractors"
ON public.contractors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Contractors can update own record"
ON public.contractors FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage contractors"
ON public.contractors FOR ALL
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::public.app_role[]))
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin', 'ministry_official', 'plgo']::public.app_role[]));

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_constituencies_updated_at
  BEFORE UPDATE ON public.constituencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_committees_updated_at
  BEFORE UPDATE ON public.committees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();-- Fix update_updated_at function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
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
CREATE INDEX idx_wdc_signoffs_project_id ON public.wdc_signoffs(project_id);-- Add residency verification fields to wdc_signoffs table
ALTER TABLE public.wdc_signoffs
ADD COLUMN residency_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN residency_verified_by TEXT,
ADD COLUMN residency_verification_method TEXT,
ADD COLUMN residents_count INTEGER,
ADD COLUMN non_residents_count INTEGER DEFAULT 0,
ADD COLUMN residency_threshold_met BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN residency_notes TEXT;-- =====================================================
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
);-- Create a type for the verification response
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
GRANT EXECUTE ON FUNCTION public.verify_document_public(UUID) TO authenticated;-- Add document_id column to payments table for linking to supporting documents
ALTER TABLE public.payments 
ADD COLUMN document_id UUID REFERENCES public.documents(id);

-- Create composite type for payment submission result
CREATE TYPE public.payment_submission_result AS (
  success BOOLEAN,
  payment_id UUID,
  payment_number TEXT,
  risk_score INTEGER,
  risk_level TEXT,
  error_message TEXT
);

-- Create the submit_payment_request RPC function
CREATE OR REPLACE FUNCTION public.submit_payment_request(
  p_project_id UUID,
  p_amount NUMERIC,
  p_document_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_milestone TEXT DEFAULT NULL,
  p_beneficiary_name TEXT DEFAULT NULL
)
RETURNS public.payment_submission_result
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.payment_submission_result;
  v_project RECORD;
  v_total_spent NUMERIC;
  v_remaining_budget NUMERIC;
  v_risk_score INTEGER;
  v_risk_level TEXT;
  v_payment_number TEXT;
  v_new_payment_id UUID;
BEGIN
  -- Initialize result
  v_result.success := FALSE;
  
  -- Check if project exists and get project details
  SELECT p.*, c.name as contractor_name
  INTO v_project
  FROM projects p
  LEFT JOIN contractors c ON c.id = p.contractor_id
  WHERE p.id = p_project_id;
  
  IF v_project.id IS NULL THEN
    v_result.error_message := 'Project not found';
    RETURN v_result;
  END IF;
  
  -- Check if project is in a valid status for payments
  IF v_project.status NOT IN ('approved', 'implementation') THEN
    v_result.error_message := 'Project must be approved or in implementation to receive payments';
    RETURN v_result;
  END IF;
  
  -- Calculate total spent on this project
  SELECT COALESCE(SUM(amount), 0) INTO v_total_spent
  FROM payments
  WHERE project_id = p_project_id
    AND status NOT IN ('rejected');
  
  -- Calculate remaining budget
  v_remaining_budget := v_project.budget - v_total_spent;
  
  -- Check if payment amount exceeds remaining budget
  IF p_amount > v_remaining_budget THEN
    v_result.error_message := 'Payment amount (' || p_amount || ') exceeds remaining project budget (' || v_remaining_budget || ')';
    RETURN v_result;
  END IF;
  
  -- Simulated AI Analysis for risk scoring
  -- In production, this would call an external AI service
  IF p_amount > 100000 THEN
    v_risk_score := 75;
    v_risk_level := 'high';
  ELSIF p_amount > 50000 THEN
    v_risk_score := 35;
    v_risk_level := 'medium';
  ELSE
    v_risk_score := 10;
    v_risk_level := 'low';
  END IF;
  
  -- Additional risk factor: high percentage of remaining budget
  IF p_amount > (v_remaining_budget * 0.5) AND v_remaining_budget > 0 THEN
    v_risk_score := LEAST(100, v_risk_score + 20);
    IF v_risk_score > 50 THEN
      v_risk_level := 'high';
    END IF;
  END IF;
  
  -- Generate payment number
  v_payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
    (SELECT COALESCE(COUNT(*), 0) + 1 FROM payments WHERE created_at >= DATE_TRUNC('year', NOW()))::TEXT,
    6, '0'
  );
  
  -- Insert the payment record
  INSERT INTO payments (
    payment_number,
    project_id,
    amount,
    description,
    milestone,
    beneficiary_name,
    document_id,
    status,
    ai_risk_score,
    ai_risk_level,
    ai_flags,
    created_by
  ) VALUES (
    v_payment_number,
    p_project_id,
    p_amount,
    p_description,
    p_milestone,
    COALESCE(p_beneficiary_name, v_project.contractor_name, 'Contractor'),
    p_document_id,
    'submitted',
    v_risk_score,
    v_risk_level::risk_level,
    CASE 
      WHEN v_risk_score > 50 THEN '["Amount exceeds threshold for automatic review"]'::jsonb
      ELSE '[]'::jsonb
    END,
    auth.uid()
  )
  RETURNING id INTO v_new_payment_id;
  
  -- Return success result
  v_result.success := TRUE;
  v_result.payment_id := v_new_payment_id;
  v_result.payment_number := v_payment_number;
  v_result.risk_score := v_risk_score;
  v_result.risk_level := v_risk_level;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_payment_request TO authenticated;

-- Add 'submitted' to payment_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'submitted' AND enumtypid = 'public.payment_status'::regtype) THEN
    ALTER TYPE public.payment_status ADD VALUE 'submitted';
  END IF;
END $$;-- Create the analytics view for constituency performance monitoring
CREATE OR REPLACE VIEW public.analytics_constituency_performance AS
SELECT 
  c.id AS constituency_id,
  c.name AS constituency_name,
  c.code AS constituency_code,
  d.name AS district_name,
  prov.name AS province_name,
  
  -- Project Metrics
  COALESCE(proj_stats.total_projects, 0) AS total_projects,
  COALESCE(proj_stats.active_projects, 0) AS active_projects,
  COALESCE(proj_stats.completed_projects, 0) AS completed_projects,
  
  -- Budget Metrics
  COALESCE(proj_stats.total_budget_allocated, 0) AS total_budget_allocated,
  COALESCE(pay_stats.total_funds_disbursed, 0) AS total_funds_disbursed,
  
  -- Absorption Rate: (Disbursed / Budget) * 100
  CASE 
    WHEN COALESCE(proj_stats.total_budget_allocated, 0) = 0 THEN 0
    ELSE ROUND(
      (COALESCE(pay_stats.total_funds_disbursed, 0) / proj_stats.total_budget_allocated) * 100, 
      2
    )
  END AS absorption_rate,
  
  -- Risk Metrics (from pending/submitted payments)
  COALESCE(risk_stats.risk_index, 0) AS risk_index,
  COALESCE(risk_stats.critical_alerts, 0) AS critical_alerts,
  COALESCE(risk_stats.pending_payments, 0) AS pending_payments,
  
  -- Additional Context
  c.updated_at AS last_updated

FROM public.constituencies c
LEFT JOIN public.districts d ON d.id = c.district_id
LEFT JOIN public.provinces prov ON prov.id = d.province_id

-- Project statistics subquery
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE p.status IN ('implementation', 'approved')) AS active_projects,
    COUNT(*) FILTER (WHERE p.status = 'completed') AS completed_projects,
    COALESCE(SUM(p.budget), 0) AS total_budget_allocated
  FROM public.projects p
  WHERE p.constituency_id = c.id
) proj_stats ON true

-- Payment statistics subquery (executed payments for disbursement)
LEFT JOIN LATERAL (
  SELECT 
    COALESCE(SUM(pay.amount), 0) AS total_funds_disbursed
  FROM public.payments pay
  JOIN public.projects proj ON proj.id = pay.project_id
  WHERE proj.constituency_id = c.id
    AND pay.status = 'executed'
) pay_stats ON true

-- Risk statistics subquery (pending payments for risk analysis)
LEFT JOIN LATERAL (
  SELECT 
    ROUND(AVG(pay.ai_risk_score), 0) AS risk_index,
    COUNT(*) FILTER (WHERE pay.ai_risk_score > 75) AS critical_alerts,
    COUNT(*) AS pending_payments
  FROM public.payments pay
  JOIN public.projects proj ON proj.id = pay.project_id
  WHERE proj.constituency_id = c.id
    AND pay.status IN ('submitted', 'panel_a_pending', 'panel_b_pending', 'finance_review')
) risk_stats ON true;

-- Grant access to the view
GRANT SELECT ON public.analytics_constituency_performance TO authenticated;