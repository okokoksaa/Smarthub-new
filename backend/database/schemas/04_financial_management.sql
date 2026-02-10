-- ============================================================================
-- CDF SMART HUB - FINANCIAL MANAGEMENT SCHEMA
-- ============================================================================
-- Purpose: Budget management, payment processing, dual-approval panels,
--          bank reconciliation, financial reporting
-- Compliance: Zero tolerance for overspending, duplicate payments, or
--             unauthorized disbursements
-- Controls: Real-time budget validation, dual-approval workflow,
--           bank reconciliation, audit trail
-- ============================================================================

-- ============================================================================
-- BUDGET ALLOCATIONS
-- ============================================================================
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Allocation Details
    fiscal_year INTEGER NOT NULL,           -- e.g., 2024
    allocation_reference VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'MLGRD-2024-CDF-001'

    -- Multi-Tenant Scoping
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,

    -- Financial Amounts
    total_allocation NUMERIC(15, 2) NOT NULL CHECK (total_allocation > 0),

    -- Sector Allocations (Percentage or Amount)
    education_allocation NUMERIC(15, 2) DEFAULT 0,
    health_allocation NUMERIC(15, 2) DEFAULT 0,
    water_sanitation_allocation NUMERIC(15, 2) DEFAULT 0,
    infrastructure_allocation NUMERIC(15, 2) DEFAULT 0,
    agriculture_allocation NUMERIC(15, 2) DEFAULT 0,
    social_welfare_allocation NUMERIC(15, 2) DEFAULT 0,
    empowerment_allocation NUMERIC(15, 2) DEFAULT 0,
    bursary_allocation NUMERIC(15, 2) DEFAULT 0,
    other_allocation NUMERIC(15, 2) DEFAULT 0,

    -- Calculated Fields
    total_sector_allocations NUMERIC(15, 2) GENERATED ALWAYS AS (
        education_allocation + health_allocation + water_sanitation_allocation +
        infrastructure_allocation + agriculture_allocation + social_welfare_allocation +
        empowerment_allocation + bursary_allocation + other_allocation
    ) STORED,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    approved_by_ministry BOOLEAN NOT NULL DEFAULT false,
    approved_by_treasury BOOLEAN NOT NULL DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id UUID REFERENCES users(id),

    -- Banking Details
    treasury_transfer_reference VARCHAR(100),
    treasury_transfer_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_sector_total CHECK (
        total_sector_allocations <= total_allocation
    ),
    UNIQUE(constituency_id, fiscal_year)
);

CREATE INDEX idx_budget_allocations_constituency ON budget_allocations(constituency_id);
CREATE INDEX idx_budget_allocations_fiscal_year ON budget_allocations(fiscal_year);
CREATE INDEX idx_budget_allocations_status ON budget_allocations(status);

COMMENT ON TABLE budget_allocations IS 'Annual CDF budget allocations to constituencies';
COMMENT ON COLUMN budget_allocations.total_allocation IS 'Total CDF allocation for fiscal year';
COMMENT ON COLUMN budget_allocations.total_sector_allocations IS 'Sum of sector allocations (must equal total)';

-- ============================================================================
-- BUDGET COMMITMENTS (Project Approvals)
-- ============================================================================
CREATE TABLE budget_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Links to Budget and Project
    budget_allocation_id UUID NOT NULL REFERENCES budget_allocations(id) ON DELETE RESTRICT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,

    -- Commitment Details
    commitment_reference VARCHAR(100) NOT NULL UNIQUE,
    commitment_amount NUMERIC(15, 2) NOT NULL CHECK (commitment_amount > 0),
    commitment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Sector Allocation
    sector project_category NOT NULL,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    released_at TIMESTAMP WITH TIME ZONE,     -- When commitment released (project cancelled)

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(project_id)  -- One commitment per project
);

CREATE INDEX idx_commitments_budget ON budget_commitments(budget_allocation_id);
CREATE INDEX idx_commitments_project ON budget_commitments(project_id);
CREATE INDEX idx_commitments_active ON budget_commitments(is_active) WHERE is_active = true;

COMMENT ON TABLE budget_commitments IS 'Budget commitments created when projects approved';
COMMENT ON COLUMN budget_commitments.is_active IS 'False when project cancelled (frees budget)';

