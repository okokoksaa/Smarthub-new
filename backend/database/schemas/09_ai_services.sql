-- ============================================================================
-- CDF SMART HUB - AI ASSISTIVE SERVICES SCHEMA
-- ============================================================================
-- Purpose: AI-powered advisory services (READ-ONLY, non-decisional)
-- Services: Document Intelligence, Anomaly Detection, Risk Scoring,
--           Predictive Analytics, Compliance Verification
-- CRITICAL: AI has NO write access - all outputs are advisory only
-- ============================================================================

-- ============================================================================
-- AI MODELS REGISTRY
-- ============================================================================
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_code VARCHAR(100) NOT NULL UNIQUE,
    model_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Model Type
    service_type ai_service_type NOT NULL,
    model_family VARCHAR(100),          -- e.g., 'GPT-4', 'BERT', 'Custom'
    model_version VARCHAR(50) NOT NULL,

    -- Deployment
    deployment_environment VARCHAR(50) NOT NULL, -- 'PRODUCTION', 'STAGING', 'DEVELOPMENT'
    deployment_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Performance Metrics
    accuracy_score NUMERIC(5, 4),       -- e.g., 0.9523
    precision_score NUMERIC(5, 4),
    recall_score NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),

    -- Training Details
    training_dataset_size INTEGER,
    training_completed_at TIMESTAMP WITH TIME ZONE,
    last_retrained_at TIMESTAMP WITH TIME ZONE,

    -- Model Configuration
    hyperparameters JSONB,
    feature_engineering_config JSONB,

    -- API Details
    api_endpoint TEXT,
    api_provider VARCHAR(100),          -- 'OpenAI', 'Azure', 'AWS', 'Custom'
    max_tokens INTEGER,
    temperature NUMERIC(3, 2),

    -- Cost
    cost_per_1k_tokens NUMERIC(10, 6),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_ai_models_code ON ai_models(model_code);
CREATE INDEX idx_ai_models_service_type ON ai_models(service_type);
CREATE INDEX idx_ai_models_active ON ai_models(is_active) WHERE is_active = true;

COMMENT ON TABLE ai_models IS 'Registry of AI models with versioning and performance tracking';
COMMENT ON COLUMN ai_models.temperature IS 'Model temperature (0.0 = deterministic, 1.0 = creative)';

-- ============================================================================
-- AI INFERENCE LOG
-- ============================================================================
-- Logs every AI inference (prediction, classification, extraction)
CREATE TABLE ai_inference_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inference_number BIGSERIAL UNIQUE,

    -- Model
    ai_model_id UUID NOT NULL REFERENCES ai_models(id),
    service_type ai_service_type NOT NULL,

    -- Input
    input_data JSONB NOT NULL,
    input_tokens INTEGER,
    input_hash VARCHAR(64),             -- SHA-256 hash for deduplication

    -- Output
    output_data JSONB NOT NULL,
    output_tokens INTEGER,
    confidence_level ai_confidence_level NOT NULL,
    confidence_score NUMERIC(5, 4),     -- 0.0000 to 1.0000

    -- Context
    user_id UUID REFERENCES users(id),
    related_entity_type VARCHAR(100),   -- e.g., 'PROJECT', 'PAYMENT', 'DOCUMENT'
    related_entity_id UUID,

    -- Human Override
    human_reviewed BOOLEAN NOT NULL DEFAULT false,
    human_review_timestamp TIMESTAMP WITH TIME ZONE,
    human_reviewer_id UUID REFERENCES users(id),
    human_override BOOLEAN DEFAULT false,
    override_reason TEXT,

    -- Performance
    inference_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    latency_ms INTEGER NOT NULL,        -- Response time in milliseconds
    cost_usd NUMERIC(10, 6),            -- Cost in USD

    -- Audit
    audit_log_entry_id UUID,            -- Reference to audit log
    is_production BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_inference_model ON ai_inference_log(ai_model_id);
