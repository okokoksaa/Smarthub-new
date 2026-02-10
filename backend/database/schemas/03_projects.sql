-- ============================================================================
-- CDF SMART HUB - PROJECT MANAGEMENT SCHEMA
-- ============================================================================
-- Purpose: Complete project lifecycle from Ward intake to closure
-- Workflow: WDC → TAC → CDFC → Procurement → Execution → Completion
-- Compliance: Full audit trail, budget controls, approval checkpoints
-- ============================================================================

-- ============================================================================
-- PROJECTS (Core Entity)
-- ============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    project_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'KABW-2024-001'
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,

    -- Multi-Tenant Scoping
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE RESTRICT,

    -- Project Classification
    category project_category NOT NULL,
    sub_category VARCHAR(100),
    priority task_priority NOT NULL DEFAULT 'MEDIUM',

    -- Financial
    estimated_budget NUMERIC(15, 2) NOT NULL,
    approved_budget NUMERIC(15, 2),
    actual_cost NUMERIC(15, 2) DEFAULT 0,
    committed_amount NUMERIC(15, 2) DEFAULT 0, -- Encumbered but not yet spent
    balance NUMERIC(15, 2) GENERATED ALWAYS AS (
        COALESCE(approved_budget, 0) - COALESCE(actual_cost, 0) - COALESCE(committed_amount, 0)
    ) STORED,

    -- Timeline
    proposed_start_date DATE,
    proposed_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    expected_duration_days INTEGER,          -- Expected duration in days

    -- Status & Progress
    status project_status NOT NULL DEFAULT 'DRAFT',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    is_milestone_project BOOLEAN NOT NULL DEFAULT false, -- High-visibility projects

    -- Location & Beneficiaries
    location_description TEXT,               -- Detailed location
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geojson_location JSONB,                  -- GeoJSON point/polygon
    direct_beneficiaries INTEGER,            -- Estimated number of direct beneficiaries
    indirect_beneficiaries INTEGER,
    beneficiary_demographics JSONB,          -- JSON: {male: 100, female: 150, children: 50, pwd: 10}

    -- Origination (Ward Development Committee)
    wdc_submission_date TIMESTAMP WITH TIME ZONE,
    wdc_priority_rank INTEGER,               -- WDC's priority ranking
    wdc_resolution_number VARCHAR(100),
    wdc_resolution_date DATE,
    submitted_by_user_id UUID REFERENCES users(id),

    -- Technical Assessment Committee (TAC)
    tac_review_started_at TIMESTAMP WITH TIME ZONE,
    tac_review_completed_at TIMESTAMP WITH TIME ZONE,
    tac_recommendation TEXT,                 -- TAC's technical recommendation
    tac_approved_by_user_id UUID REFERENCES users(id),
    tac_approval_date DATE,

    -- CDF Committee (CDFC) Approval
    cdfc_review_started_at TIMESTAMP WITH TIME ZONE,
    cdfc_review_completed_at TIMESTAMP WITH TIME ZONE,
    cdfc_resolution_number VARCHAR(100),
    cdfc_resolution_date DATE,
    cdfc_approved_by_user_id UUID REFERENCES users(id),
    cdfc_approval_conditions TEXT,           -- Any conditions attached to approval

    -- Contract & Procurement
    procurement_method procurement_method,
    contract_id UUID,                        -- FK to contracts table (created later)
    contractor_id UUID,                      -- FK to contractors table

    -- Monitoring & Evaluation
    last_inspection_date DATE,
    next_inspection_due_date DATE,
    quality_rating INTEGER,                  -- 1-5 rating from M&E
    quality_issues JSONB,                    -- Array of quality issues identified

    -- Completion & Closure
    completion_certificate_issued BOOLEAN NOT NULL DEFAULT false,
    completion_certificate_date DATE,
    handover_date DATE,
    handover_recipient TEXT,                 -- Community/authority who received project
    closure_report_url TEXT,
    lessons_learned TEXT,

    -- Risk Management
    risk_level VARCHAR(20),                  -- LOW, MEDIUM, HIGH, CRITICAL
    risk_factors JSONB,                      -- Array of identified risk factors
    mitigation_measures TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,     -- Soft delete
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_project_budget CHECK (estimated_budget > 0),
    CONSTRAINT chk_project_progress CHECK (progress_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_project_dates CHECK (
        proposed_end_date IS NULL OR proposed_start_date IS NULL OR proposed_end_date >= proposed_start_date
    ),
    CONSTRAINT chk_project_quality CHECK (quality_rating IS NULL OR quality_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_projects_constituency ON projects(constituency_id);
CREATE INDEX idx_projects_ward ON projects(ward_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_number ON projects(project_number);
CREATE INDEX idx_projects_active ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_location ON projects USING gist(
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_projects_dates ON projects(proposed_start_date, proposed_end_date);

COMMENT ON TABLE projects IS 'Core CDF projects from intake to closure';
COMMENT ON COLUMN projects.project_number IS 'Unique project identifier (e.g., KABW-2024-001)';
COMMENT ON COLUMN projects.balance IS 'Calculated: approved_budget - actual_cost - committed_amount';
COMMENT ON COLUMN projects.wdc_priority_rank IS 'Ward-level priority ranking by WDC';

-- ============================================================================
-- PROJECT STATUS HISTORY
-- ============================================================================
-- Immutable log of all status changes
CREATE TABLE project_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Status Transition
    from_status project_status,              -- NULL for initial status
    to_status project_status NOT NULL,

    -- Change Context
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    changed_by_user_id UUID NOT NULL REFERENCES users(id),
    change_reason TEXT,
    supporting_document_id UUID,             -- Reference to supporting document

    -- Approval Details (if applicable)
    approval_body VARCHAR(50),               -- 'WDC', 'TAC', 'CDFC'
    approval_reference VARCHAR(100),         -- Resolution number
    conditions_attached TEXT
);

CREATE INDEX idx_project_status_history_project ON project_status_history(project_id, changed_at DESC);
CREATE INDEX idx_project_status_history_user ON project_status_history(changed_by_user_id);

COMMENT ON TABLE project_status_history IS 'Immutable audit trail of project status changes';

-- ============================================================================
-- PROJECT MILESTONES
-- ============================================================================
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Milestone Details
    milestone_number INTEGER NOT NULL,       -- Sequential within project (1, 2, 3...)
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Timeline
    planned_completion_date DATE NOT NULL,
    actual_completion_date DATE,

    -- Financial
    milestone_value NUMERIC(15, 2) NOT NULL, -- Payment upon milestone completion
    percentage_of_contract NUMERIC(5, 2),    -- % of total contract value

    -- Status
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_by_user_id UUID REFERENCES users(id),
    verification_date DATE,
    verification_notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id, milestone_number),
    CONSTRAINT chk_milestone_value CHECK (milestone_value > 0),
    CONSTRAINT chk_milestone_percentage CHECK (percentage_of_contract > 0 AND percentage_of_contract <= 100)
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id, milestone_number);
CREATE INDEX idx_project_milestones_dates ON project_milestones(planned_completion_date, actual_completion_date);

COMMENT ON TABLE project_milestones IS 'Project milestones for progress tracking and milestone-based payments';

-- ============================================================================
-- PROJECT TEAM MEMBERS
-- ============================================================================
-- Tracks who is involved in each project
CREATE TABLE project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role in Project
    role VARCHAR(100) NOT NULL,              -- 'Project Manager', 'Engineer', 'Supervisor', etc.
    is_lead BOOLEAN NOT NULL DEFAULT false,

    -- Assignment Period
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    removed_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID REFERENCES users(id),
    removal_reason TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id, user_id, role)
);