-- ============================================================================
-- PAYMENT VOUCHERS
-- ============================================================================
CREATE TABLE payment_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Voucher Identification
    voucher_number VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'PV-KABW-2024-00123'

    -- Links
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    commitment_id UUID NOT NULL REFERENCES budget_commitments(id) ON DELETE RESTRICT,
    contractor_id UUID,                      -- Beneficiary (contractor, supplier, individual)
    milestone_id UUID REFERENCES project_milestones(id),

    -- Multi-Tenant Scoping
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,

    -- Payment Details
    payment_type VARCHAR(50) NOT NULL,       -- 'ADVANCE', 'PROGRESS', 'FINAL', 'RETENTION_RELEASE'
    payment_description TEXT NOT NULL,
    payment_amount NUMERIC(15, 2) NOT NULL CHECK (payment_amount > 0),

    -- Beneficiary Details (denormalized for audit)
    beneficiary_name VARCHAR(200) NOT NULL,
    beneficiary_type VARCHAR(50) NOT NULL,   -- 'CONTRACTOR', 'SUPPLIER', 'INDIVIDUAL', 'COMMUNITY_GROUP'
    beneficiary_bank_name VARCHAR(100),
    beneficiary_bank_account VARCHAR(50),
    beneficiary_bank_branch VARCHAR(100),
    beneficiary_mobile_money VARCHAR(20),    -- For mobile money disbursements

    -- Status & Workflow
    status payment_status NOT NULL DEFAULT 'PENDING_PANEL_A',

    -- Panel A Approval (CDFC - Planning)
    panel_a_review_started_at TIMESTAMP WITH TIME ZONE,
    panel_a_approved_at TIMESTAMP WITH TIME ZONE,
    panel_a_approved_by_user_id UUID REFERENCES users(id),
    panel_a_approval_notes TEXT,
    panel_a_votes JSONB,                     -- {approve: 6, reject: 1, abstain: 0}

    -- Panel B Approval (Local Authority - Execution)
    panel_b_review_started_at TIMESTAMP WITH TIME ZONE,
    panel_b_approved_at TIMESTAMP WITH TIME ZONE,
    panel_b_approved_by_user_id UUID REFERENCES users(id),
    panel_b_signatories JSONB,               -- Array of signatory user IDs and signatures
    panel_b_approval_notes TEXT,

    -- Payment Execution
    payment_execution_date TIMESTAMP WITH TIME ZONE,
    payment_execution_method VARCHAR(50),    -- 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE'
    payment_transaction_reference VARCHAR(100), -- Bank transaction ID
    payment_executed_by_user_id UUID REFERENCES users(id),

    -- Bank Reconciliation
    reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciled_at TIMESTAMP WITH TIME ZONE,
    reconciled_by_user_id UUID REFERENCES users(id),
    bank_statement_reference VARCHAR(100),

    -- Supporting Documents (references)
    invoice_document_id UUID,
    delivery_note_document_id UUID,
    inspection_report_document_id UUID,
    progress_photos_document_ids UUID[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,     -- Soft delete
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_panel_sequence CHECK (
        panel_a_approved_at IS NULL OR
        panel_b_approved_at IS NULL OR
        panel_b_approved_at >= panel_a_approved_at
    ),
    CONSTRAINT chk_execution_after_approval CHECK (
        payment_execution_date IS NULL OR
        (panel_a_approved_at IS NOT NULL AND panel_b_approved_at IS NOT NULL)
    )
);

CREATE INDEX idx_payment_vouchers_project ON payment_vouchers(project_id);
CREATE INDEX idx_payment_vouchers_constituency ON payment_vouchers(constituency_id);
CREATE INDEX idx_payment_vouchers_status ON payment_vouchers(status);
CREATE INDEX idx_payment_vouchers_beneficiary ON payment_vouchers(beneficiary_name, beneficiary_bank_account);
CREATE INDEX idx_payment_vouchers_execution_date ON payment_vouchers(payment_execution_date);
CREATE INDEX idx_payment_vouchers_unreconciled ON payment_vouchers(reconciled, payment_execution_date)
    WHERE reconciled = false AND payment_execution_date IS NOT NULL;

COMMENT ON TABLE payment_vouchers IS 'Payment vouchers with dual-approval workflow (Panel A + Panel B)';
COMMENT ON COLUMN payment_vouchers.panel_a_votes IS 'JSON object with vote counts from CDFC';
COMMENT ON COLUMN payment_vouchers.panel_b_signatories IS 'JSON array of authorized signatories with digital signatures';