CREATE INDEX idx_ai_inference_service ON ai_inference_log(service_type);
CREATE INDEX idx_ai_inference_timestamp ON ai_inference_log(inference_timestamp DESC);
CREATE INDEX idx_ai_inference_entity ON ai_inference_log(related_entity_type, related_entity_id);
CREATE INDEX idx_ai_inference_user ON ai_inference_log(user_id);
CREATE INDEX idx_ai_inference_hash ON ai_inference_log(input_hash);
CREATE INDEX idx_ai_inference_override ON ai_inference_log(human_override) WHERE human_override = true;

COMMENT ON TABLE ai_inference_log IS 'Immutable log of all AI predictions with human override tracking';
COMMENT ON COLUMN ai_inference_log.confidence_score IS 'Model confidence (0.0 - 1.0)';
COMMENT ON COLUMN ai_inference_log.human_override IS 'TRUE if human disagreed with AI recommendation';

-- ============================================================================
-- DOCUMENT INTELLIGENCE EXTRACTIONS
-- ============================================================================
CREATE TABLE ai_document_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id),
    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Extraction Results
    extracted_text TEXT,
    extracted_fields JSONB,             -- Structured key-value pairs
    detected_language VARCHAR(10),

    -- Document Classification
    document_type_detected document_type,
    document_type_confidence NUMERIC(5, 4),

    -- Entity Recognition
    named_entities JSONB,               -- People, places, organizations, amounts
    key_dates JSONB,                    -- Detected dates with context
    monetary_amounts JSONB,             -- Detected amounts with currency

    -- Quality Metrics
    text_quality_score NUMERIC(5, 4),   -- OCR quality
    completeness_score NUMERIC(5, 4),   -- Are all required fields present?

    -- Validation Flags
    has_anomalies BOOLEAN DEFAULT false,
    anomalies JSONB,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_doc_extractions_doc ON ai_document_extractions(document_id);
CREATE INDEX idx_ai_doc_extractions_inference ON ai_document_extractions(ai_inference_id);
CREATE INDEX idx_ai_doc_extractions_anomalies ON ai_document_extractions(has_anomalies)
    WHERE has_anomalies = true;

COMMENT ON TABLE ai_document_extractions IS 'AI-extracted data from documents (contracts, invoices, receipts)';
COMMENT ON COLUMN ai_document_extractions.extracted_fields IS 'Structured data: {"contract_value": 50000, "contractor_name": "ABC Ltd"}';

-- ============================================================================
-- ANOMALY DETECTION RESULTS
-- ============================================================================
CREATE TABLE ai_anomaly_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_number BIGSERIAL UNIQUE,

    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Anomaly Details
    anomaly_type VARCHAR(100) NOT NULL, -- 'DUPLICATE_PAYMENT', 'UNUSUAL_AMOUNT', 'SPEED_VIOLATION'
    anomaly_category VARCHAR(50) NOT NULL, -- 'FINANCIAL', 'WORKFLOW', 'COMPLIANCE'
    severity VARCHAR(20) NOT NULL,      -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'

    -- Affected Entity
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,

    -- Detection Details
    anomaly_description TEXT NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),

    -- Evidence
    evidence JSONB,                     -- Data points that triggered detection
    baseline_value NUMERIC(15, 2),      -- Expected value
    actual_value NUMERIC(15, 2),        -- Detected value
    deviation_percentage NUMERIC(7, 2), -- % deviation from baseline

    -- Similar Cases
    similar_cases_count INTEGER,
    similar_cases JSONB,                -- References to similar historical anomalies

    -- Investigation
    requires_investigation BOOLEAN NOT NULL DEFAULT false,
    investigation_assigned_to UUID REFERENCES users(id),
    investigation_status VARCHAR(50),   -- 'PENDING', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'
    investigation_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Outcome
    is_false_positive BOOLEAN,
    corrective_action_taken TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_anomalies_inference ON ai_anomaly_detections(ai_inference_id);