CREATE INDEX idx_project_team_project ON project_team_members(project_id);
CREATE INDEX idx_project_team_user ON project_team_members(user_id);
CREATE INDEX idx_project_team_active ON project_team_members(project_id, user_id)
    WHERE removed_at IS NULL;

COMMENT ON TABLE project_team_members IS 'Team members assigned to projects';

-- ============================================================================
-- PROJECT INSPECTIONS (M&E)
-- ============================================================================
CREATE TABLE project_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Inspection Details
    inspection_number VARCHAR(50) NOT NULL,  -- e.g., 'KABW-2024-001-INSP-01'
    inspection_date DATE NOT NULL,
    inspection_type VARCHAR(50) NOT NULL,    -- 'Inception', 'Progress', 'Final', 'Spot Check'

    -- Inspector
    inspector_user_id UUID NOT NULL REFERENCES users(id),
    inspector_name VARCHAR(200),             -- Full name
    inspector_title VARCHAR(100),

    -- Findings
    progress_percentage INTEGER,             -- Progress at time of inspection
    quality_rating INTEGER,                  -- 1-5 rating
    compliance_status VARCHAR(50),           -- 'Compliant', 'Non-Compliant', 'Partially Compliant'
    findings TEXT NOT NULL,
    recommendations TEXT,
    issues_identified JSONB,                 -- Array of issues
    photos_urls TEXT[],                      -- URLs to inspection photos

    -- Follow-up
    requires_follow_up BOOLEAN NOT NULL DEFAULT false,
    follow_up_date DATE,
    follow_up_completed BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id, inspection_number),
    CONSTRAINT chk_inspection_progress CHECK (progress_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_inspection_quality CHECK (quality_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_inspections_project ON project_inspections(project_id, inspection_date DESC);
CREATE INDEX idx_inspections_inspector ON project_inspections(inspector_user_id);
CREATE INDEX idx_inspections_follow_up ON project_inspections(project_id)
    WHERE requires_follow_up = true AND follow_up_completed = false;

COMMENT ON TABLE project_inspections IS 'M&E inspection records for project monitoring';

-- ============================================================================
-- PROJECT BENEFICIARIES
-- ============================================================================
-- Direct beneficiaries registered for the project
CREATE TABLE project_beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Beneficiary Details
    national_id_number VARCHAR(20) NOT NULL, -- NRC number
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender gender,
    date_of_birth DATE,
    phone_number VARCHAR(20),

    -- Demographics
    is_pwd BOOLEAN NOT NULL DEFAULT false,   -- Person with Disability
    is_elderly BOOLEAN NOT NULL DEFAULT false,
    is_youth BOOLEAN NOT NULL DEFAULT false,
    household_size INTEGER,

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by_user_id UUID REFERENCES users(id),
    verification_method VARCHAR(50),         -- 'NRC_CHECK', 'COMMUNITY_VERIFICATION', etc.

    -- Metadata
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id, national_id_number)
);

