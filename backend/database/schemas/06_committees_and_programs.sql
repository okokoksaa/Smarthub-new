-- ============================================================================
-- CDF SMART HUB - COMMITTEES, BURSARIES & EMPOWERMENT PROGRAMS SCHEMA
-- ============================================================================
-- Purpose: Committee structures (CDFC, TAC, WDC), member management,
--          bursary applications and awards, empowerment programs
-- Compliance: Conflict of interest tracking, beneficiary verification,
--          committee composition validation
-- ============================================================================

-- ============================================================================
-- COMMITTEES (Generic)
-- ============================================================================
CREATE TABLE committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Committee Details
    committee_code VARCHAR(100) NOT NULL UNIQUE,
    committee_type VARCHAR(50) NOT NULL,    -- 'CDFC', 'TAC', 'WDC', 'PANEL_A', 'PANEL_B'
    committee_name VARCHAR(200) NOT NULL,

    -- Scope
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),
    province_id UUID REFERENCES provinces(id),

    -- Composition
    required_members INTEGER,               -- Minimum members
    current_member_count INTEGER DEFAULT 0,
    quorum_requirement INTEGER,             -- Minimum for valid meeting

    -- Chairperson
    chairperson_user_id UUID REFERENCES users(id),
    chairperson_appointed_date DATE,

    -- Secretary (if applicable)
    secretary_user_id UUID REFERENCES users(id),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    established_date DATE,
    dissolved_date DATE,
    dissolution_reason TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_committee_scope CHECK (
        (constituency_id IS NOT NULL AND ward_id IS NULL AND province_id IS NULL) OR
        (ward_id IS NOT NULL AND constituency_id IS NULL AND province_id IS NULL) OR
        (province_id IS NOT NULL AND constituency_id IS NULL AND ward_id IS NULL)
    )
);

CREATE INDEX idx_committees_type ON committees(committee_type);
CREATE INDEX idx_committees_constituency ON committees(constituency_id);
CREATE INDEX idx_committees_ward ON committees(ward_id);
CREATE INDEX idx_committees_province ON committees(province_id);
CREATE INDEX idx_committees_active ON committees(is_active) WHERE is_active = true;

COMMENT ON TABLE committees IS 'Committee structures (CDFC, TAC, WDC, Panels)';
COMMENT ON CONSTRAINT chk_committee_scope ON committees IS 'Committee must belong to exactly one scope level';

-- ============================================================================
-- COMMITTEE MEMBERS
-- ============================================================================
CREATE TABLE committee_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Committee and User
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Membership Details
    member_role VARCHAR(100),               -- 'CHAIRPERSON', 'MEMBER', 'SECRETARY', 'OBSERVER'
    appointment_date DATE NOT NULL,
    appointment_reference VARCHAR(100),     -- Official appointment letter reference
    term_start_date DATE,
    term_end_date DATE,

    -- Representing
    representing VARCHAR(200),              -- Organization or constituency represented

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    resigned_date DATE,
    resignation_reason TEXT,
    removed_date DATE,
    removal_reason TEXT,

    -- Conflict of Interest Registry
    declared_interests JSONB,               -- Array of declared interests

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(committee_id, user_id)
);

CREATE INDEX idx_committee_members_committee ON committee_members(committee_id);
CREATE INDEX idx_committee_members_user ON committee_members(user_id);
CREATE INDEX idx_committee_members_active ON committee_members(is_active, committee_id)
    WHERE is_active = true;

COMMENT ON TABLE committee_members IS 'Committee membership with conflict of interest tracking';
COMMENT ON COLUMN committee_members.declared_interests IS 'JSON array of declared conflicts of interest';

-- ============================================================================
-- CONFLICT OF INTEREST DECLARATIONS
-- ============================================================================
CREATE TABLE conflict_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Declarant
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    committee_member_id UUID REFERENCES committee_members(id),

    -- Conflict Details
    conflict_type VARCHAR(50) NOT NULL,     -- 'FINANCIAL', 'FAMILY', 'BUSINESS', 'POLITICAL', 'OTHER'
    conflict_description TEXT NOT NULL,
    affected_entities JSONB,                -- Projects, contractors, beneficiaries affected

    -- Related to Specific Item
    project_id UUID REFERENCES projects(id),
    payment_voucher_id UUID REFERENCES payment_vouchers(id),
    meeting_id UUID REFERENCES meetings(id),

    -- Declaration
    declared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    declaration_period_start DATE,
    declaration_period_end DATE,

    -- Action Taken
    recusal_required BOOLEAN NOT NULL DEFAULT true,
    recused_from TEXT,                      -- Description of what recused from
    override_justification TEXT,            -- If participated despite conflict (rare, logged)

    -- Verification
    verified_by_user_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_conflict_declarations_user ON conflict_declarations(user_id);
