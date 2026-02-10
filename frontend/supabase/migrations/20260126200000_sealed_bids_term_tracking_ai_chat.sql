-- =============================================
-- MIGRATION: Sealed Bids, Term Tracking, AI Chat
-- Date: 2026-01-26
-- Description: Adds tables for:
--   1. Procurement sealed bids workflow
--   2. Bursary term-by-term tracking with SLA
--   3. AI chat sessions and messages
-- =============================================

-- =============================================
-- PART 1: PROCUREMENT SEALED BIDS TABLES
-- =============================================

-- Enum for bid status
CREATE TYPE public.bid_status AS ENUM (
  'submitted',
  'valid',
  'invalid',
  'disqualified',
  'withdrawn'
);

-- Enum for evaluation status
CREATE TYPE public.evaluation_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'disputed'
);

-- Table: procurement_bids (sealed bid storage)
CREATE TABLE public.procurement_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES public.procurements(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id),

  -- Bid Details (encrypted until opening)
  bid_amount NUMERIC(15,2),  -- NULL until bid is opened
  encrypted_bid_data BYTEA,  -- Encrypted bid details before opening
  bid_document_hash TEXT NOT NULL,  -- SHA-256 hash for verification
  bid_document_id UUID REFERENCES public.documents(id),

  -- Bid Status
  status public.bid_status NOT NULL DEFAULT 'submitted',
  disqualification_reason TEXT,

  -- Submission Tracking
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_by UUID REFERENCES auth.users(id),

  -- Opening Tracking (populated when bid is opened)
  opened_at TIMESTAMPTZ,
  opened_by UUID REFERENCES auth.users(id),
  decrypted_data JSONB,  -- Decrypted bid details after opening

  -- Metadata
  technical_proposal_summary TEXT,
  delivery_timeline_days INTEGER,
  warranty_period_months INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(procurement_id, contractor_id)  -- One bid per contractor per procurement
);

-- Table: procurement_evaluations (two-evaluator scoring)
CREATE TABLE public.procurement_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES public.procurements(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES public.procurement_bids(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id),

  -- Scoring (each out of 100)
  technical_score NUMERIC(5,2) CHECK (technical_score >= 0 AND technical_score <= 100),
  financial_score NUMERIC(5,2) CHECK (financial_score >= 0 AND financial_score <= 100),
  experience_score NUMERIC(5,2) CHECK (experience_score >= 0 AND experience_score <= 100),
  compliance_score NUMERIC(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
  total_score NUMERIC(5,2) CHECK (total_score >= 0 AND total_score <= 100),

  -- Evaluation Details
  technical_comments TEXT,
  financial_comments TEXT,
  recommendation TEXT,  -- 'award', 'reject', 'conditional'
  recommendation_reason TEXT,

  -- Status
  status public.evaluation_status NOT NULL DEFAULT 'pending',

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Two-evaluator rule: each bid needs at least 2 evaluators
  UNIQUE(bid_id, evaluator_id)
);

-- Table: procurement_audit_events (immutable audit trail for bid operations)
CREATE TABLE public.procurement_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_id UUID NOT NULL REFERENCES public.procurements(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES public.procurement_bids(id),

  -- Event Details
  event_type TEXT NOT NULL,  -- 'bid_submitted', 'bid_opened', 'evaluation_started', 'evaluation_completed', 'award_decision', 'contract_signed'
  event_description TEXT NOT NULL,

  -- Actor Information
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role public.app_role,
  actor_ip INET,

  -- Event Data
  event_data JSONB DEFAULT '{}',

  -- Verification
  event_hash TEXT,  -- SHA-256 hash of event for tamper detection
  previous_event_hash TEXT,  -- Chain hash for integrity

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Note: No updated_at - this table is append-only/immutable
);

-- Enable RLS
ALTER TABLE public.procurement_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for procurement_bids
CREATE POLICY "Users can view bids after opening"
  ON public.procurement_bids FOR SELECT
  TO authenticated
  USING (
    -- Can view if bid is opened OR user is the submitter
    opened_at IS NOT NULL OR submitted_by = auth.uid() OR
    -- Or if user has admin/oversight role
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'auditor', 'ministry_official']::public.app_role[])
  );