CREATE INDEX idx_ai_anomalies_entity ON ai_anomaly_detections(entity_type, entity_id);
CREATE INDEX idx_ai_anomalies_severity ON ai_anomaly_detections(severity);
CREATE INDEX idx_ai_anomalies_timestamp ON ai_anomaly_detections(created_at DESC);
CREATE INDEX idx_ai_anomalies_investigation ON ai_anomaly_detections(investigation_status)
    WHERE requires_investigation = true;

COMMENT ON TABLE ai_anomaly_detections IS 'AI-detected anomalies requiring human review';
COMMENT ON COLUMN ai_anomaly_detections.risk_score IS 'AI-calculated risk score (0-100)';

-- ============================================================================
-- RISK SCORING
-- ============================================================================
CREATE TABLE ai_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_number BIGSERIAL UNIQUE,

    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Assessed Entity
    entity_type VARCHAR(100) NOT NULL,  -- 'PROJECT', 'CONTRACTOR', 'PAYMENT'
    entity_id UUID NOT NULL,

    -- Overall Risk
    overall_risk_score INTEGER NOT NULL CHECK (overall_risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL,    -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'

    -- Risk Factor Breakdown
    financial_risk_score INTEGER CHECK (financial_risk_score BETWEEN 0 AND 100),
    compliance_risk_score INTEGER CHECK (compliance_risk_score BETWEEN 0 AND 100),
    timeline_risk_score INTEGER CHECK (timeline_risk_score BETWEEN 0 AND 100),
    quality_risk_score INTEGER CHECK (quality_risk_score BETWEEN 0 AND 100),

    -- Risk Factors
    risk_factors JSONB NOT NULL,        -- Detailed breakdown of contributing factors

    -- Recommendations
    recommendations TEXT,
    mitigation_strategies JSONB,

    -- Validity
    assessment_valid_until TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_risk_inference ON ai_risk_assessments(ai_inference_id);
CREATE INDEX idx_ai_risk_entity ON ai_risk_assessments(entity_type, entity_id);
CREATE INDEX idx_ai_risk_score ON ai_risk_assessments(overall_risk_score DESC);
CREATE INDEX idx_ai_risk_current ON ai_risk_assessments(is_current) WHERE is_current = true;

COMMENT ON TABLE ai_risk_assessments IS 'AI-calculated risk scores for projects, contractors, payments';

-- ============================================================================
-- PREDICTIVE ANALYTICS
-- ============================================================================
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_number BIGSERIAL UNIQUE,

    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Prediction Type
    prediction_type VARCHAR(100) NOT NULL, -- 'PROJECT_DELAY', 'BUDGET_OVERRUN', 'COMPLETION_DATE'
    prediction_category VARCHAR(50) NOT NULL,

    -- Target Entity
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,

    -- Prediction
    predicted_value JSONB NOT NULL,     -- Flexible: date, amount, percentage, etc.
    confidence_interval_lower JSONB,
    confidence_interval_upper JSONB,
    confidence_percentage NUMERIC(5, 2), -- e.g., 85.00%

    -- Context
    input_features JSONB,               -- Features used for prediction
    model_assumptions JSONB,

    -- Validation (after actual outcome is known)
    actual_value JSONB,
    prediction_error NUMERIC(15, 2),
    is_accurate BOOLEAN,

    -- Validity
    prediction_date DATE NOT NULL,
    prediction_horizon_days INTEGER,    -- How far into future?
    valid_until DATE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_predictions_inference ON ai_predictions(ai_inference_id);
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_timestamp ON ai_predictions(created_at DESC);

COMMENT ON TABLE ai_predictions IS 'AI predictions for project completion, budget adherence, etc.';

-- ============================================================================
-- COMPLIANCE VERIFICATION RESULTS
-- ============================================================================
CREATE TABLE ai_compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_number BIGSERIAL UNIQUE,

    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Checked Entity
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,

    -- Compliance Framework
    regulation_reference VARCHAR(200) NOT NULL, -- e.g., 'CDF Act Section 12.3'
    rule_description TEXT NOT NULL,

    -- Result
    is_compliant BOOLEAN NOT NULL,
    compliance_score NUMERIC(5, 4),     -- 0.0000 to 1.0000
    confidence_level ai_confidence_level NOT NULL,

    -- Violations
    violations JSONB,                   -- List of detected violations
    violation_severity VARCHAR(20),     -- 'MINOR', 'MODERATE', 'MAJOR', 'CRITICAL'

    -- Remediation
    remediation_required BOOLEAN NOT NULL DEFAULT false,
    remediation_suggestions TEXT,
    remediation_deadline DATE,

    -- Human Verification
    human_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verification_timestamp TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_compliance_inference ON ai_compliance_checks(ai_inference_id);
CREATE INDEX idx_ai_compliance_entity ON ai_compliance_checks(entity_type, entity_id);
CREATE INDEX idx_ai_compliance_result ON ai_compliance_checks(is_compliant);
CREATE INDEX idx_ai_compliance_timestamp ON ai_compliance_checks(created_at DESC);

COMMENT ON TABLE ai_compliance_checks IS 'AI-automated compliance verification against CDF Act and regulations';

-- ============================================================================
-- CONFLICT OF INTEREST DETECTION
-- ============================================================================
CREATE TABLE ai_conflict_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_number BIGSERIAL UNIQUE,

    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Potential Conflict
    conflict_type VARCHAR(100) NOT NULL, -- 'FINANCIAL', 'FAMILIAL', 'EMPLOYMENT', 'PRIOR_RELATIONSHIP'
    severity VARCHAR(20) NOT NULL,       -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'

    -- Involved Parties
    party_a_type VARCHAR(100) NOT NULL,  -- 'USER', 'CONTRACTOR', 'BENEFICIARY'
    party_a_id UUID NOT NULL,
    party_b_type VARCHAR(100) NOT NULL,
    party_b_id UUID NOT NULL,

    -- Context
    related_entity_type VARCHAR(100),    -- 'PROJECT', 'PAYMENT', 'COMMITTEE'
    related_entity_id UUID,

    -- Detection Details
    conflict_description TEXT NOT NULL,
    evidence JSONB,
    confidence_score NUMERIC(5, 4) NOT NULL,

    -- Relationship Graph
    relationship_path JSONB,            -- How the parties are connected

    -- Resolution
    requires_disclosure BOOLEAN NOT NULL DEFAULT false,
    disclosure_filed BOOLEAN DEFAULT false,
    resolution_status VARCHAR(50),      -- 'PENDING', 'DISCLOSED', 'RECUSED', 'WAIVED'
    resolution_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_conflicts_inference ON ai_conflict_detections(ai_inference_id);
CREATE INDEX idx_ai_conflicts_parties ON ai_conflict_detections(party_a_type, party_a_id, party_b_type, party_b_id);
CREATE INDEX idx_ai_conflicts_entity ON ai_conflict_detections(related_entity_type, related_entity_id);
CREATE INDEX idx_ai_conflicts_severity ON ai_conflict_detections(severity);
CREATE INDEX idx_ai_conflicts_timestamp ON ai_conflict_detections(created_at DESC);

COMMENT ON TABLE ai_conflict_detections IS 'AI-detected potential conflicts of interest';

-- ============================================================================
-- AI FEEDBACK & LEARNING
-- ============================================================================
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_inference_id UUID NOT NULL REFERENCES ai_inference_log(id),

    -- Feedback Provider
    feedback_user_id UUID NOT NULL REFERENCES users(id),
    feedback_user_role user_role NOT NULL,

    -- Feedback
    is_helpful BOOLEAN NOT NULL,
    is_accurate BOOLEAN NOT NULL,
    feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_text TEXT,

    -- Corrections
    suggested_correction JSONB,
    correction_applied BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_feedback_inference ON ai_feedback(ai_inference_id);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(feedback_user_id);
CREATE INDEX idx_ai_feedback_timestamp ON ai_feedback(created_at DESC);

COMMENT ON TABLE ai_feedback IS 'User feedback on AI predictions for model improvement';

-- ============================================================================
-- AI MODEL PERFORMANCE METRICS
-- ============================================================================
CREATE TABLE ai_model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_model_id UUID NOT NULL REFERENCES ai_models(id),

    -- Time Period
    evaluation_date DATE NOT NULL,
    evaluation_period VARCHAR(20) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY'

    -- Volume Metrics
    total_inferences INTEGER NOT NULL,
    total_tokens_consumed BIGINT,
    total_cost_usd NUMERIC(10, 2),

    -- Performance Metrics
    average_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    p99_latency_ms INTEGER,

    -- Accuracy Metrics
    accuracy NUMERIC(5, 4),
    precision_score NUMERIC(5, 4),
    recall_score NUMERIC(5, 4),
    f1_score NUMERIC(5, 4),

    -- User Satisfaction
    average_user_rating NUMERIC(3, 2),
    helpful_count INTEGER,
    not_helpful_count INTEGER,

    -- Override Rate
    human_override_rate NUMERIC(5, 4),  -- % of predictions overridden by humans
    override_count INTEGER,

    -- Error Analysis
    false_positive_rate NUMERIC(5, 4),
    false_negative_rate NUMERIC(5, 4),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(ai_model_id, evaluation_date, evaluation_period)
);

CREATE INDEX idx_ai_performance_model ON ai_model_performance(ai_model_id);
CREATE INDEX idx_ai_performance_date ON ai_model_performance(evaluation_date DESC);

COMMENT ON TABLE ai_model_performance IS 'Daily/weekly/monthly performance metrics for AI models';

-- ============================================================================
-- AI TRAINING DATASETS
-- ============================================================================
CREATE TABLE ai_training_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_code VARCHAR(100) NOT NULL UNIQUE,
    dataset_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Dataset Details
    service_type ai_service_type NOT NULL,
    dataset_version VARCHAR(50) NOT NULL,

    -- Size & Composition
    total_records INTEGER NOT NULL,
    training_split_percentage NUMERIC(5, 2) DEFAULT 80.00,
    validation_split_percentage NUMERIC(5, 2) DEFAULT 10.00,
    test_split_percentage NUMERIC(5, 2) DEFAULT 10.00,

    -- Storage
    storage_location TEXT NOT NULL,
    storage_size_mb INTEGER,

    -- Quality
    data_quality_score NUMERIC(5, 4),
    has_bias_assessment BOOLEAN DEFAULT false,
    bias_assessment_results JSONB,

    -- Lineage
    source_description TEXT,
    collection_start_date DATE,
    collection_end_date DATE,
    anonymization_applied BOOLEAN NOT NULL DEFAULT true,

    -- Usage
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_ai_datasets_code ON ai_training_datasets(dataset_code);
CREATE INDEX idx_ai_datasets_service ON ai_training_datasets(service_type);
CREATE INDEX idx_ai_datasets_active ON ai_training_datasets(is_active) WHERE is_active = true;

COMMENT ON TABLE ai_training_datasets IS 'Training datasets for AI models with lineage and quality tracking';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER trg_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-mark old risk assessments as not current when new one is created
CREATE OR REPLACE FUNCTION invalidate_old_risk_assessments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_risk_assessments
    SET is_current = false
    WHERE entity_type = NEW.entity_type
      AND entity_id = NEW.entity_id
      AND id <> NEW.id
      AND is_current = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_risk_assessments_invalidate_old
    AFTER INSERT ON ai_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_old_risk_assessments();

-- Prevent AI inference log modification
CREATE OR REPLACE FUNCTION prevent_ai_inference_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AI inference log is immutable - cannot update or delete';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ai_inference_update
    BEFORE UPDATE ON ai_inference_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ai_inference_modification();

CREATE TRIGGER trg_prevent_ai_inference_delete
    BEFORE DELETE ON ai_inference_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ai_inference_modification();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE ai_inference_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_risk_assessments ENABLE ROW LEVEL SECURITY;

-- AI inference log: Users can read their own inferences or national access
CREATE POLICY ai_inference_read_policy ON ai_inference_log
    FOR SELECT
    USING (user_id = current_user_id() OR has_national_access());

-- Anomaly detections: Accessible by investigators and national roles
CREATE POLICY ai_anomalies_read_policy ON ai_anomaly_detections
    FOR SELECT
    USING (
        investigation_assigned_to = current_user_id()
        OR has_national_access()
        OR current_user_role() IN ('M_AND_E_OFFICER', 'AUDITOR_GENERAL')
    );

