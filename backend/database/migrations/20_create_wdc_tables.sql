-- ============================================================================
-- CDF SMART HUB - WDC (Ward Intake & Community) Module Database Schema
-- ============================================================================
-- Purpose: Create tables for Ward Development Committee operations
-- Module: Ward Intake & Community (WDC)
-- Version: 1.0
-- Author: CDF Smart Hub Team
-- ============================================================================

\echo 'Creating WDC Module Tables...';

-- ============================================================================
-- WDC APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wdc_applications (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Application identification
    application_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Application type and details
    application_type VARCHAR(20) NOT NULL CHECK (application_type IN ('PROJECT', 'GRANT_LOAN', 'BURSARY')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget_estimate DECIMAL(15,2) NOT NULL CHECK (budget_estimate > 0),
    beneficiaries_count INTEGER NOT NULL CHECK (beneficiaries_count > 0),
    
    -- Geographic scope
    ward_id UUID NOT NULL,
    constituency_id UUID NOT NULL,
    district_id UUID NOT NULL,
    province_id UUID NOT NULL,
    
    -- Applicant information
    applicant_name VARCHAR(200) NOT NULL,
    applicant_nrc VARCHAR(20) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_address TEXT NOT NULL,
    applicant_email VARCHAR(255),
    
    -- Application status and workflow
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'WDC_REVIEW', 'WDC_APPROVED', 'WDC_REJECTED',
        'FORWARDED_TO_CDFC', 'CDFC_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'
    )),
    
    -- Submission tracking
    submitted_at TIMESTAMPTZ,
    wdc_reviewed_at TIMESTAMPTZ,
    wdc_review_comments TEXT,
    wdc_approved_by UUID,
    
    -- Requirements verification
    residency_verified BOOLEAN NOT NULL DEFAULT false,
    residency_verified_by UUID,
    residency_verified_at TIMESTAMPTZ,
    
    meeting_minutes_attached BOOLEAN NOT NULL DEFAULT false,
    meeting_id UUID,
    
    -- Audit trail
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Foreign key constraints
    FOREIGN KEY (ward_id) REFERENCES wards(id),
    FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (wdc_approved_by) REFERENCES users(id),
    FOREIGN KEY (residency_verified_by) REFERENCES users(id),
    FOREIGN KEY (meeting_id) REFERENCES wdc_meetings(id) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- WDC MEETINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wdc_meetings (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Meeting identification
    meeting_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Geographic scope
    ward_id UUID NOT NULL,
    constituency_id UUID NOT NULL,
    district_id UUID NOT NULL,
    province_id UUID NOT NULL,
    
    -- Meeting details
    meeting_type VARCHAR(20) NOT NULL CHECK (meeting_type IN ('REGULAR', 'EMERGENCY', 'SPECIAL')),
    meeting_date TIMESTAMPTZ NOT NULL,
    location VARCHAR(200) NOT NULL,
    agenda TEXT NOT NULL,
    
    -- Attendance tracking
    expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
    actual_attendees INTEGER DEFAULT 0 CHECK (actual_attendees >= 0),
    attendees_present TEXT[], -- Array of attendee names
    
    -- Quorum and status
    quorum_required INTEGER NOT NULL,
    quorum_met BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'
    )),
    
    -- Meeting outcomes
    decisions_made TEXT,
    actions_assigned TEXT,
    next_meeting_date TIMESTAMPTZ,
    
    -- Audit trail
    created_by UUID NOT NULL,
    updated_by UUID,
    completed_by UUID,
    completed_at TIMESTAMPTZ,
    
    -- Foreign key constraints
    FOREIGN KEY (ward_id) REFERENCES wards(id),
    FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- ============================================================================
-- WDC MINUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wdc_minutes (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Meeting reference
    meeting_id UUID NOT NULL,
    
    -- Document information
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('PDF', 'DOC', 'DOCX')),
    document_size_bytes INTEGER NOT NULL,
    
    -- Minutes content
    recorded_date DATE NOT NULL,
    attendees_present TEXT[] NOT NULL,
    decisions_made TEXT NOT NULL,
    actions_assigned TEXT,
    
    -- Approval workflow
    chairperson_approved BOOLEAN NOT NULL DEFAULT false,
    chairperson_approved_by UUID,
    chairperson_approved_at TIMESTAMPTZ,
    signature_data TEXT, -- Digital signature or approval reference
    
    -- Verification status
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    verification_comments TEXT,
    
    -- Audit trail
    uploaded_by UUID NOT NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (meeting_id) REFERENCES wdc_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (chairperson_approved_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ============================================================================
-- WDC APPLICATION DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wdc_application_documents (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Application reference
    application_id UUID NOT NULL,
    
    -- Document information
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url TEXT NOT NULL,
    document_size_bytes INTEGER NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    
    -- Document classification
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'IDENTIFICATION', 'PROOF_OF_RESIDENCE', 'BUDGET_BREAKDOWN', 
        'SUPPORTING_LETTER', 'PROJECT_PROPOSAL', 'OTHER'
    )),
    
    -- Verification status
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    verification_comments TEXT,
    
    -- Audit trail
    uploaded_by UUID NOT NULL,
    
    -- Foreign key constraints
    FOREIGN KEY (application_id) REFERENCES wdc_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- ============================================================================
-- COMMUNITY POLLS TABLE (Optional Feature)
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_polls (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Geographic scope
    ward_id UUID NOT NULL,
    constituency_id UUID NOT NULL,
    district_id UUID NOT NULL,
    province_id UUID NOT NULL,
    
    -- Poll details
    title VARCHAR(200) NOT NULL,
    question TEXT NOT NULL,
    options_json JSONB NOT NULL, -- {"options": ["Option 1", "Option 2", ...]}
    
    -- Poll configuration
    allow_multiple_responses BOOLEAN NOT NULL DEFAULT false,
    require_authentication BOOLEAN NOT NULL DEFAULT true,
    
    -- Poll lifecycle
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN (
        'DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    )),
    
    -- Results tracking
    total_responses INTEGER NOT NULL DEFAULT 0,
    responses_json JSONB DEFAULT '{}', -- {"option1": count, "option2": count, ...}
    
    -- Audit trail
    created_by UUID NOT NULL,
    updated_by UUID,
    
    -- Foreign key constraints
    FOREIGN KEY (ward_id) REFERENCES wards(id),
    FOREIGN KEY (constituency_id) REFERENCES constituencies(id),
    FOREIGN KEY (district_id) REFERENCES districts(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- ============================================================================
-- COMMUNITY POLL RESPONSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS community_poll_responses (
    -- Primary key and metadata
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Poll reference
    poll_id UUID NOT NULL,
    
    -- Response details
    selected_options TEXT[] NOT NULL, -- Array of selected option texts
    respondent_id UUID, -- NULL for anonymous responses
    respondent_ip INET,
    
    -- Response validation
    is_valid BOOLEAN NOT NULL DEFAULT true,
    
    -- Foreign key constraints
    FOREIGN KEY (poll_id) REFERENCES community_polls(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id),
    
    -- Ensure one response per user per poll (if authenticated)
    UNIQUE(poll_id, respondent_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- WDC Applications indexes
CREATE INDEX idx_wdc_applications_ward ON wdc_applications(ward_id) WHERE is_active = true;
CREATE INDEX idx_wdc_applications_status ON wdc_applications(status) WHERE is_active = true;
CREATE INDEX idx_wdc_applications_applicant_nrc ON wdc_applications(applicant_nrc) WHERE is_active = true;
CREATE INDEX idx_wdc_applications_submitted ON wdc_applications(submitted_at) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_wdc_applications_type ON wdc_applications(application_type) WHERE is_active = true;

-- WDC Meetings indexes
CREATE INDEX idx_wdc_meetings_ward ON wdc_meetings(ward_id) WHERE is_active = true;
CREATE INDEX idx_wdc_meetings_date ON wdc_meetings(meeting_date) WHERE is_active = true;
CREATE INDEX idx_wdc_meetings_status ON wdc_meetings(status) WHERE is_active = true;
CREATE INDEX idx_wdc_meetings_type ON wdc_meetings(meeting_type) WHERE is_active = true;

-- WDC Minutes indexes
CREATE INDEX idx_wdc_minutes_meeting ON wdc_minutes(meeting_id) WHERE is_active = true;
CREATE INDEX idx_wdc_minutes_approved ON wdc_minutes(chairperson_approved) WHERE is_active = true;

-- Application Documents indexes
CREATE INDEX idx_wdc_app_docs_application ON wdc_application_documents(application_id) WHERE is_active = true;
CREATE INDEX idx_wdc_app_docs_category ON wdc_application_documents(category) WHERE is_active = true;

-- Community Polls indexes
CREATE INDEX idx_community_polls_ward ON community_polls(ward_id) WHERE is_active = true;
CREATE INDEX idx_community_polls_status ON community_polls(status) WHERE is_active = true;
CREATE INDEX idx_community_polls_expires ON community_polls(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER trg_wdc_applications_updated_at
    BEFORE UPDATE ON wdc_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wdc_meetings_updated_at
    BEFORE UPDATE ON wdc_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wdc_minutes_updated_at
    BEFORE UPDATE ON wdc_minutes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wdc_application_documents_updated_at
    BEFORE UPDATE ON wdc_application_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_community_polls_updated_at
    BEFORE UPDATE ON community_polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate application numbers
CREATE OR REPLACE FUNCTION generate_wdc_application_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
        SELECT INTO NEW.application_number 
            'WDC-' || 
            TO_CHAR(NOW(), 'YYYY') || '-' ||
            LPAD(NEXTVAL('wdc_application_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for application numbers
CREATE SEQUENCE IF NOT EXISTS wdc_application_number_seq START 1;

CREATE TRIGGER trg_wdc_applications_number
    BEFORE INSERT ON wdc_applications
    FOR EACH ROW EXECUTE FUNCTION generate_wdc_application_number();

-- Auto-generate meeting numbers
CREATE OR REPLACE FUNCTION generate_wdc_meeting_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.meeting_number IS NULL OR NEW.meeting_number = '' THEN
        SELECT INTO NEW.meeting_number 
            'WDC-MTG-' || 
            TO_CHAR(NOW(), 'YYYY') || '-' ||
            LPAD(NEXTVAL('wdc_meeting_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for meeting numbers
CREATE SEQUENCE IF NOT EXISTS wdc_meeting_number_seq START 1;

CREATE TRIGGER trg_wdc_meetings_number
    BEFORE INSERT ON wdc_meetings
    FOR EACH ROW EXECUTE FUNCTION generate_wdc_meeting_number();

-- Auto-calculate quorum
CREATE OR REPLACE FUNCTION calculate_wdc_quorum() RETURNS TRIGGER AS $$
BEGIN
    -- Set quorum to 50% of expected attendees (minimum 2)
    NEW.quorum_required := GREATEST(2, CEIL(NEW.expected_attendees * 0.5));
    
    -- Update quorum_met status
    IF NEW.actual_attendees >= NEW.quorum_required THEN
        NEW.quorum_met := true;
    ELSE
        NEW.quorum_met := false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wdc_meetings_quorum
    BEFORE INSERT OR UPDATE ON wdc_meetings
    FOR EACH ROW EXECUTE FUNCTION calculate_wdc_quorum();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE wdc_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wdc_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wdc_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wdc_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_poll_responses ENABLE ROW LEVEL SECURITY;

-- WDC Applications policies
CREATE POLICY wdc_applications_read_policy ON wdc_applications FOR SELECT
    USING (
        (is_active = true) AND (
            has_national_access() OR
            has_provincial_access(province_id) OR
            has_district_access(district_id) OR
            has_constituency_access(constituency_id) OR
            has_ward_access(ward_id) OR
            created_by = current_user_id()
        )
    );

CREATE POLICY wdc_applications_write_policy ON wdc_applications
    USING (
        has_national_access() OR
        has_ward_access(ward_id) OR
        created_by = current_user_id()
    );

-- WDC Meetings policies
CREATE POLICY wdc_meetings_read_policy ON wdc_meetings FOR SELECT
    USING (
        (is_active = true) AND (
            has_national_access() OR
            has_provincial_access(province_id) OR
            has_district_access(district_id) OR
            has_constituency_access(constituency_id) OR
            has_ward_access(ward_id)
        )
    );

CREATE POLICY wdc_meetings_write_policy ON wdc_meetings
    USING (
        has_national_access() OR
        has_ward_access(ward_id)
    );

-- WDC Minutes policies (same as meetings)
CREATE POLICY wdc_minutes_read_policy ON wdc_minutes FOR SELECT
    USING (
        (is_active = true) AND (
            EXISTS (
                SELECT 1 FROM wdc_meetings m 
                WHERE m.id = meeting_id AND (
                    has_national_access() OR
                    has_provincial_access(m.province_id) OR
                    has_district_access(m.district_id) OR
                    has_constituency_access(m.constituency_id) OR
                    has_ward_access(m.ward_id)
                )
            )
        )
    );

CREATE POLICY wdc_minutes_write_policy ON wdc_minutes
    USING (
        EXISTS (
            SELECT 1 FROM wdc_meetings m 
            WHERE m.id = meeting_id AND (
                has_national_access() OR
                has_ward_access(m.ward_id)
            )
        )
    );

-- Application Documents policies
CREATE POLICY wdc_app_docs_read_policy ON wdc_application_documents FOR SELECT
    USING (
        (is_active = true) AND (
            EXISTS (
                SELECT 1 FROM wdc_applications a 
                WHERE a.id = application_id AND (
                    has_national_access() OR
                    has_provincial_access(a.province_id) OR
                    has_district_access(a.district_id) OR
                    has_constituency_access(a.constituency_id) OR
                    has_ward_access(a.ward_id) OR
                    a.created_by = current_user_id()
                )
            )
        )
    );

CREATE POLICY wdc_app_docs_write_policy ON wdc_application_documents
    USING (
        EXISTS (
            SELECT 1 FROM wdc_applications a 
            WHERE a.id = application_id AND (
                has_national_access() OR
                has_ward_access(a.ward_id) OR
                a.created_by = current_user_id()
            )
        )
    );

-- Community Polls policies
CREATE POLICY community_polls_read_policy ON community_polls FOR SELECT
    USING (
        (is_active = true) AND (
            has_national_access() OR
            has_provincial_access(province_id) OR
            has_district_access(district_id) OR
            has_constituency_access(constituency_id) OR
            has_ward_access(ward_id)
        )
    );

CREATE POLICY community_polls_write_policy ON community_polls
    USING (
        has_national_access() OR
        has_ward_access(ward_id)
    );

-- Poll Responses policies
CREATE POLICY poll_responses_read_policy ON community_poll_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM community_polls p 
            WHERE p.id = poll_id AND (
                has_national_access() OR
                has_provincial_access(p.province_id) OR
                has_district_access(p.district_id) OR
                has_constituency_access(p.constituency_id) OR
                has_ward_access(p.ward_id)
            )
        ) OR
        respondent_id = current_user_id()
    );

CREATE POLICY poll_responses_insert_policy ON community_poll_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM community_polls p 
            WHERE p.id = poll_id 
            AND p.status = 'ACTIVE'
            AND p.expires_at > NOW()
            AND (
                has_ward_access(p.ward_id) OR
                respondent_id = current_user_id() OR
                respondent_id IS NULL
            )
        )
    );

\echo '✓ WDC Module tables created successfully';
\echo '✓ Indexes, triggers, and RLS policies applied';
\echo '✓ Ready for WDC application and meeting management';
\echo '';