CREATE POLICY "Contractors can submit bids"
  ON public.procurement_bids FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'contractor') AND
    submitted_by = auth.uid()
  );

CREATE POLICY "Authorized users can update bids"
  ON public.procurement_bids FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'finance_officer']::public.app_role[])
  );

-- RLS Policies for procurement_evaluations
CREATE POLICY "Evaluators can view evaluations"
  ON public.procurement_evaluations FOR SELECT
  TO authenticated
  USING (
    evaluator_id = auth.uid() OR
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'tac_chair', 'tac_member', 'cdfc_chair', 'auditor']::public.app_role[])
  );

CREATE POLICY "TAC members can create evaluations"
  ON public.procurement_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'tac_chair', 'tac_member']::public.app_role[]) AND
    evaluator_id = auth.uid()
  );

CREATE POLICY "Evaluators can update own evaluations"
  ON public.procurement_evaluations FOR UPDATE
  TO authenticated
  USING (
    evaluator_id = auth.uid() AND status != 'completed'
  );

-- RLS Policies for procurement_audit_events (read-only for authorized users)
CREATE POLICY "Auditors can view procurement audit events"
  ON public.procurement_audit_events FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'auditor', 'ministry_official', 'plgo']::public.app_role[])
  );

CREATE POLICY "System can insert audit events"
  ON public.procurement_audit_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for procurement tables
CREATE INDEX idx_procurement_bids_procurement ON public.procurement_bids(procurement_id);
CREATE INDEX idx_procurement_bids_contractor ON public.procurement_bids(contractor_id);
CREATE INDEX idx_procurement_bids_status ON public.procurement_bids(status);
CREATE INDEX idx_procurement_evaluations_procurement ON public.procurement_evaluations(procurement_id);
CREATE INDEX idx_procurement_evaluations_bid ON public.procurement_evaluations(bid_id);
CREATE INDEX idx_procurement_evaluations_evaluator ON public.procurement_evaluations(evaluator_id);
CREATE INDEX idx_procurement_audit_procurement ON public.procurement_audit_events(procurement_id);
CREATE INDEX idx_procurement_audit_type ON public.procurement_audit_events(event_type);
CREATE INDEX idx_procurement_audit_created ON public.procurement_audit_events(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_procurement_bids_updated_at
  BEFORE UPDATE ON public.procurement_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_procurement_evaluations_updated_at
  BEFORE UPDATE ON public.procurement_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =============================================
-- PART 2: BURSARY TERM-BY-TERM TRACKING TABLES
-- =============================================

-- Enum for term payment status
CREATE TYPE public.term_payment_status AS ENUM (
  'pending',
  'enrollment_verified',
  'approved',
  'processing',
  'disbursed',
  'failed',
  'cancelled'
);

-- Table: bursary_terms (term-by-term payment tracking)
CREATE TABLE public.bursary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.bursary_applications(id) ON DELETE CASCADE,

  -- Term Information
  term_number INTEGER NOT NULL CHECK (term_number BETWEEN 1 AND 4),  -- 1, 2, 3 (or 4 for some programs)
  academic_year INTEGER NOT NULL,
  term_name TEXT,  -- e.g., 'Term 1', 'Semester 1', 'First Quarter'
  term_start_date DATE,
  term_end_date DATE,

  -- Financial Details
  tuition_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  accommodation_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  book_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
  transport_allowance NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- Enrollment Verification
  enrollment_verified BOOLEAN NOT NULL DEFAULT false,
  enrollment_verified_at TIMESTAMPTZ,
  enrollment_verified_by UUID REFERENCES auth.users(id),
  enrollment_proof_document_id UUID REFERENCES public.documents(id),
  enrollment_verification_notes TEXT,

  -- Payment Approval
  payment_status public.term_payment_status NOT NULL DEFAULT 'pending',
  payment_approved_at TIMESTAMPTZ,
  payment_approved_by UUID REFERENCES auth.users(id),
  payment_due_date DATE,  -- SLA tracking: 5 working days after approval

  -- Disbursement
  disbursed_at TIMESTAMPTZ,
  disbursed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  payment_method TEXT,  -- 'bank_transfer', 'mobile_money', 'institution_direct'

  -- Institution Payment Details
  institution_account_name TEXT,
  institution_account_number TEXT,
  institution_bank_name TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(application_id, term_number, academic_year)
);

