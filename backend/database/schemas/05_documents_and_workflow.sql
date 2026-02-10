-- ============================================================================
-- CDF SMART HUB - DOCUMENT MANAGEMENT & WORKFLOW SCHEMA
-- ============================================================================
-- Purpose: Immutable document storage, version control, digital signatures,
--          workflow orchestration, state machines, SLA tracking
-- Compliance: Document integrity, tamper detection, audit trail
-- Controls: Hash verification, WORM storage links, workflow gates
-- ============================================================================

-- ============================================================================
-- DOCUMENTS (Immutable Storage)
-- ============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Document Identification
    document_number VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'DOC-2024-00123'
    document_type document_type NOT NULL,

    -- File Details
    file_name VARCHAR(255) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,

    -- Storage Location
    storage_provider VARCHAR(50) NOT NULL DEFAULT 'S3', -- 'S3', 'AZURE_BLOB', 'LOCAL'
    storage_bucket VARCHAR(100) NOT NULL,
    storage_key TEXT NOT NULL,               -- S3 key or blob path
    storage_region VARCHAR(50),

    -- Integrity
    file_hash VARCHAR(64) NOT NULL,          -- SHA-256 hash
    hash_algorithm VARCHAR(20) NOT NULL DEFAULT 'SHA256',

    -- Metadata Extraction
    metadata JSONB,                          -- Extracted metadata (EXIF, PDF metadata, etc.)
    extracted_text TEXT,                     -- OCR or PDF text extraction
    gps_latitude NUMERIC(10, 7),            -- From EXIF or manual entry
    gps_longitude NUMERIC(10, 7),           -- From EXIF or manual entry
    capture_timestamp TIMESTAMP WITH TIME ZONE, -- From EXIF or manual entry

    -- Multi-Tenant Scoping
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),

    -- Links to Entities
    project_id UUID REFERENCES projects(id),
    payment_voucher_id UUID REFERENCES payment_vouchers(id),
    meeting_id UUID,                        -- FK to meetings table (created later)

    -- Access Control
    access_level VARCHAR(50) NOT NULL DEFAULT 'INTERNAL', -- 'PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL'
    published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,

    -- Versioning
    version_number INTEGER NOT NULL DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id), -- Previous version
    is_latest_version BOOLEAN NOT NULL DEFAULT true,

    -- Digital Signature
    is_signed BOOLEAN NOT NULL DEFAULT false,
    signed_by_user_id UUID REFERENCES users(id),
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_certificate_dn TEXT,          -- Distinguished Name from certificate
    signature_hash TEXT,                    -- Digital signature hash

    -- QR Code
    qr_code_data TEXT,                      -- QR code payload (JSON)
    qr_code_image_url TEXT,                 -- URL to QR code image

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,    -- Soft delete (logical only, file remains)
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT chk_gps_coordinates CHECK (
        (gps_latitude IS NULL AND gps_longitude IS NULL) OR
        (gps_latitude BETWEEN -90 AND 90 AND gps_longitude BETWEEN -180 AND 180)
    )
);

CREATE INDEX idx_documents_number ON documents(document_number);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_hash ON documents(file_hash);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_payment ON documents(payment_voucher_id);
CREATE INDEX idx_documents_constituency ON documents(constituency_id);
CREATE INDEX idx_documents_latest ON documents(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX idx_documents_public ON documents(published, access_level) WHERE published = true;

COMMENT ON TABLE documents IS 'Immutable document storage with integrity verification';
COMMENT ON COLUMN documents.file_hash IS 'SHA-256 hash for tamper detection';
COMMENT ON COLUMN documents.qr_code_data IS 'JSON payload for QR verification';

-- ============================================================================
-- DOCUMENT ACCESS LOG
-- ============================================================================
CREATE TABLE document_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Document and User
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),       -- NULL for public access

    -- Access Details
    access_type VARCHAR(50) NOT NULL,        -- 'VIEW', 'DOWNLOAD', 'PRINT', 'VERIFY_QR'
    access_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Context
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    geolocation JSONB,                       -- {country, city, lat, lon}

    -- Access Source
    access_source VARCHAR(50),               -- 'WEB_APP', 'MOBILE_APP', 'PUBLIC_PORTAL', 'API'

    -- Success
    access_successful BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT
);

