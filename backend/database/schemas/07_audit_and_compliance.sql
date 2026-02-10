-- ============================================================================
-- CDF SMART HUB - AUDIT & COMPLIANCE SCHEMA
-- ============================================================================
-- Purpose: Immutable audit logging, hash chaining, compliance reporting,
--          audit findings, investigations
-- Compliance: 10-year retention, tamper-proof logs, legal defensibility
-- Architecture: Dual-write (operational DB + WORM storage), hash chaining
-- ============================================================================

-- ============================================================================
-- AUDIT LOG (Operational Database - Queryable)
-- ============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Audit Entry Identification
    audit_entry_number BIGSERIAL UNIQUE,   -- Sequential number for ordering
    audit_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Event Classification
    event_type audit_event_type NOT NULL,
    event_category VARCHAR(50) NOT NULL,    -- 'USER', 'PROJECT', 'FINANCIAL', 'DOCUMENT', 'SYSTEM', 'AI'
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'

    -- Actor (Who)
    actor_user_id UUID REFERENCES users(id),
    actor_role user_role,
    actor_ip_address INET,
    actor_session_id UUID,
    actor_device_fingerprint VARCHAR(255),

    -- Target Entity (What)
    entity_type VARCHAR(100),               -- 'PROJECT', 'PAYMENT', 'USER', 'DOCUMENT', etc.
    entity_id UUID,
    entity_name VARCHAR(255),               -- Denormalized for readability

    -- Action (How)
    action VARCHAR(100) NOT NULL,           -- 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', etc.
    action_description TEXT,

    -- Data Changes
    data_before JSONB,                      -- State before action
    data_after JSONB,                       -- State after action
    changed_fields TEXT[],                  -- Array of field names changed

    -- Context
    workflow_instance_id UUID REFERENCES workflow_instances(id),
    meeting_id UUID REFERENCES meetings(id),
    approval_reference VARCHAR(100),        -- Committee resolution, approval reference
    justification TEXT,                     -- User-provided justification

    -- Multi-Tenant Scoping
    constituency_id UUID REFERENCES constituencies(id),

    -- AI Context (if AI was involved)
    ai_service_invoked BOOLEAN NOT NULL DEFAULT false,
    ai_service_type ai_service_type,
    ai_model_version VARCHAR(50),
    ai_input JSONB,
    ai_output JSONB,
    ai_confidence NUMERIC(3, 2),            -- 0.00 to 1.00
    ai_recommendation TEXT,
    human_override BOOLEAN,                 -- Did human override AI?
    human_override_justification TEXT,

    -- Hash Chain (Blockchain-Inspired)
    previous_entry_hash VARCHAR(64),        -- Hash of previous entry
    current_entry_hash VARCHAR(64) NOT NULL, -- Hash of this entry (includes previous hash)
    hash_algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA256',

    -- External Timestamp (Trusted Time Source)
    external_timestamp_token TEXT,          -- RFC 3161 timestamp token
    external_timestamp_authority VARCHAR(100),

    -- WORM Storage Reference
    worm_storage_url TEXT,                  -- S3 Object Lock URL
    worm_storage_verified BOOLEAN NOT NULL DEFAULT false,
    worm_storage_verification_date TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    retention_until DATE NOT NULL,          -- 10 years from creation

    -- Constraints
    CONSTRAINT chk_retention_period CHECK (retention_until >= (CURRENT_DATE + INTERVAL '10 years'))
);