-- Table: bursary_sla_tracking (5-day payment SLA monitoring)
CREATE TABLE public.bursary_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES public.bursary_terms(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.bursary_applications(id) ON DELETE CASCADE,

  -- SLA Tracking
  approval_date TIMESTAMPTZ NOT NULL,
  sla_due_date TIMESTAMPTZ NOT NULL,  -- 5 working days after approval
  actual_payment_date TIMESTAMPTZ,

  -- SLA Status
  sla_breached BOOLEAN NOT NULL DEFAULT false,
  working_days_taken INTEGER,

  -- Breach Details
  breach_reason TEXT,
  breach_acknowledged_by UUID REFERENCES auth.users(id),
  breach_acknowledged_at TIMESTAMPTZ,
  breach_resolution_notes TEXT,

  -- Notification Tracking
  warning_sent_at TIMESTAMPTZ,  -- Sent when 3 days remaining
  overdue_sent_at TIMESTAMPTZ,  -- Sent when SLA breached

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(term_id)
);

-- Enable RLS
ALTER TABLE public.bursary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bursary_sla_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bursary_terms
CREATE POLICY "Users can view accessible bursary terms"
  ON public.bursary_terms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bursary_applications ba
      WHERE ba.id = application_id
        AND public.can_access_constituency(auth.uid(), ba.constituency_id)
    )
  );

CREATE POLICY "Finance officers can create terms"
  ON public.bursary_terms FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'cdfc_chair']::public.app_role[])
  );

CREATE POLICY "Finance officers can update terms"
  ON public.bursary_terms FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'cdfc_chair', 'plgo']::public.app_role[])
  );

-- RLS Policies for bursary_sla_tracking
CREATE POLICY "Oversight can view SLA tracking"
  ON public.bursary_sla_tracking FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer', 'plgo', 'ministry_official', 'auditor']::public.app_role[])
  );

CREATE POLICY "System can manage SLA tracking"
  ON public.bursary_sla_tracking FOR ALL
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'finance_officer']::public.app_role[])
  );

-- Indexes for bursary tables
CREATE INDEX idx_bursary_terms_application ON public.bursary_terms(application_id);
CREATE INDEX idx_bursary_terms_status ON public.bursary_terms(payment_status);
CREATE INDEX idx_bursary_terms_year_term ON public.bursary_terms(academic_year, term_number);
CREATE INDEX idx_bursary_sla_term ON public.bursary_sla_tracking(term_id);
CREATE INDEX idx_bursary_sla_due_date ON public.bursary_sla_tracking(sla_due_date);
CREATE INDEX idx_bursary_sla_breached ON public.bursary_sla_tracking(sla_breached);

-- Triggers for updated_at
CREATE TRIGGER update_bursary_terms_updated_at
  BEFORE UPDATE ON public.bursary_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bursary_sla_updated_at
  BEFORE UPDATE ON public.bursary_sla_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =============================================
-- PART 3: AI CHAT TABLES
-- =============================================

-- Table: ai_chat_sessions (chat history)
CREATE TABLE public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session Context
  title TEXT,  -- Auto-generated or user-defined
  constituency_id UUID REFERENCES public.constituencies(id),

  -- Active Context (what the chat is about)
  context_type TEXT,  -- 'project', 'payment', 'budget', 'compliance', 'general'
  context_entity_id UUID,  -- ID of the project/payment/etc being discussed
  context_data JSONB DEFAULT '{}',  -- Additional context information

  -- Session Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,

  -- Usage Tracking
  message_count INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0
);

-- Table: ai_chat_messages (individual messages)
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,

  -- Message Content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI Response Metadata (for assistant messages)
  intent_detected TEXT,  -- 'project_status', 'budget_query', 'payment_history', etc.
  entities_referenced JSONB DEFAULT '[]',  -- Array of {type, id, name} for referenced entities
  citations JSONB DEFAULT '[]',  -- Array of source references
  suggestions JSONB DEFAULT '[]',  -- Array of follow-up suggestions

  -- Advisory Flag
  is_advisory BOOLEAN NOT NULL DEFAULT true,  -- Always true for assistant messages

  -- Token Tracking
  tokens_used INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: ai_chat_feedback (user feedback on AI responses)