CREATE INDEX idx_conflict_declarations_project ON conflict_declarations(project_id);
CREATE INDEX idx_conflict_declarations_payment ON conflict_declarations(payment_voucher_id);
CREATE INDEX idx_conflict_declarations_meeting ON conflict_declarations(meeting_id);

COMMENT ON TABLE conflict_declarations IS 'Conflict of interest declarations by committee members';

-- ============================================================================
-- BURSARY APPLICATIONS
-- ============================================================================
CREATE TABLE bursary_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Application Details
    application_number VARCHAR(100) NOT NULL UNIQUE,
    application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Multi-Tenant Scoping
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    ward_id UUID REFERENCES wards(id),

    -- Applicant (Student)
    student_first_name VARCHAR(100) NOT NULL,
    student_last_name VARCHAR(100) NOT NULL,
    student_national_id VARCHAR(20),
    student_date_of_birth DATE NOT NULL,
    student_gender gender NOT NULL,
    student_phone_number VARCHAR(20),

    -- Guardian/Parent
    guardian_first_name VARCHAR(100) NOT NULL,
    guardian_last_name VARCHAR(100) NOT NULL,
    guardian_relationship VARCHAR(50) NOT NULL,
    guardian_phone_number VARCHAR(20) NOT NULL,
    guardian_national_id VARCHAR(20),

    -- Educational Details
    institution_name VARCHAR(200) NOT NULL,
    institution_type VARCHAR(50) NOT NULL,  -- 'PRIMARY', 'SECONDARY', 'TERTIARY', 'VOCATIONAL'
    program_of_study VARCHAR(200),
    academic_year VARCHAR(20) NOT NULL,     -- e.g., '2024'
    grade_level VARCHAR(50),                -- e.g., 'Grade 10', 'Year 2'

    -- Financial Need
    requested_amount NUMERIC(10, 2) NOT NULL CHECK (requested_amount > 0),
    household_income NUMERIC(10, 2),
    number_of_dependents INTEGER,
    vulnerability_factors JSONB,            -- Orphan, PWD, single parent, etc.

    -- Status & Workflow
    status bursary_status NOT NULL DEFAULT 'APPLICATION_RECEIVED',

    -- Review
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    shortlisted BOOLEAN NOT NULL DEFAULT false,

    -- CDFC Decision
    cdfc_approved BOOLEAN,
    cdfc_approved_at TIMESTAMP WITH TIME ZONE,
    cdfc_approved_amount NUMERIC(10, 2),
    cdfc_approval_conditions TEXT,

    -- Award
    award_reference VARCHAR(100),
    awarded_amount NUMERIC(10, 2),
    award_fiscal_year INTEGER,

    -- Payment
    payment_voucher_id UUID REFERENCES payment_vouchers(id),
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Supporting Documents
    application_form_document_id UUID,
    school_acceptance_letter_id UUID,
    parent_id_copy_id UUID,
    student_id_copy_id UUID,
    proof_of_need_document_ids UUID[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    submitted_by_user_id UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_bursary_applications_constituency ON bursary_applications(constituency_id);
CREATE INDEX idx_bursary_applications_ward ON bursary_applications(ward_id);
CREATE INDEX idx_bursary_applications_status ON bursary_applications(status);
CREATE INDEX idx_bursary_applications_student ON bursary_applications(student_national_id);
CREATE INDEX idx_bursary_applications_fiscal_year ON bursary_applications(award_fiscal_year);

COMMENT ON TABLE bursary_applications IS 'Educational bursary applications and awards';
COMMENT ON COLUMN bursary_applications.vulnerability_factors IS 'JSON array of vulnerability indicators';

-- ============================================================================
-- EMPOWERMENT PROGRAMS
-- ============================================================================
CREATE TABLE empowerment_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Program Details
    program_code VARCHAR(100) NOT NULL UNIQUE,
    program_name VARCHAR(200) NOT NULL,
    program_type empowerment_program_type NOT NULL,
    program_description TEXT,

    -- Scope
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    fiscal_year INTEGER NOT NULL,

    -- Budget
    total_budget NUMERIC(15, 2) NOT NULL CHECK (total_budget > 0),
    allocated_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    disbursed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(15, 2) GENERATED ALWAYS AS (
        total_budget - allocated_amount
    ) STORED,

    -- Beneficiary Targets
    target_beneficiaries INTEGER,
    actual_beneficiaries INTEGER DEFAULT 0,

    -- Timeline
    application_start_date DATE NOT NULL,
    application_end_date DATE NOT NULL,
    program_start_date DATE,
    program_end_date DATE,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNING',
    approved_by_cdfc BOOLEAN NOT NULL DEFAULT false,
    cdfc_approval_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT chk_empowerment_dates CHECK (application_end_date >= application_start_date)
);

