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
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();