CREATE INDEX idx_beneficiaries_project ON project_beneficiaries(project_id);
CREATE INDEX idx_beneficiaries_nrc ON project_beneficiaries(national_id_number);
CREATE INDEX idx_beneficiaries_verified ON project_beneficiaries(is_verified) WHERE is_verified = true;

COMMENT ON TABLE project_beneficiaries IS 'Registered beneficiaries for projects (e.g., bursaries, empowerment)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_project_milestones_updated_at
    BEFORE UPDATE ON project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_project_inspections_updated_at
    BEFORE UPDATE ON project_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create status history entry on status change
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO project_status_history (
            project_id,
            from_status,
            to_status,
            changed_by_user_id,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            current_user_id(),
            'Status changed via project update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_status_change
    AFTER UPDATE ON projects
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION log_project_status_change();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_beneficiaries ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see projects in their constituency scope
CREATE POLICY projects_tenant_isolation ON projects
    FOR SELECT
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
        OR deleted_at IS NULL
    );

-- Projects: Write access based on role and status
CREATE POLICY projects_write_policy ON projects
    FOR ALL
    USING (
        (current_user_role() IN ('WDC_CHAIR', 'WDC_MEMBER') AND status = 'DRAFT')
        OR (current_user_role() IN ('TAC_MEMBER', 'CDFC_CHAIR', 'CDFC_MEMBER'))
        OR has_national_access()
    );

-- Status History: Read-only, follows project visibility
CREATE POLICY project_status_history_read ON project_status_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.constituency_id = ANY(current_user_constituencies()) OR has_national_access())
        )
    );

-- Milestones: Follow project visibility
CREATE POLICY project_milestones_policy ON project_milestones
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND (p.constituency_id = ANY(current_user_constituencies()) OR has_national_access())
        )
    );

-- Inspections: M&E officers and national roles
CREATE POLICY project_inspections_policy ON project_inspections
    FOR ALL
    USING (
        current_user_role() IN ('M_AND_E_OFFICER', 'MINISTRY', 'AUDITOR_GENERAL', 'SYSTEM_ADMIN')
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_id
            AND p.constituency_id = ANY(current_user_constituencies())
        )
    );