-- Risk assessments: Accessible by relevant users
CREATE POLICY ai_risk_read_policy ON ai_risk_assessments
    FOR SELECT
    USING (has_national_access() OR current_user_role() IN ('M_AND_E_OFFICER', 'TAC_MEMBER'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest risk assessment for an entity
CREATE OR REPLACE FUNCTION get_latest_risk_score(
    p_entity_type VARCHAR(100),
    p_entity_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_risk_score INTEGER;
BEGIN
    SELECT overall_risk_score INTO v_risk_score
    FROM ai_risk_assessments
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND is_current = true
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN COALESCE(v_risk_score, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check for active anomalies
CREATE OR REPLACE FUNCTION has_active_anomalies(
    p_entity_type VARCHAR(100),
    p_entity_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM ai_anomaly_detections
    WHERE entity_type = p_entity_type
      AND entity_id = p_entity_id
      AND investigation_status NOT IN ('RESOLVED', 'FALSE_POSITIVE')
      AND severity IN ('HIGH', 'CRITICAL');

    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SEED DATA: Default AI Models
-- ============================================================================

INSERT INTO ai_models (
    model_code, model_name, service_type, model_family, model_version,
    deployment_environment, deployment_date, is_active, description
) VALUES
    (
        'DOC_INTEL_V1',
        'Document Intelligence v1',
        'DOCUMENT_INTELLIGENCE',
        'GPT-4-Vision',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'OCR and structured data extraction from documents'
    ),
    (
        'ANOMALY_DETECT_V1',
        'Financial Anomaly Detection v1',
        'ANOMALY_DETECTION',
        'Custom-XGBoost',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'Detects unusual patterns in financial transactions'
    ),
    (
        'RISK_SCORE_V1',
        'Project Risk Scoring v1',
        'RISK_SCORING',
        'Custom-RandomForest',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'Calculates risk scores for projects and contractors'
    ),
    (
        'PREDICT_ANALYTICS_V1',
        'Predictive Analytics v1',
        'PREDICTIVE_ANALYTICS',
        'Custom-LSTM',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'Predicts project completion dates and budget adherence'
    ),
    (
        'COMPLIANCE_CHECK_V1',
        'Compliance Verification v1',
        'COMPLIANCE_VERIFICATION',
        'GPT-4',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'Automated compliance checks against CDF Act'
    ),
    (
        'CONFLICT_DETECT_V1',
        'Conflict of Interest Detection v1',
        'CONFLICT_DETECTION',
        'Custom-GraphNN',
        '1.0.0',
        'PRODUCTION',
        CURRENT_DATE,
        true,
        'Graph-based conflict of interest detection'
    )
ON CONFLICT (model_code) DO NOTHING;

COMMENT ON TABLE ai_models IS 'AI models registry with version control and performance tracking';
COMMENT ON TABLE ai_inference_log IS 'Immutable log of all AI inferences - critical for audit and human override tracking';