-- ============================================================================
-- PAYMENT TRANSACTIONS (Bank Integration)
-- ============================================================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Links
    payment_voucher_id UUID NOT NULL REFERENCES payment_vouchers(id) ON DELETE RESTRICT,

    -- Transaction Details
    transaction_type transaction_type NOT NULL DEFAULT 'DISBURSEMENT',
    transaction_reference VARCHAR(100) NOT NULL, -- Bank/mobile money reference
    transaction_amount NUMERIC(15, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_status VARCHAR(50) NOT NULL,  -- 'SUCCESS', 'FAILED', 'PENDING', 'REVERSED'

    -- Bank/Payment Provider Details
    payment_method VARCHAR(50) NOT NULL,      -- 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE'
    bank_name VARCHAR(100),
    bank_account_debited VARCHAR(50),         -- CDF constituency account
    bank_account_credited VARCHAR(50),        -- Beneficiary account
    mobile_money_provider VARCHAR(50),        -- 'AIRTEL', 'MTN', 'ZAMTEL'
    mobile_money_number VARCHAR(20),

    -- Response from Bank/Provider
    provider_response JSONB,                  -- Full API response for audit
    provider_status_code VARCHAR(20),
    provider_error_message TEXT,

    -- Reconciliation
    reconciled BOOLEAN NOT NULL DEFAULT false,
    bank_statement_date DATE,
    bank_statement_amount NUMERIC(15, 2),
    variance_amount NUMERIC(15, 2) GENERATED ALWAYS AS (
        CASE
            WHEN bank_statement_amount IS NOT NULL
            THEN bank_statement_amount - transaction_amount
            ELSE 0
        END
    ) STORED,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_payment_transactions_voucher ON payment_transactions(payment_voucher_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(transaction_reference);
CREATE INDEX idx_payment_transactions_date ON payment_transactions(transaction_date);
CREATE INDEX idx_payment_transactions_reconciliation ON payment_transactions(reconciled, transaction_date)
    WHERE reconciled = false;

COMMENT ON TABLE payment_transactions IS 'Actual bank/mobile money transactions linked to payment vouchers';
COMMENT ON COLUMN payment_transactions.provider_response IS 'Full API response from bank/mobile money provider';

-- ============================================================================
-- BANK RECONCILIATION
-- ============================================================================
CREATE TABLE bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Statement Details
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    statement_reference VARCHAR(100) NOT NULL,
    statement_date DATE NOT NULL,
    statement_period_start DATE NOT NULL,
    statement_period_end DATE NOT NULL,

    -- Bank Details
    bank_name VARCHAR(100) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_branch VARCHAR(100),

    -- Balances
    opening_balance NUMERIC(15, 2) NOT NULL,
    closing_balance NUMERIC(15, 2) NOT NULL,
    total_credits NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_debits NUMERIC(15, 2) NOT NULL DEFAULT 0,

    -- Reconciliation Status
    reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    reconciliation_started_at TIMESTAMP WITH TIME ZONE,
    reconciliation_completed_at TIMESTAMP WITH TIME ZONE,
    reconciled_by_user_id UUID REFERENCES users(id),

    -- Document
    statement_document_id UUID,              -- Uploaded bank statement PDF

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    uploaded_by_user_id UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(constituency_id, statement_reference),
    CONSTRAINT chk_statement_period CHECK (statement_period_end >= statement_period_start)
);

CREATE INDEX idx_bank_statements_constituency ON bank_statements(constituency_id);
CREATE INDEX idx_bank_statements_date ON bank_statements(statement_date);
CREATE INDEX idx_bank_statements_status ON bank_statements(reconciliation_status);

COMMENT ON TABLE bank_statements IS 'Bank statements imported for reconciliation';

-- ============================================================================
-- BANK STATEMENT TRANSACTIONS
-- ============================================================================
CREATE TABLE bank_statement_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Links
    bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,

    -- Transaction Details
    transaction_date DATE NOT NULL,
    transaction_reference VARCHAR(100),
    transaction_description TEXT,
    transaction_type VARCHAR(20) NOT NULL,   -- 'CREDIT', 'DEBIT'
    transaction_amount NUMERIC(15, 2) NOT NULL,

    -- Reconciliation
    matched BOOLEAN NOT NULL DEFAULT false,
    matched_payment_transaction_id UUID REFERENCES payment_transactions(id),
    matched_at TIMESTAMP WITH TIME ZONE,
    matched_by_user_id UUID REFERENCES users(id),
    match_confidence NUMERIC(3, 2),          -- 0.00 to 1.00 (AI-assisted matching)

    -- Manual Reconciliation
    reconciliation_notes TEXT,
    requires_investigation BOOLEAN NOT NULL DEFAULT false,
    investigation_resolved BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_bank_statement_txns_statement ON bank_statement_transactions(bank_statement_id);
CREATE INDEX idx_bank_statement_txns_matched ON bank_statement_transactions(matched, bank_statement_id);
CREATE INDEX idx_bank_statement_txns_investigation ON bank_statement_transactions(requires_investigation)
    WHERE requires_investigation = true AND investigation_resolved = false;

COMMENT ON TABLE bank_statement_transactions IS 'Individual transactions from bank statements';
COMMENT ON COLUMN bank_statement_transactions.match_confidence IS 'AI matching confidence (1.0 = perfect match)';

-- ============================================================================
-- FINANCIAL REPORTS
-- ============================================================================
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Report Details
    report_type VARCHAR(50) NOT NULL,        -- 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC'
    report_title VARCHAR(200) NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,

    -- Scope
    constituency_id UUID REFERENCES constituencies(id), -- NULL for national reports

    -- Report Data (Snapshot)
    report_data JSONB NOT NULL,              -- Complete report data as JSON

    -- Summary Figures
    total_allocation NUMERIC(15, 2),
    total_commitments NUMERIC(15, 2),
    total_expenditure NUMERIC(15, 2),
    budget_balance NUMERIC(15, 2),
    expenditure_rate NUMERIC(5, 2),          -- Percentage (0-100)

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by_user_id UUID REFERENCES users(id),

    -- Generated Document
    report_document_id UUID,                 -- PDF report

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT chk_report_period CHECK (report_period_end >= report_period_start)
);