CREATE INDEX idx_empowerment_programs_constituency ON empowerment_programs(constituency_id);
CREATE INDEX idx_empowerment_programs_type ON empowerment_programs(program_type);
CREATE INDEX idx_empowerment_programs_fiscal_year ON empowerment_programs(fiscal_year);
CREATE INDEX idx_empowerment_programs_status ON empowerment_programs(status);

COMMENT ON TABLE empowerment_programs IS 'Women, youth, PWD empowerment programs';

-- ============================================================================
-- EMPOWERMENT BENEFICIARIES
-- ============================================================================
CREATE TABLE empowerment_beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Program and Application
    program_id UUID NOT NULL REFERENCES empowerment_programs(id) ON DELETE RESTRICT,
    application_number VARCHAR(100) NOT NULL UNIQUE,

    -- Beneficiary Details
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    national_id_number VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    phone_number VARCHAR(20) NOT NULL,

    -- Demographics
    is_youth BOOLEAN NOT NULL DEFAULT false,         -- Age 18-35
    is_woman BOOLEAN NOT NULL DEFAULT false,
    is_pwd BOOLEAN NOT NULL DEFAULT false,           -- Person with Disability
    is_elderly BOOLEAN NOT NULL DEFAULT false,       -- Age 60+
    disability_type VARCHAR(100),

    -- Location
    constituency_id UUID NOT NULL REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),
    village VARCHAR(100),
    residential_address TEXT,

    -- Grant/Support Details
    requested_support_type VARCHAR(100),    -- 'CASH_GRANT', 'EQUIPMENT', 'TRAINING', 'MATERIALS'
    requested_amount NUMERIC(10, 2),
    business_proposal_summary TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    shortlisted BOOLEAN NOT NULL DEFAULT false,
    approved BOOLEAN NOT NULL DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_amount NUMERIC(10, 2),

    -- Disbursement
    payment_voucher_id UUID REFERENCES payment_vouchers(id),
    disbursed BOOLEAN NOT NULL DEFAULT false,
    disbursed_at TIMESTAMP WITH TIME ZONE,

    -- Supporting Documents
    application_document_id UUID,
    national_id_copy_id UUID,
    business_plan_document_id UUID,
    supporting_documents_ids UUID[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_empowerment_beneficiaries_program ON empowerment_beneficiaries(program_id);
CREATE INDEX idx_empowerment_beneficiaries_constituency ON empowerment_beneficiaries(constituency_id);
CREATE INDEX idx_empowerment_beneficiaries_nrc ON empowerment_beneficiaries(national_id_number);
CREATE INDEX idx_empowerment_beneficiaries_status ON empowerment_beneficiaries(status);

COMMENT ON TABLE empowerment_beneficiaries IS 'Beneficiaries of empowerment programs';

-- ============================================================================
-- CONTRACTORS/SUPPLIERS REGISTRY
-- ============================================================================
CREATE TABLE contractors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contractor Details
    contractor_code VARCHAR(100) NOT NULL UNIQUE,
    contractor_type VARCHAR(50) NOT NULL,  -- 'INDIVIDUAL', 'COMPANY', 'COMMUNITY_GROUP'
    contractor_name VARCHAR(200) NOT NULL,
    trading_name VARCHAR(200),

    -- Registration
    registration_number VARCHAR(100),       -- Business registration number
    tax_identification_number VARCHAR(50),  -- TPIN
    zppa_registration_number VARCHAR(100),  -- ZPPA registration
    zppa_category VARCHAR(50),              -- Grade/category
    zppa_valid_until DATE,

    -- Contact
    primary_contact_name VARCHAR(200),
    primary_contact_phone VARCHAR(20) NOT NULL,
    primary_contact_email VARCHAR(255),
    physical_address TEXT,
    postal_address TEXT,

    -- Banking
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_account_name VARCHAR(200) NOT NULL,
    bank_branch VARCHAR(100),
    mobile_money_number VARCHAR(20),

    -- Specialization
    specialization VARCHAR(200)[],          -- Array of specializations
    max_project_value NUMERIC(15, 2),       -- Maximum project capacity

    -- Performance
    projects_completed INTEGER DEFAULT 0,
    total_value_completed NUMERIC(15, 2) DEFAULT 0,
    average_quality_rating NUMERIC(3, 2),   -- 0.00 to 5.00
    blacklisted BOOLEAN NOT NULL DEFAULT false,
    blacklist_reason TEXT,
    blacklist_date DATE,

    -- Verification
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by_user_id UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_contractors_code ON contractors(contractor_code);
CREATE INDEX idx_contractors_name ON contractors(contractor_name);
CREATE INDEX idx_contractors_zppa ON contractors(zppa_registration_number);
CREATE INDEX idx_contractors_verified ON contractors(verified) WHERE verified = true;
CREATE INDEX idx_contractors_blacklisted ON contractors(blacklisted) WHERE blacklisted = true;

COMMENT ON TABLE contractors IS 'Registered contractors and suppliers';

-- ============================================================================
-- CONTRACTOR PERFORMANCE EVALUATIONS
-- ============================================================================
CREATE TABLE contractor_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contractor and Project
    contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Evaluation Details
    evaluation_date DATE NOT NULL,
    evaluated_by_user_id UUID NOT NULL REFERENCES users(id),
    evaluation_type VARCHAR(50) NOT NULL,   -- 'INTERIM', 'FINAL', 'SPOT_CHECK'

    -- Ratings (1-5 scale)
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    timeliness_rating INTEGER CHECK (timeliness_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating BETWEEN 1 AND 5),
    overall_rating NUMERIC(3, 2) GENERATED ALWAYS AS (
        (quality_rating + timeliness_rating + professionalism_rating + value_for_money_rating) / 4.0
    ) STORED,

    -- Narrative
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,

    -- Issues
    issues_identified JSONB,                -- Array of issues
    corrective_actions_required TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id, evaluation_type)
);

CREATE INDEX idx_contractor_evaluations_contractor ON contractor_evaluations(contractor_id);
CREATE INDEX idx_contractor_evaluations_project ON contractor_evaluations(project_id);
CREATE INDEX idx_contractor_evaluations_rating ON contractor_evaluations(overall_rating DESC);

COMMENT ON TABLE contractor_evaluations IS 'Contractor performance evaluations per project';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_committees_updated_at
    BEFORE UPDATE ON committees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_committee_members_updated_at
    BEFORE UPDATE ON committee_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bursary_applications_updated_at
    BEFORE UPDATE ON bursary_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_empowerment_programs_updated_at
    BEFORE UPDATE ON empowerment_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_empowerment_beneficiaries_updated_at
    BEFORE UPDATE ON empowerment_beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_contractors_updated_at
    BEFORE UPDATE ON contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update committee member count automatically
CREATE OR REPLACE FUNCTION update_committee_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active THEN
        UPDATE committees
        SET current_member_count = current_member_count + 1
        WHERE id = NEW.committee_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active AND NOT NEW.is_active THEN
        UPDATE committees
        SET current_member_count = current_member_count - 1
        WHERE id = NEW.committee_id;
    ELSIF TG_OP = 'UPDATE' AND NOT OLD.is_active AND NEW.is_active THEN
        UPDATE committees
        SET current_member_count = current_member_count + 1
        WHERE id = NEW.committee_id;
    ELSIF TG_OP = 'DELETE' AND OLD.is_active THEN
        UPDATE committees
        SET current_member_count = current_member_count - 1
        WHERE id = OLD.committee_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_committee_member_count
    AFTER INSERT OR UPDATE OR DELETE ON committee_members
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_member_count();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bursary_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE empowerment_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

-- Committees: Constituency scope
CREATE POLICY committees_policy ON committees
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR ward_id IN (
            SELECT w.id FROM wards w
            WHERE w.constituency_id = ANY(current_user_constituencies())
        )
        OR has_national_access()
    );

-- Bursary Applications: Constituency scope
CREATE POLICY bursary_applications_policy ON bursary_applications
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Empowerment Programs: Constituency scope
CREATE POLICY empowerment_programs_policy ON empowerment_programs
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Contractors: Verified contractors visible to all; management restricted
CREATE POLICY contractors_read_policy ON contractors
    FOR SELECT
    USING (
        verified = true
        OR has_national_access()
        OR current_user_role() IN ('PROCUREMENT_OFFICER', 'TAC_MEMBER', 'CDFC_CHAIR')
    );

CREATE POLICY contractors_write_policy ON contractors
    FOR INSERT OR UPDATE OR DELETE
    USING (
        has_national_access()
        OR current_user_role() IN ('PROCUREMENT_OFFICER', 'SYSTEM_ADMIN')
    );