CREATE TABLE public.ai_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.ai_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),  -- 1-5 star rating
  feedback_type TEXT,  -- 'helpful', 'unhelpful', 'incorrect', 'inappropriate'
  feedback_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Users can view own chat sessions"
  ON public.ai_chat_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own chat sessions"
  ON public.ai_chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions"
  ON public.ai_chat_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chat sessions"
  ON public.ai_chat_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for ai_chat_messages
CREATE POLICY "Users can view own chat messages"
  ON public.ai_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON public.ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_chat_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_chat_feedback
CREATE POLICY "Users can manage own feedback"
  ON public.ai_chat_feedback FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes for AI chat tables
CREATE INDEX idx_ai_chat_sessions_user ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_context ON public.ai_chat_sessions(context_type, context_entity_id);
CREATE INDEX idx_ai_chat_sessions_active ON public.ai_chat_sessions(is_active);
CREATE INDEX idx_ai_chat_messages_session ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created ON public.ai_chat_messages(created_at);
CREATE INDEX idx_ai_chat_feedback_message ON public.ai_chat_feedback(message_id);


-- =============================================
-- PART 4: PUBLIC FEEDBACK TABLE (for Portal)
-- =============================================

-- Table: public_feedback (for transparency portal)
CREATE TABLE public.public_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Feedback Details
  feedback_type TEXT NOT NULL,  -- 'complaint', 'suggestion', 'inquiry', 'compliment'
  category TEXT NOT NULL,  -- 'project', 'payment', 'service', 'corruption', 'other'
  subject TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Location Reference (optional)
  constituency_id UUID REFERENCES public.constituencies(id),
  ward_id UUID REFERENCES public.wards(id),
  project_id UUID REFERENCES public.projects(id),

  -- Contact Information (optional, for follow-up)
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,

  -- Status
  status TEXT NOT NULL DEFAULT 'submitted',  -- 'submitted', 'under_review', 'resolved', 'closed'

  -- Response
  response_text TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,

  -- Metadata
  submitted_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (public read, authenticated write for response)
ALTER TABLE public.public_feedback ENABLE ROW LEVEL SECURITY;

-- Public can submit feedback (no auth required for insert)
CREATE POLICY "Anyone can submit feedback"
  ON public.public_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff can view and manage feedback
CREATE POLICY "Staff can view all feedback"
  ON public.public_feedback FOR SELECT
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'cdfc_member', 'plgo', 'ministry_official']::public.app_role[])
  );

CREATE POLICY "Staff can update feedback"
  ON public.public_feedback FOR UPDATE
  TO authenticated
  USING (
    public.has_any_role(auth.uid(), ARRAY['super_admin', 'cdfc_chair', 'plgo', 'ministry_official']::public.app_role[])
  );

-- Indexes for public_feedback
CREATE INDEX idx_public_feedback_type ON public.public_feedback(feedback_type);
CREATE INDEX idx_public_feedback_status ON public.public_feedback(status);
CREATE INDEX idx_public_feedback_constituency ON public.public_feedback(constituency_id);
CREATE INDEX idx_public_feedback_created ON public.public_feedback(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_public_feedback_updated_at
  BEFORE UPDATE ON public.public_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- =============================================
-- PART 5: HELPER FUNCTIONS
-- =============================================

-- Function to calculate working days for SLA (excludes weekends and holidays)
CREATE OR REPLACE FUNCTION public.calculate_sla_due_date(
  start_date TIMESTAMPTZ,
  working_days INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_date DATE := start_date::DATE;
  days_added INTEGER := 0;
BEGIN
  WHILE days_added < working_days LOOP
    check_date := check_date + INTERVAL '1 day';

    -- Skip weekends (0 = Sunday, 6 = Saturday)
    IF EXTRACT(DOW FROM check_date) NOT IN (0, 6) THEN
      -- Check if it's not a public holiday
      IF NOT EXISTS (
        SELECT 1 FROM public.public_holidays
        WHERE holiday_date = check_date
          AND (country = 'ZM' OR country IS NULL)
      ) THEN
        days_added := days_added + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN check_date::TIMESTAMPTZ;
END;
$$;

-- Function to check if bids can be opened
CREATE OR REPLACE FUNCTION public.can_open_bids(procurement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  proc_record RECORD;
BEGIN
  SELECT status, bid_opening_date INTO proc_record
  FROM public.procurements
  WHERE id = procurement_id;

  IF proc_record IS NULL THEN
    RETURN false;
  END IF;

  -- Can only open if status is 'bid_opening' and current time >= bid_opening_date
  RETURN proc_record.status = 'bid_opening'
    AND proc_record.bid_opening_date IS NOT NULL
    AND CURRENT_DATE >= proc_record.bid_opening_date;
END;
$$;

-- Function to check two-evaluator rule for procurement
CREATE OR REPLACE FUNCTION public.has_two_evaluators(procurement_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  min_evaluators INTEGER;
BEGIN
  -- Check if all bids have at least 2 completed evaluations
  SELECT MIN(eval_count) INTO min_evaluators
  FROM (
    SELECT pb.id, COUNT(pe.id) as eval_count
    FROM public.procurement_bids pb
    LEFT JOIN public.procurement_evaluations pe
      ON pe.bid_id = pb.id AND pe.status = 'completed'
    WHERE pb.procurement_id = procurement_id
      AND pb.status = 'valid'
    GROUP BY pb.id
  ) bid_evals;

  RETURN COALESCE(min_evaluators, 0) >= 2;
END;
$$;

-- Function to check bursary payment prerequisites
CREATE OR REPLACE FUNCTION public.can_disburse_bursary_term(term_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  term_record RECORD;
  app_record RECORD;
  result JSONB;
  can_disburse BOOLEAN := true;
  blockers TEXT[] := '{}';
BEGIN
  -- Get term and application details
  SELECT * INTO term_record FROM public.bursary_terms WHERE id = term_id;
  SELECT * INTO app_record FROM public.bursary_applications WHERE id = term_record.application_id;

  -- Check: Application must be approved
  IF app_record.status != 'approved' AND app_record.status != 'disbursed' THEN
    can_disburse := false;
    blockers := array_append(blockers, 'Application not approved');
  END IF;

  -- Check: Enrollment must be verified
  IF NOT term_record.enrollment_verified THEN
    can_disburse := false;
    blockers := array_append(blockers, 'Enrollment not verified');
  END IF;

  -- Check: Payment must be approved
  IF term_record.payment_status NOT IN ('approved', 'processing') THEN
    can_disburse := false;
    blockers := array_append(blockers, 'Payment not approved');
  END IF;

  -- Check: Admission letter must exist (check documents table)
  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.project_id IS NULL  -- Bursary documents don't have project_id
      AND d.constituency_id = app_record.constituency_id
      AND d.metadata->>'application_id' = app_record.id::TEXT
      AND d.document_type::TEXT = 'admission_letter'
  ) THEN
    can_disburse := false;
    blockers := array_append(blockers, 'Admission letter not uploaded');
  END IF;

  result := jsonb_build_object(
    'can_disburse', can_disburse,
    'blockers', to_jsonb(blockers)
  );

  RETURN result;
END;
$$;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.procurement_bids IS 'Sealed bids for procurements - encrypted until bid_opening_date';
COMMENT ON TABLE public.procurement_evaluations IS 'Evaluation scores for procurement bids - requires two evaluators';
COMMENT ON TABLE public.procurement_audit_events IS 'Immutable audit trail for procurement operations';
COMMENT ON TABLE public.bursary_terms IS 'Term-by-term payment tracking for bursary applications';
COMMENT ON TABLE public.bursary_sla_tracking IS 'SLA monitoring for bursary payments - 5 working day target';
COMMENT ON TABLE public.ai_chat_sessions IS 'AI chat conversation sessions';
COMMENT ON TABLE public.ai_chat_messages IS 'Individual messages in AI chat sessions';
COMMENT ON TABLE public.public_feedback IS 'Public feedback submitted through transparency portal';

COMMENT ON FUNCTION public.calculate_sla_due_date IS 'Calculates SLA due date adding working days (excludes weekends and holidays)';
COMMENT ON FUNCTION public.can_open_bids IS 'Checks if procurement bids can be opened based on status and date';
COMMENT ON FUNCTION public.has_two_evaluators IS 'Checks if all valid bids have at least 2 completed evaluations';
COMMENT ON FUNCTION public.can_disburse_bursary_term IS 'Checks prerequisites for bursary term disbursement';