CREATE INDEX idx_financial_reports_constituency ON financial_reports(constituency_id);
CREATE INDEX idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX idx_financial_reports_fiscal_year ON financial_reports(fiscal_year);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);

COMMENT ON TABLE financial_reports IS 'Constituency and national financial reports';
COMMENT ON COLUMN financial_reports.report_data IS 'Complete report data snapshot as JSON';

-- ============================================================================
-- EXPENDITURE RETURNS (Quarterly Compliance)
-- ============================================================================
CREATE TABLE expenditure_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Return Details
    return_reference VARCHAR(100) NOT NULL UNIQUE,
    fiscal_year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),

    -- Scope
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,

    -- Submission
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by_user_id UUID REFERENCES users(id),
    submission_deadline DATE NOT NULL,
    is_on_time BOOLEAN GENERATED ALWAYS AS (
        submitted_at IS NOT NULL AND submitted_at::DATE <= submission_deadline
    ) STORED,

    -- Approval
    reviewed_by_plgo BOOLEAN NOT NULL DEFAULT false,
    plgo_approved_at TIMESTAMP WITH TIME ZONE,
    plgo_approved_by_user_id UUID REFERENCES users(id),
    plgo_comments TEXT,

    reviewed_by_ministry BOOLEAN NOT NULL DEFAULT false,
    ministry_approved_at TIMESTAMP WITH TIME ZONE,
    ministry_approved_by_user_id UUID REFERENCES users(id),
    ministry_comments TEXT,

    -- Financial Summary
    total_allocation_quarter NUMERIC(15, 2) NOT NULL,
    total_expenditure_quarter NUMERIC(15, 2) NOT NULL,
    variance NUMERIC(15, 2) GENERATED ALWAYS AS (
        total_allocation_quarter - total_expenditure_quarter
    ) STORED,

    -- Supporting Documents
    return_document_id UUID,
    supporting_documents_ids UUID[],

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(constituency_id, fiscal_year, quarter)
);

CREATE INDEX idx_expenditure_returns_constituency ON expenditure_returns(constituency_id);
CREATE INDEX idx_expenditure_returns_fiscal_year ON expenditure_returns(fiscal_year, quarter);
CREATE INDEX idx_expenditure_returns_deadline ON expenditure_returns(submission_deadline, submitted_at);
CREATE INDEX idx_expenditure_returns_late ON expenditure_returns(is_on_time)
    WHERE is_on_time = false OR submitted_at IS NULL;