CREATE INDEX idx_document_access_document ON document_access_log(document_id, access_timestamp DESC);
CREATE INDEX idx_document_access_user ON document_access_log(user_id, access_timestamp DESC);
CREATE INDEX idx_document_access_type ON document_access_log(access_type, access_timestamp DESC);
CREATE INDEX idx_document_access_timestamp ON document_access_log(access_timestamp DESC);

COMMENT ON TABLE document_access_log IS 'Immutable log of all document access attempts';

-- ============================================================================
-- WORKFLOW DEFINITIONS (State Machines)
-- ============================================================================
CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workflow Details
    workflow_code VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'PROJECT_APPROVAL', 'PAYMENT_PROCESSING'
    workflow_name VARCHAR(200) NOT NULL,
    workflow_description TEXT,

    -- Entity Type
    entity_type VARCHAR(100) NOT NULL,       -- 'PROJECT', 'PAYMENT', 'MEETING', etc.

    -- State Machine Definition (JSON)
    states JSONB NOT NULL,                   -- Array of state definitions
    transitions JSONB NOT NULL,              -- Array of allowed state transitions
    initial_state VARCHAR(100) NOT NULL,
    terminal_states VARCHAR(100)[] NOT NULL, -- Array of end states

    -- SLA Configuration
    sla_enabled BOOLEAN NOT NULL DEFAULT false,
    sla_rules JSONB,                        -- State-specific SLA rules

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    version_number INTEGER NOT NULL DEFAULT 1,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_workflow_definitions_code ON workflow_definitions(workflow_code);
CREATE INDEX idx_workflow_definitions_entity ON workflow_definitions(entity_type);
CREATE INDEX idx_workflow_definitions_active ON workflow_definitions(is_active) WHERE is_active = true;

COMMENT ON TABLE workflow_definitions IS 'Workflow state machine definitions';
COMMENT ON COLUMN workflow_definitions.states IS 'JSON array of state definitions with metadata';
COMMENT ON COLUMN workflow_definitions.transitions IS 'JSON array of allowed state transitions with prerequisites';

-- ============================================================================
-- WORKFLOW INSTANCES (Active Workflows)
-- ============================================================================
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workflow Definition
    workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
    workflow_code VARCHAR(100) NOT NULL,    -- Denormalized for performance

    -- Entity Link
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,                -- project_id, payment_id, etc.

    -- Current State
    current_state VARCHAR(100) NOT NULL,
    previous_state VARCHAR(100),

    -- State Timing
    state_entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    state_sla_deadline TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN NOT NULL DEFAULT false,

    -- Workflow Status
    workflow_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED', 'SUSPENDED'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,

    -- Assigned To
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_to_role user_role,

    -- Metadata
    workflow_data JSONB,                    -- Workflow-specific data
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_workflow_instances_definition ON workflow_instances(workflow_definition_id);
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_state ON workflow_instances(current_state, workflow_status);
CREATE INDEX idx_workflow_instances_assigned ON workflow_instances(assigned_to_user_id, workflow_status);
CREATE INDEX idx_workflow_instances_overdue ON workflow_instances(is_overdue, state_sla_deadline)
    WHERE is_overdue = true AND workflow_status = 'ACTIVE';

COMMENT ON TABLE workflow_instances IS 'Active workflow instances tracking state progression';
COMMENT ON COLUMN workflow_instances.state_sla_deadline IS 'SLA deadline for current state';

-- ============================================================================
-- WORKFLOW STATE HISTORY (Audit Trail)
-- ============================================================================
CREATE TABLE workflow_state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workflow Instance
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,

    -- State Transition
    from_state VARCHAR(100),                -- NULL for initial state
    to_state VARCHAR(100) NOT NULL,
    transition_type VARCHAR(50) NOT NULL,   -- 'NORMAL', 'ESCALATION', 'OVERRIDE', 'CANCELLATION'

    -- Transition Context
    transitioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    transitioned_by_user_id UUID REFERENCES users(id),
    transition_reason TEXT,
    prerequisites_met JSONB,                -- Which prerequisites were validated
    override_justification TEXT,            -- If transition overrode normal flow

    -- Timing
    time_in_previous_state_seconds INTEGER,
    sla_met BOOLEAN,
    sla_deadline TIMESTAMP WITH TIME ZONE,

    -- Supporting Data
    supporting_document_ids UUID[],
    approval_votes JSONB,                   -- For committee approvals
    digital_signatures JSONB                -- For multi-party approvals
);

CREATE INDEX idx_workflow_history_instance ON workflow_state_history(workflow_instance_id, transitioned_at DESC);
CREATE INDEX idx_workflow_history_user ON workflow_state_history(transitioned_by_user_id);
CREATE INDEX idx_workflow_history_timestamp ON workflow_state_history(transitioned_at DESC);

COMMENT ON TABLE workflow_state_history IS 'Immutable log of all workflow state transitions';

-- ============================================================================
-- WORKFLOW TASKS (Actionable Items)
-- ============================================================================
CREATE TABLE workflow_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Workflow Instance
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,

    -- Task Details
    task_type task_type NOT NULL,
    task_title VARCHAR(200) NOT NULL,
    task_description TEXT,
    task_priority task_priority NOT NULL DEFAULT 'MEDIUM',

    -- Assignment
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_to_role user_role,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Due Date
    due_date TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        due_date IS NOT NULL AND NOW() > due_date AND status NOT IN ('COMPLETED', 'CANCELLED')
    ) STORED,

    -- Status
    status task_status NOT NULL DEFAULT 'PENDING',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_user_id UUID REFERENCES users(id),
    completion_notes TEXT,

    -- Links
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    required_documents document_type[],

    -- Escalation
    escalated BOOLEAN NOT NULL DEFAULT false,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_to_user_id UUID REFERENCES users(id),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_workflow_tasks_instance ON workflow_tasks(workflow_instance_id);
CREATE INDEX idx_workflow_tasks_assigned_user ON workflow_tasks(assigned_to_user_id, status);
CREATE INDEX idx_workflow_tasks_assigned_role ON workflow_tasks(assigned_to_role, status);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_overdue ON workflow_tasks(is_overdue, due_date)
    WHERE is_overdue = true;

COMMENT ON TABLE workflow_tasks IS 'Actionable tasks generated by workflows';

-- ============================================================================
-- MEETINGS (Committee Meetings)
-- ============================================================================
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Meeting Details
    meeting_number VARCHAR(100) NOT NULL UNIQUE,
    meeting_type VARCHAR(50) NOT NULL,      -- 'CDFC', 'TAC', 'WDC', 'PANEL_A', 'PANEL_B'
    meeting_title VARCHAR(200) NOT NULL,

    -- Committee
    committee_type VARCHAR(50) NOT NULL,    -- 'CDFC', 'TAC', 'WDC'
    constituency_id UUID REFERENCES constituencies(id),
    province_id UUID REFERENCES provinces(id),

    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,

    -- Location
    meeting_location VARCHAR(200),
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    virtual_meeting_link TEXT,

    -- Agenda
    agenda_items JSONB,                     -- Array of agenda items

    -- Attendance
    required_quorum INTEGER NOT NULL,
    actual_attendance INTEGER,
    quorum_met BOOLEAN,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'

    -- Minutes
    minutes_draft TEXT,
    minutes_finalized TEXT,
    minutes_approved_at TIMESTAMP WITH TIME ZONE,
    minutes_document_id UUID REFERENCES documents(id),

    -- Decisions
    decisions_made JSONB,                   -- Array of decisions with votes

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_meetings_constituency ON meetings(constituency_id);
CREATE INDEX idx_meetings_type ON meetings(meeting_type);
CREATE INDEX idx_meetings_date ON meetings(scheduled_date);
CREATE INDEX idx_meetings_status ON meetings(status);

COMMENT ON TABLE meetings IS 'Committee meetings (CDFC, TAC, WDC, etc.)';

-- ============================================================================
-- MEETING ATTENDANCE
-- ============================================================================
CREATE TABLE meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Meeting and Attendee
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    -- Attendance Details
    role_in_meeting VARCHAR(100),           -- 'CHAIRPERSON', 'MEMBER', 'SECRETARY', 'OBSERVER'
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'EXPECTED', -- 'EXPECTED', 'PRESENT', 'ABSENT', 'EXCUSED'

    -- Check-in
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    check_in_method VARCHAR(50),            -- 'MANUAL', 'BIOMETRIC', 'DIGITAL_SIGNATURE'

    -- Participation
    participated BOOLEAN NOT NULL DEFAULT false,
    contribution_notes TEXT,

    -- Conflicts
    conflict_declared BOOLEAN NOT NULL DEFAULT false,
    conflict_description TEXT,
    recused_from_items TEXT[],              -- Array of agenda item IDs

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_user ON meeting_attendance(user_id);
CREATE INDEX idx_meeting_attendance_status ON meeting_attendance(attendance_status);

COMMENT ON TABLE meeting_attendance IS 'Meeting attendance tracking with conflict declarations';

-- ============================================================================
-- MEETING VOTES
-- ============================================================================
CREATE TABLE meeting_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Meeting and Agenda Item
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    agenda_item_id VARCHAR(100) NOT NULL,   -- ID within meeting agenda JSON

    -- Vote Details
    vote_description TEXT NOT NULL,
    vote_type VARCHAR(50) NOT NULL,         -- 'SIMPLE_MAJORITY', 'TWO_THIRDS', 'UNANIMOUS', 'SECRET_BALLOT'

    -- Vote Results
    votes_for INTEGER NOT NULL DEFAULT 0,
    votes_against INTEGER NOT NULL DEFAULT 0,
    votes_abstain INTEGER NOT NULL DEFAULT 0,
    total_eligible_voters INTEGER NOT NULL,

    -- Outcome
    vote_passed BOOLEAN NOT NULL,
    vote_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Individual Votes (if not secret ballot)
    individual_votes JSONB,                 -- {user_id: 'FOR'|'AGAINST'|'ABSTAIN'}

    -- Related Entity
    entity_type VARCHAR(100),               -- 'PROJECT', 'PAYMENT', etc.
    entity_id UUID,

    -- Metadata
    recorded_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meeting_votes_meeting ON meeting_votes(meeting_id);
CREATE INDEX idx_meeting_votes_entity ON meeting_votes(entity_type, entity_id);

COMMENT ON TABLE meeting_votes IS 'Individual votes recorded during meetings';
COMMENT ON COLUMN meeting_votes.individual_votes IS 'JSON object mapping user_id to vote (NULL for secret ballot)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_workflow_definitions_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_workflow_tasks_updated_at
    BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_meeting_attendance_updated_at
    BEFORE UPDATE ON meeting_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create workflow state history entry on state change
CREATE OR REPLACE FUNCTION log_workflow_state_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_state <> OLD.current_state THEN
        INSERT INTO workflow_state_history (
            workflow_instance_id,
            from_state,
            to_state,
            transition_type,
            transitioned_by_user_id,
            time_in_previous_state_seconds,
            sla_met,
            sla_deadline
        ) VALUES (
            NEW.id,
            OLD.current_state,
            NEW.current_state,
            'NORMAL',
            current_user_id(),
            EXTRACT(EPOCH FROM (NOW() - OLD.state_entered_at))::INTEGER,
            CASE
                WHEN OLD.state_sla_deadline IS NULL THEN NULL
                WHEN NOW() <= OLD.state_sla_deadline THEN true
                ELSE false
            END,
            OLD.state_sla_deadline
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_state_change
    AFTER UPDATE ON workflow_instances
    FOR EACH ROW
    WHEN (NEW.current_state IS DISTINCT FROM OLD.current_state)
    EXECUTE FUNCTION log_workflow_state_change();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Documents: Public documents accessible to all; internal to constituency scope
CREATE POLICY documents_read_policy ON documents
    FOR SELECT
    USING (
        published = true AND access_level = 'PUBLIC'
        OR (constituency_id = ANY(current_user_constituencies()) OR has_national_access())
    );

-- Workflow Instances: Follow entity permissions
CREATE POLICY workflow_instances_policy ON workflow_instances
    FOR ALL
    USING (
        -- Link to entity and check permissions there
        -- For now, allow constituency scope
        has_national_access()
        OR current_user_role() IN ('CDFC_CHAIR', 'CDFC_MEMBER', 'FINANCE_OFFICER', 'PLGO')
    );

-- Workflow Tasks: Assigned users or national roles
CREATE POLICY workflow_tasks_policy ON workflow_tasks
    FOR ALL
    USING (
        assigned_to_user_id = current_user_id()
        OR assigned_to_role = current_user_role()
        OR has_national_access()
    );

-- Meetings: Constituency scope
CREATE POLICY meetings_policy ON meetings
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- ============================================================================
-- SEED DATA: Workflow Definitions
-- ============================================================================

INSERT INTO workflow_definitions (
    workflow_code,
    workflow_name,
    workflow_description,
    entity_type,
    states,
    transitions,
    initial_state,
    terminal_states,
    sla_enabled,
    sla_rules
) VALUES
(
    'PROJECT_APPROVAL',
    'Project Approval Workflow',
    'Complete workflow from WDC submission to PLGO approval',
    'PROJECT',
    '[
        {"code": "DRAFT", "name": "Draft", "description": "Being prepared"},
        {"code": "SUBMITTED", "name": "Submitted", "description": "Submitted to CDFC"},
        {"code": "CDFC_REVIEW", "name": "CDFC Review", "description": "Under CDFC review"},
        {"code": "TAC_APPRAISAL", "name": "TAC Appraisal", "description": "Technical appraisal"},
        {"code": "PLGO_REVIEW", "name": "PLGO Review", "description": "Final approval by PLGO"},
        {"code": "APPROVED", "name": "Approved", "description": "Project approved"},
        {"code": "REJECTED", "name": "Rejected", "description": "Project rejected"}
    ]'::JSONB,
    '[
        {"from": "DRAFT", "to": "SUBMITTED", "prerequisites": ["documents_complete"]},
        {"from": "SUBMITTED", "to": "CDFC_REVIEW", "prerequisites": []},
        {"from": "CDFC_REVIEW", "to": "TAC_APPRAISAL", "prerequisites": ["cdfc_approved", "budget_check"]},
        {"from": "CDFC_REVIEW", "to": "REJECTED", "prerequisites": ["cdfc_rejected"]},
        {"from": "TAC_APPRAISAL", "to": "PLGO_REVIEW", "prerequisites": ["tac_completed"]},
        {"from": "PLGO_REVIEW", "to": "APPROVED", "prerequisites": ["plgo_approved"]},
        {"from": "PLGO_REVIEW", "to": "REJECTED", "prerequisites": ["plgo_rejected"]}
    ]'::JSONB,
    'DRAFT',
    ARRAY['APPROVED', 'REJECTED'],
    true,
    '{
        "CDFC_REVIEW": {"sla_days": 30, "escalate_to": "PLGO"},
        "TAC_APPRAISAL": {"sla_days": 14, "escalate_to": "TAC_CHAIR"},
        "PLGO_REVIEW": {"sla_days": 7, "escalate_to": "MINISTRY"}
    }'::JSONB
),
(
    'PAYMENT_PROCESSING',
    'Payment Processing Workflow',
    'Dual-approval payment workflow (Panel A + Panel B)',
    'PAYMENT',
    '[
        {"code": "SUBMITTED", "name": "Submitted", "description": "Payment claim submitted"},
        {"code": "PENDING_PANEL_A", "name": "Pending Panel A", "description": "Awaiting CDFC approval"},
        {"code": "PENDING_PANEL_B", "name": "Pending Panel B", "description": "Awaiting Local Authority"},
        {"code": "APPROVED", "name": "Approved", "description": "Ready for execution"},
        {"code": "EXECUTED", "name": "Executed", "description": "Payment sent to bank"},
        {"code": "RECONCILED", "name": "Reconciled", "description": "Bank confirmed"},
        {"code": "REJECTED", "name": "Rejected", "description": "Payment rejected"}
    ]'::JSONB,
    '[
        {"from": "SUBMITTED", "to": "PENDING_PANEL_A", "prerequisites": ["documents_complete"]},
        {"from": "PENDING_PANEL_A", "to": "PENDING_PANEL_B", "prerequisites": ["panel_a_approved"]},
        {"from": "PENDING_PANEL_A", "to": "REJECTED", "prerequisites": ["panel_a_rejected"]},
        {"from": "PENDING_PANEL_B", "to": "APPROVED", "prerequisites": ["panel_b_approved"]},
        {"from": "PENDING_PANEL_B", "to": "REJECTED", "prerequisites": ["panel_b_rejected"]},
        {"from": "APPROVED", "to": "EXECUTED", "prerequisites": ["bank_instruction_sent"]},
        {"from": "EXECUTED", "to": "RECONCILED", "prerequisites": ["bank_confirmed"]}
    ]'::JSONB,
    'SUBMITTED',
    ARRAY['RECONCILED', 'REJECTED'],
    true,
    '{
        "PENDING_PANEL_A": {"sla_days": 7, "escalate_to": "CDFC_CHAIR"},
        "PENDING_PANEL_B": {"sla_days": 3, "escalate_to": "PLGO"},
        "APPROVED": {"sla_days": 2, "escalate_to": "FINANCE_OFFICER"}
    }'::JSONB
)
ON CONFLICT (workflow_code) DO NOTHING;

COMMENT ON TABLE workflow_definitions IS 'Pre-defined workflows for projects, payments, etc.';