CREATE INDEX idx_audit_log_timestamp ON audit_log(audit_timestamp DESC);
CREATE INDEX idx_audit_log_entry_number ON audit_log(audit_entry_number DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_user_id, audit_timestamp DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_constituency ON audit_log(constituency_id, audit_timestamp DESC);
CREATE INDEX idx_audit_log_ai ON audit_log(ai_service_invoked, audit_timestamp DESC)
    WHERE ai_service_invoked = true;
CREATE INDEX idx_audit_log_hash ON audit_log(current_entry_hash);

COMMENT ON TABLE audit_log IS 'Immutable audit log (operational queryable database)';
COMMENT ON COLUMN audit_log.current_entry_hash IS 'SHA-256 hash including previous entry hash (blockchain-style chain)';
COMMENT ON COLUMN audit_log.worm_storage_url IS 'S3 Object Lock URL for immutable WORM storage';
COMMENT ON COLUMN audit_log.retention_until IS 'Minimum 10-year retention from creation date';

-- Prevent UPDATE and DELETE on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries are immutable and cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER trg_prevent_audit_log_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- AUDIT LOG INTEGRITY VERIFICATION
-- ============================================================================
CREATE TABLE audit_log_integrity_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Verification Details
    verification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verification_type VARCHAR(50) NOT NULL, -- 'DAILY', 'WEEKLY', 'AUDIT_REQUEST', 'MANUAL'

    -- Range Verified
    start_entry_number BIGINT NOT NULL,
    end_entry_number BIGINT NOT NULL,
    entries_verified INTEGER NOT NULL,

    -- Results
    integrity_status VARCHAR(50) NOT NULL,  -- 'PASS', 'FAIL', 'WARNING'
    hash_chain_valid BOOLEAN NOT NULL,
    worm_storage_match BOOLEAN NOT NULL,

    -- Discrepancies
    broken_chain_entries BIGINT[],          -- Entry numbers with broken hash chain
    missing_worm_entries BIGINT[],          -- Entries missing from WORM storage
    discrepancy_count INTEGER NOT NULL DEFAULT 0,
    discrepancy_details JSONB,

    -- Verification Method
    verified_by VARCHAR(50) NOT NULL,       -- 'SYSTEM_AUTO', 'ADMIN_MANUAL', 'AUDITOR'
    verified_by_user_id UUID REFERENCES users(id),

    -- Alerts
    alerts_sent BOOLEAN NOT NULL DEFAULT false,
    alert_recipients TEXT[],                -- Emails/users notified

    -- Metadata
    verification_duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_integrity_checks_date ON audit_log_integrity_checks(verification_date DESC);
CREATE INDEX idx_audit_integrity_checks_status ON audit_log_integrity_checks(integrity_status);
CREATE INDEX idx_audit_integrity_checks_failures ON audit_log_integrity_checks(integrity_status, verification_date DESC)
    WHERE integrity_status != 'PASS';

COMMENT ON TABLE audit_log_integrity_checks IS 'Daily integrity verification of audit log and WORM storage';

-- ============================================================================
-- COMPLIANCE REPORTS
-- ============================================================================
CREATE TABLE compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Report Details
    report_reference VARCHAR(100) NOT NULL UNIQUE,
    report_type VARCHAR(50) NOT NULL,       -- 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'AUDIT_RESPONSE', 'ADHOC'
    report_title VARCHAR(200) NOT NULL,

    -- Scope
    scope_level VARCHAR(50) NOT NULL,       -- 'NATIONAL', 'PROVINCIAL', 'CONSTITUENCY'
    constituency_id UUID REFERENCES constituencies(id),
    province_id UUID REFERENCES provinces(id),

    -- Reporting Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,

    -- Compliance Metrics (Snapshot)
    compliance_data JSONB NOT NULL,         -- Complete compliance metrics as JSON

    -- Key Findings
    findings_summary TEXT,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,

    -- Overall Compliance Score
    compliance_score NUMERIC(5, 2),         -- 0.00 to 100.00
    compliance_grade VARCHAR(2),            -- 'A', 'B', 'C', 'D', 'F'

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_to VARCHAR(50),               -- 'PLGO', 'MINISTRY', 'OAG'
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Generated Document
    report_document_id UUID REFERENCES documents(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_compliance_reports_constituency ON compliance_reports(constituency_id);
CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_fiscal_year ON compliance_reports(fiscal_year);
CREATE INDEX idx_compliance_reports_status ON compliance_reports(status);
CREATE INDEX idx_compliance_reports_score ON compliance_reports(compliance_score DESC);

COMMENT ON TABLE compliance_reports IS 'Compliance reports for constituencies, provinces, and national';

-- ============================================================================
-- AUDIT FINDINGS (From OAG or Internal Audits)
-- ============================================================================
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Finding Details
    finding_reference VARCHAR(100) NOT NULL UNIQUE,
    finding_title VARCHAR(200) NOT NULL,
    finding_description TEXT NOT NULL,

    -- Classification
    finding_type VARCHAR(50) NOT NULL,      -- 'FINANCIAL', 'COMPLIANCE', 'OPERATIONAL', 'FRAUD', 'SYSTEM'
    severity VARCHAR(20) NOT NULL,          -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    finding_category VARCHAR(100),          -- Specific category (e.g., 'Procurement Irregularity')

    -- Scope
    constituency_id UUID REFERENCES constituencies(id),
    province_id UUID REFERENCES provinces(id),

    -- Related Entities
    related_projects UUID[],                -- Array of project IDs
    related_payments UUID[],                -- Array of payment IDs
    related_users UUID[],                   -- Array of user IDs involved

    -- Audit Context
    audit_reference VARCHAR(100),           -- OAG audit reference
    audit_period_start DATE,
    audit_period_end DATE,
    auditor_name VARCHAR(200),
    audit_date DATE NOT NULL,

    -- Financial Impact
    financial_impact NUMERIC(15, 2),        -- Amount involved (if applicable)
    potential_loss NUMERIC(15, 2),
    recovery_possible BOOLEAN,

    -- Recommendations
    recommendations TEXT NOT NULL,
    required_actions TEXT,
    action_deadline DATE,

    -- Response
    response_submitted BOOLEAN NOT NULL DEFAULT false,
    response_text TEXT,
    response_submitted_at TIMESTAMP WITH TIME ZONE,
    response_submitted_by UUID REFERENCES users(id),

    -- Remediation
    remediation_plan TEXT,
    remediation_status VARCHAR(50),         -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'
    remediation_completed_at TIMESTAMP WITH TIME ZONE,
    remediation_verified BOOLEAN NOT NULL DEFAULT false,
    remediation_verified_by UUID REFERENCES users(id),

    -- Escalation
    escalated BOOLEAN NOT NULL DEFAULT false,
    escalated_to VARCHAR(50),               -- 'MINISTRY', 'POLICE', 'ACC', 'DPP'
    escalation_date DATE,
    escalation_reference VARCHAR(100),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_audit_findings_constituency ON audit_findings(constituency_id);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX idx_audit_findings_type ON audit_findings(finding_type);
CREATE INDEX idx_audit_findings_status ON audit_findings(remediation_status);
CREATE INDEX idx_audit_findings_unresolved ON audit_findings(remediation_status, action_deadline)
    WHERE remediation_status IN ('PENDING', 'IN_PROGRESS', 'OVERDUE');

COMMENT ON TABLE audit_findings IS 'Audit findings from OAG or internal audits with remediation tracking';

-- ============================================================================
-- INVESTIGATIONS
-- ============================================================================
CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Investigation Details
    investigation_reference VARCHAR(100) NOT NULL UNIQUE,
    investigation_title VARCHAR(200) NOT NULL,
    investigation_type VARCHAR(50) NOT NULL, -- 'FRAUD', 'CORRUPTION', 'MISMANAGEMENT', 'COMPLIANCE', 'COMPLAINT'

    -- Allegation
    allegation_description TEXT NOT NULL,
    allegation_source VARCHAR(50),          -- 'INTERNAL', 'CITIZEN_COMPLAINT', 'AUDIT', 'WHISTLEBLOWER', 'AI_ALERT'
    allegation_date DATE NOT NULL,

    -- Scope
    constituency_id UUID REFERENCES constituencies(id),
    province_id UUID REFERENCES provinces(id),

    -- Subjects
    subject_users UUID[],                   -- Array of user IDs under investigation
    subject_contractors UUID[],             -- Array of contractor IDs
    related_projects UUID[],
    related_payments UUID[],

    -- Investigation Team
    lead_investigator_user_id UUID REFERENCES users(id),
    investigation_team UUID[],              -- Array of investigator user IDs

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'OPENED',
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    opened_by UUID REFERENCES users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    closure_reason TEXT,

    -- Findings
    preliminary_findings TEXT,
    final_findings TEXT,
    evidence_documents UUID[],              -- Array of document IDs
    witness_statements JSONB,

    -- Financial Impact
    estimated_loss NUMERIC(15, 2),
    actual_loss NUMERIC(15, 2),
    recovery_amount NUMERIC(15, 2),

    -- Outcome
    outcome VARCHAR(50),                    -- 'SUBSTANTIATED', 'UNSUBSTANTIATED', 'INCONCLUSIVE', 'REFERRED'
    referred_to VARCHAR(50),                -- 'POLICE', 'ACC', 'DPP', 'ADMINISTRATIVE_ACTION'
    referral_date DATE,
    referral_reference VARCHAR(100),

    -- Actions Taken
    disciplinary_action TEXT,
    system_improvements TEXT,
    policy_changes TEXT,

    -- Confidentiality
    is_confidential BOOLEAN NOT NULL DEFAULT true,
    access_restricted_to UUID[],            -- Array of user IDs with access

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_investigations_constituency ON investigations(constituency_id);
CREATE INDEX idx_investigations_type ON investigations(investigation_type);
CREATE INDEX idx_investigations_status ON investigations(status);
CREATE INDEX idx_investigations_lead ON investigations(lead_investigator_user_id);
CREATE INDEX idx_investigations_outcome ON investigations(outcome);

COMMENT ON TABLE investigations IS 'Fraud, corruption, and compliance investigations';

-- ============================================================================
-- WHISTLEBLOWER REPORTS
-- ============================================================================
CREATE TABLE whistleblower_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Report Details
    report_reference VARCHAR(100) NOT NULL UNIQUE,
    report_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Whistleblower (Optional Anonymous)
    whistleblower_name VARCHAR(200),
    whistleblower_contact VARCHAR(100),
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    whistleblower_user_id UUID REFERENCES users(id), -- If internal staff

    -- Allegation
    allegation_summary TEXT NOT NULL,
    allegation_details TEXT NOT NULL,
    allegation_type VARCHAR(50) NOT NULL,   -- 'FRAUD', 'CORRUPTION', 'MISUSE_OF_FUNDS', 'CONFLICT_OF_INTEREST', 'OTHER'

    -- Scope
    constituency_id UUID REFERENCES constituencies(id),
    alleged_perpetrators TEXT,              -- Names/descriptions (not IDs to protect anonymity)
    estimated_amount NUMERIC(15, 2),

    -- Supporting Evidence
    evidence_description TEXT,
    evidence_documents UUID[],

    -- Triage
    triaged BOOLEAN NOT NULL DEFAULT false,
    triaged_by UUID REFERENCES users(id),
    triaged_at TIMESTAMP WITH TIME ZONE,
    triage_priority VARCHAR(20),            -- 'URGENT', 'HIGH', 'MEDIUM', 'LOW'
    triage_notes TEXT,

    -- Investigation Link
    investigation_id UUID REFERENCES investigations(id),
    investigation_opened BOOLEAN NOT NULL DEFAULT false,

    -- Protection
    protection_requested BOOLEAN NOT NULL DEFAULT false,
    protection_measures TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_summary TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Confidentiality
    access_restricted BOOLEAN NOT NULL DEFAULT true,
    access_log JSONB,                       -- Log of who accessed this report

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_whistleblower_reports_date ON whistleblower_reports(report_date DESC);
CREATE INDEX idx_whistleblower_reports_constituency ON whistleblower_reports(constituency_id);
CREATE INDEX idx_whistleblower_reports_status ON whistleblower_reports(status);
CREATE INDEX idx_whistleblower_reports_unresolved ON whistleblower_reports(resolved)
    WHERE resolved = false;

COMMENT ON TABLE whistleblower_reports IS 'Anonymous whistleblower reports with protection measures';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_compliance_reports_updated_at
    BEFORE UPDATE ON compliance_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_audit_findings_updated_at
    BEFORE UPDATE ON audit_findings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_investigations_updated_at
    BEFORE UPDATE ON investigations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_whistleblower_reports_updated_at
    BEFORE UPDATE ON whistleblower_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whistleblower_reports ENABLE ROW LEVEL SECURITY;

-- Audit Log: Auditors and Ministry have full access; others limited
CREATE POLICY audit_log_read_policy ON audit_log
    FOR SELECT
    USING (
        current_user_role() IN ('AUDITOR_GENERAL', 'MINISTRY', 'SYSTEM_ADMIN')
        OR (constituency_id = ANY(current_user_constituencies()) AND actor_user_id = current_user_id())
    );

-- No write policy needed (audit log is append-only via application logic)

-- Compliance Reports: Constituency and national access
CREATE POLICY compliance_reports_policy ON compliance_reports
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Audit Findings: Constituency scope + national oversight
CREATE POLICY audit_findings_policy ON audit_findings
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
        OR current_user_role() = 'AUDITOR_GENERAL'
    );

-- Investigations: Restricted to investigators and national oversight
CREATE POLICY investigations_policy ON investigations
    FOR ALL
    USING (
        current_user_id() = ANY(investigation_team)
        OR current_user_id() = lead_investigator_user_id
        OR has_national_access()
        OR (NOT is_confidential AND current_user_role() IN ('AUDITOR_GENERAL', 'PLGO'))
    );

-- Whistleblower Reports: Highly restricted
CREATE POLICY whistleblower_reports_policy ON whistleblower_reports
    FOR ALL
    USING (
        current_user_role() IN ('AUDITOR_GENERAL', 'MINISTRY', 'SYSTEM_ADMIN')
        OR current_user_id() = triaged_by
    );

-- ============================================================================
-- AUDIT LOG HELPER FUNCTION
-- ============================================================================

-- Function to write to audit log (called by application layer)
CREATE OR REPLACE FUNCTION write_audit_log_entry(
    p_event_type audit_event_type,
    p_event_category VARCHAR(50),
    p_action VARCHAR(100),
    p_entity_type VARCHAR(100) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_data_before JSONB DEFAULT NULL,
    p_data_after JSONB DEFAULT NULL,
    p_justification TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_previous_hash VARCHAR(64);
    v_current_hash VARCHAR(64);
    v_constituency_id UUID;
BEGIN
    -- Get previous entry hash
    SELECT current_entry_hash INTO v_previous_hash
    FROM audit_log
    ORDER BY audit_entry_number DESC
    LIMIT 1;

    -- If no previous entry, use genesis hash
    IF v_previous_hash IS NULL THEN
        v_previous_hash := encode(digest('CDF_SMART_HUB_GENESIS_2024', 'sha256'), 'hex');
    END IF;

    -- Calculate current hash
    v_current_hash := encode(
        digest(
            v_previous_hash ||
            COALESCE(current_user_id()::TEXT, '') ||
            NOW()::TEXT ||
            p_event_type::TEXT ||
            COALESCE(p_entity_type, '') ||
            COALESCE(p_entity_id::TEXT, '') ||
            COALESCE(p_action, '') ||
            COALESCE(p_data_after::TEXT, ''),
            'sha256'
        ),
        'hex'
    );

    -- Get constituency from session or entity
    v_constituency_id := NULLIF(current_setting('app.current_user_constituency', true), '')::UUID;

    -- Insert audit log entry
    INSERT INTO audit_log (
        event_type,
        event_category,
        action,
        actor_user_id,
        actor_role,
        entity_type,
        entity_id,
        data_before,
        data_after,
        justification,
        constituency_id,
        previous_entry_hash,
        current_entry_hash,
        retention_until
    ) VALUES (
        p_event_type,
        p_event_category,
        p_action,
        current_user_id(),
        current_user_role(),
        p_entity_type,
        p_entity_id,
        p_data_before,
        p_data_after,
        p_justification,
        v_constituency_id,
        v_previous_hash,
        v_current_hash,
        CURRENT_DATE + INTERVAL '10 years'
    )
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION write_audit_log_entry IS 'Centralized function to write audit log entries with hash chaining';