COMMENT ON TABLE expenditure_returns IS 'Quarterly expenditure returns submitted to MLGRD';
COMMENT ON COLUMN expenditure_returns.is_on_time IS 'Calculated: submitted on or before deadline';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER trg_budget_allocations_updated_at
    BEFORE UPDATE ON budget_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payment_vouchers_updated_at
    BEFORE UPDATE ON payment_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bank_statements_updated_at
    BEFORE UPDATE ON bank_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_financial_reports_updated_at
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_expenditure_returns_updated_at
    BEFORE UPDATE ON expenditure_returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUDGET VALIDATION FUNCTIONS
-- ============================================================================

-- Function to calculate available budget for a constituency
CREATE OR REPLACE FUNCTION calculate_available_budget(
    p_constituency_id UUID,
    p_fiscal_year INTEGER,
    p_sector project_category DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    v_allocation NUMERIC(15, 2);
    v_commitments NUMERIC(15, 2);
    v_available NUMERIC(15, 2);
BEGIN
    -- Get total allocation
    SELECT total_allocation INTO v_allocation
    FROM budget_allocations
    WHERE constituency_id = p_constituency_id
      AND fiscal_year = p_fiscal_year
      AND status = 'APPROVED';

    IF v_allocation IS NULL THEN
        RETURN 0;
    END IF;

    -- Get total active commitments
    SELECT COALESCE(SUM(bc.commitment_amount), 0) INTO v_commitments
    FROM budget_commitments bc
    JOIN budget_allocations ba ON bc.budget_allocation_id = ba.id
    WHERE ba.constituency_id = p_constituency_id
      AND ba.fiscal_year = p_fiscal_year
      AND bc.is_active = true
      AND (p_sector IS NULL OR bc.sector = p_sector);

    v_available := v_allocation - v_commitments;

    RETURN v_available;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_available_budget IS 'Calculate remaining budget available for new commitments';

-- Function to validate payment voucher against project budget
CREATE OR REPLACE FUNCTION validate_payment_against_budget(
    p_payment_voucher_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_project_id UUID;
    v_approved_budget NUMERIC(15, 2);
    v_total_payments NUMERIC(15, 2);
    v_new_payment NUMERIC(15, 2);
BEGIN
    -- Get payment details
    SELECT project_id, payment_amount INTO v_project_id, v_new_payment
    FROM payment_vouchers
    WHERE id = p_payment_voucher_id;

    -- Get project approved budget
    SELECT approved_budget INTO v_approved_budget
    FROM projects
    WHERE id = v_project_id;

    -- Get total payments already made
    SELECT COALESCE(SUM(payment_amount), 0) INTO v_total_payments
    FROM payment_vouchers
    WHERE project_id = v_project_id
      AND id != p_payment_voucher_id
      AND status IN ('PANEL_B_APPROVED', 'PENDING_PAYMENT', 'PAID', 'RECONCILED');

    -- Validate: total payments (including new) must not exceed approved budget
    RETURN (v_total_payments + v_new_payment) <= v_approved_budget;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_payment_against_budget IS 'Validate payment does not exceed project approved budget';

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditure_returns ENABLE ROW LEVEL SECURITY;

-- Budget Allocations: Constituency scope
CREATE POLICY budget_allocations_policy ON budget_allocations
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Payment Vouchers: Constituency scope
CREATE POLICY payment_vouchers_policy ON payment_vouchers
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Bank Statements: Finance Officers and above
CREATE POLICY bank_statements_policy ON bank_statements
    FOR ALL
    USING (
        current_user_role() IN ('FINANCE_OFFICER', 'PLGO', 'MINISTRY', 'AUDITOR_GENERAL', 'SYSTEM_ADMIN')
        AND (constituency_id = ANY(current_user_constituencies()) OR has_national_access())
    );

-- Financial Reports: Broader access (CDFC can view)
CREATE POLICY financial_reports_policy ON financial_reports
    FOR SELECT
    USING (
        constituency_id IS NULL  -- National reports
        OR constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Expenditure Returns: Constituency and national access
CREATE POLICY expenditure_returns_policy ON expenditure_returns
    FOR ALL
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );
