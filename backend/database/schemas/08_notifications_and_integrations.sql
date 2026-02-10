-- ============================================================================
-- CDF SMART HUB - NOTIFICATIONS & EXTERNAL INTEGRATIONS SCHEMA
-- ============================================================================
-- Purpose: Multi-channel notifications and external system integrations
-- Channels: SMS, Email, Push, WhatsApp, In-App
-- Integrations: Banks, IFMIS, ZPPA, Mobile Money, National Registration
-- ============================================================================

-- ============================================================================
-- NOTIFICATION TEMPLATES
-- ============================================================================
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_code VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Template Content
    subject_template TEXT,               -- For Email/Push
    body_template TEXT NOT NULL,         -- Supports variable substitution
    sms_template TEXT,                   -- Max 160 chars for SMS

    -- Channel Configuration
    supported_channels notification_channel[] NOT NULL,
    default_channel notification_channel NOT NULL,

    -- Priority & Urgency
    default_priority task_priority DEFAULT 'MEDIUM',
    is_critical BOOLEAN NOT NULL DEFAULT false,

    -- Localization
    language VARCHAR(10) DEFAULT 'en',

    -- Variables (JSON schema of required variables)
    required_variables JSONB,            -- e.g., ["user_name", "project_title"]

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_notification_templates_code ON notification_templates(template_code);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE notification_templates IS 'Reusable notification templates for multi-channel delivery';
COMMENT ON COLUMN notification_templates.body_template IS 'Template with variable placeholders like {{user_name}}';

-- ============================================================================
-- NOTIFICATIONS QUEUE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_number BIGSERIAL UNIQUE,

    -- Template & Content
    template_id UUID REFERENCES notification_templates(id),
    subject TEXT,
    body TEXT NOT NULL,

    -- Recipients
    recipient_user_id UUID REFERENCES users(id),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_device_token TEXT,         -- For push notifications

    -- Channel & Status
    channel notification_channel NOT NULL,
    status notification_status NOT NULL DEFAULT 'PENDING',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',

    -- Delivery Tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,

    -- Provider Response
    provider_message_id VARCHAR(255),    -- External provider's message ID
    provider_response JSONB,

    -- Context
    related_entity_type VARCHAR(100),    -- e.g., 'PROJECT', 'PAYMENT'
    related_entity_id UUID,
    action_url TEXT,                     -- Deep link for mobile app

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    scheduled_for TIMESTAMP WITH TIME ZONE,

    CONSTRAINT chk_recipient_channel CHECK (
        CASE channel
            WHEN 'EMAIL' THEN recipient_email IS NOT NULL
            WHEN 'SMS' THEN recipient_phone IS NOT NULL
            WHEN 'PUSH' THEN recipient_device_token IS NOT NULL
            ELSE true
        END
    ),
    CONSTRAINT chk_retry_limit CHECK (retry_count <= max_retries)
);

CREATE INDEX idx_notifications_recipient_user ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_pending ON notifications(created_at)
    WHERE status = 'PENDING' AND scheduled_for <= NOW();
CREATE INDEX idx_notifications_entity ON notifications(related_entity_type, related_entity_id);
CREATE INDEX idx_notifications_channel ON notifications(channel);

COMMENT ON TABLE notifications IS 'Notification queue for multi-channel delivery (SMS, Email, Push, WhatsApp)';
COMMENT ON COLUMN notifications.retry_count IS 'Current retry attempt (max 3 retries)';

-- ============================================================================
-- SMS DELIVERY LOG
-- ============================================================================
CREATE TABLE sms_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

    -- SMS Details
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    character_count INTEGER NOT NULL,
    sms_segments INTEGER NOT NULL,       -- Number of SMS segments (160 chars each)

    -- Provider Details
    provider VARCHAR(50) NOT NULL,       -- 'AIRTEL', 'MTN', 'ZAMTEL'
    provider_message_id VARCHAR(255),
    provider_cost NUMERIC(10, 4),        -- Cost in ZMW

    -- Status
    status notification_status NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_report JSONB,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_log_notification ON sms_delivery_log(notification_id);
CREATE INDEX idx_sms_log_phone ON sms_delivery_log(phone_number);
CREATE INDEX idx_sms_log_provider ON sms_delivery_log(provider);
CREATE INDEX idx_sms_log_timestamp ON sms_delivery_log(created_at DESC);

COMMENT ON TABLE sms_delivery_log IS 'SMS delivery tracking with provider details and costs';

-- ============================================================================
-- EMAIL DELIVERY LOG
-- ============================================================================
CREATE TABLE email_delivery_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

    -- Email Details
    recipient_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT,                      -- Plain text version
    body_html TEXT,                      -- HTML version

    -- Attachments
    attachment_count INTEGER DEFAULT 0,
    attachment_metadata JSONB,           -- File names, sizes

    -- Provider Details (AWS SES, SendGrid, etc.)
    provider VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),

    -- Status
    status notification_status NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,  -- If tracking enabled
    clicked_at TIMESTAMP WITH TIME ZONE, -- If link tracking enabled
    bounced_at TIMESTAMP WITH TIME ZONE,
    bounce_type VARCHAR(50),             -- 'HARD', 'SOFT'
    bounce_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_log_notification ON email_delivery_log(notification_id);
CREATE INDEX idx_email_log_recipient ON email_delivery_log(recipient_email);
CREATE INDEX idx_email_log_timestamp ON email_delivery_log(created_at DESC);

COMMENT ON TABLE email_delivery_log IS 'Email delivery tracking with open/click metrics';

-- ============================================================================
-- PUSH NOTIFICATION LOG
-- ============================================================================
CREATE TABLE push_notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

    -- Device Details
    user_id UUID REFERENCES users(id),
    device_token TEXT NOT NULL,
    device_platform VARCHAR(20),         -- 'IOS', 'ANDROID', 'WEB'

    -- Notification Details
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    badge_count INTEGER,
    sound VARCHAR(50),
    icon_url TEXT,
    image_url TEXT,
    data_payload JSONB,                  -- Custom data

    -- Provider Details (FCM, APNS)
    provider VARCHAR(50) NOT NULL,
    provider_response JSONB,

    -- Status
    status notification_status NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_log_notification ON push_notification_log(notification_id);
CREATE INDEX idx_push_log_user ON push_notification_log(user_id);
CREATE INDEX idx_push_log_timestamp ON push_notification_log(created_at DESC);

COMMENT ON TABLE push_notification_log IS 'Push notification delivery tracking (iOS, Android, Web)';

-- ============================================================================
-- EXTERNAL SYSTEMS REGISTRY
-- ============================================================================
CREATE TABLE external_systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    system_code VARCHAR(100) NOT NULL UNIQUE,
    system_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- System Type
    system_category VARCHAR(50) NOT NULL, -- 'BANKING', 'GOVERNMENT', 'MOBILE_MONEY', 'IDENTITY'

    -- Connection Details
    base_url TEXT,
    api_version VARCHAR(20),
    authentication_method VARCHAR(50),   -- 'API_KEY', 'OAUTH2', 'MUTUAL_TLS'
    credential_vault_key VARCHAR(255),   -- Reference to AWS Secrets Manager

    -- Health & Monitoring
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_health_check_at TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(20),           -- 'HEALTHY', 'DEGRADED', 'DOWN'
    uptime_percentage NUMERIC(5, 2),

    -- Rate Limiting
    rate_limit_requests INTEGER,
    rate_limit_window_seconds INTEGER,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_systems_code ON external_systems(system_code);
CREATE INDEX idx_external_systems_category ON external_systems(system_category);
CREATE INDEX idx_external_systems_active ON external_systems(is_active) WHERE is_active = true;

COMMENT ON TABLE external_systems IS 'Registry of external systems (Banks, IFMIS, ZPPA, Mobile Money)';

-- ============================================================================
-- INTEGRATION API CALLS LOG
-- ============================================================================
CREATE TABLE integration_api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_number BIGSERIAL UNIQUE,

    -- External System
    external_system_id UUID NOT NULL REFERENCES external_systems(id),

    -- Request Details
    endpoint VARCHAR(500) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    request_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Response Details
    response_status_code INTEGER,
    response_headers JSONB,
    response_body JSONB,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    response_time_ms INTEGER,

    -- Context
    initiated_by_user_id UUID REFERENCES users(id),
    related_entity_type VARCHAR(100),
    related_entity_id UUID,
    idempotency_key UUID,               -- For retry safety

    -- Status
    success BOOLEAN,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_calls_system ON integration_api_calls(external_system_id);
CREATE INDEX idx_integration_calls_timestamp ON integration_api_calls(request_timestamp DESC);
CREATE INDEX idx_integration_calls_entity ON integration_api_calls(related_entity_type, related_entity_id);
CREATE INDEX idx_integration_calls_idempotency ON integration_api_calls(idempotency_key);
CREATE INDEX idx_integration_calls_failed ON integration_api_calls(request_timestamp DESC)
    WHERE success = false;

COMMENT ON TABLE integration_api_calls IS 'Complete audit log of all external API calls';
COMMENT ON COLUMN integration_api_calls.idempotency_key IS 'Unique key to prevent duplicate operations on retries';

-- ============================================================================
-- BANK ACCOUNTS
-- ============================================================================
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,

    -- Bank Details
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(100),
    branch_code VARCHAR(20),
    swift_code VARCHAR(20),

    -- Account Type
    account_type VARCHAR(50) NOT NULL,   -- 'CDF_CONSTITUENCY', 'TREASURY'

    -- Tenant Scope
    constituency_id UUID REFERENCES constituencies(id),

    -- Balance (cached from bank)
    current_balance NUMERIC(15, 2),
    balance_last_updated_at TIMESTAMP WITH TIME ZONE,

    -- API Integration
    external_system_id UUID REFERENCES external_systems(id),
    api_account_reference VARCHAR(100), -- Bank's internal account ID

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    opened_date DATE,
    closed_date DATE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_account_number ON bank_accounts(account_number);
CREATE INDEX idx_bank_accounts_constituency ON bank_accounts(constituency_id);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;

COMMENT ON TABLE bank_accounts IS 'CDF constituency bank accounts with API integration';

-- ============================================================================
-- MOBILE MONEY ACCOUNTS
-- ============================================================================
CREATE TABLE mobile_money_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,

    -- Provider
    provider VARCHAR(50) NOT NULL,       -- 'AIRTEL_MONEY', 'MTN_MOMO', 'ZAMTEL_KWACHA'
    account_name VARCHAR(200) NOT NULL,

    -- Verification
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50),

    -- Owner
    owner_type VARCHAR(50) NOT NULL,     -- 'BENEFICIARY', 'CONTRACTOR', 'SUPPLIER'
    owner_id UUID NOT NULL,

    -- Tenant Scope
    constituency_id UUID REFERENCES constituencies(id),

    -- API Integration
    external_system_id UUID REFERENCES external_systems(id),

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(phone_number, provider)
);

CREATE INDEX idx_mobile_money_phone ON mobile_money_accounts(phone_number);
CREATE INDEX idx_mobile_money_owner ON mobile_money_accounts(owner_type, owner_id);
CREATE INDEX idx_mobile_money_constituency ON mobile_money_accounts(constituency_id);

COMMENT ON TABLE mobile_money_accounts IS 'Mobile money accounts for direct beneficiary payments';

-- ============================================================================
-- NATIONAL REGISTRATION VERIFICATION LOG
-- ============================================================================
CREATE TABLE nrc_verification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- NRC Details
    nrc_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender gender,

    -- Verification Details
    verification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verification_method VARCHAR(50) NOT NULL, -- 'API', 'MANUAL_UPLOAD'

    -- Result
    is_verified BOOLEAN NOT NULL,
    verification_response JSONB,
    photo_match_score NUMERIC(5, 2),    -- If biometric verification

    -- Context
    verified_for_entity_type VARCHAR(100), -- 'USER', 'BENEFICIARY', 'CONTRACTOR'
    verified_for_entity_id UUID,
    verified_by_user_id UUID REFERENCES users(id),

    -- API Call
    integration_call_id UUID REFERENCES integration_api_calls(id),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nrc_verification_nrc ON nrc_verification_log(nrc_number);
CREATE INDEX idx_nrc_verification_entity ON nrc_verification_log(verified_for_entity_type, verified_for_entity_id);
CREATE INDEX idx_nrc_verification_timestamp ON nrc_verification_log(verification_timestamp DESC);

COMMENT ON TABLE nrc_verification_log IS 'National Registration Card verification audit trail';

-- ============================================================================
-- IFMIS INTEGRATION LOG
-- ============================================================================
-- Integration with Integrated Financial Management Information System
CREATE TABLE ifmis_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ifmis_transaction_number VARCHAR(100) NOT NULL UNIQUE,

    -- Local Reference
    payment_transaction_id UUID REFERENCES payment_transactions(id),

    -- IFMIS Details
    ifmis_voucher_number VARCHAR(100),
    ifmis_payment_reference VARCHAR(100),

    -- Transaction Data
    transaction_type VARCHAR(50) NOT NULL, -- 'DISBURSEMENT', 'REFUND'
    amount NUMERIC(15, 2) NOT NULL,
    transaction_date DATE NOT NULL,

    -- Budget Classification
    budget_code VARCHAR(50),
    economic_classification VARCHAR(50),
    program_code VARCHAR(50),

    -- Status
    sync_status VARCHAR(50) NOT NULL,    -- 'PENDING', 'SYNCED', 'FAILED'
    synced_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,

    -- API Call
    integration_call_id UUID REFERENCES integration_api_calls(id),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ifmis_txn_number ON ifmis_transactions(ifmis_transaction_number);
CREATE INDEX idx_ifmis_payment ON ifmis_transactions(payment_transaction_id);
CREATE INDEX idx_ifmis_sync_status ON ifmis_transactions(sync_status);

COMMENT ON TABLE ifmis_transactions IS 'IFMIS integration for Treasury reconciliation';

-- ============================================================================
-- ZPPA INTEGRATION
-- ============================================================================
-- Integration with Zambia Public Procurement Authority
CREATE TABLE zppa_contractor_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contractor
    contractor_id UUID NOT NULL REFERENCES contractors(id),

    -- ZPPA Details
    zppa_registration_number VARCHAR(100),
    zppa_category VARCHAR(100),
    zppa_grade VARCHAR(50),
    zppa_expiry_date DATE,

    -- Verification
    verification_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL,
    is_blacklisted BOOLEAN NOT NULL DEFAULT false,
    blacklist_reason TEXT,

    -- API Call
    integration_call_id UUID REFERENCES integration_api_calls(id),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zppa_contractor ON zppa_contractor_verifications(contractor_id);
CREATE INDEX idx_zppa_registration ON zppa_contractor_verifications(zppa_registration_number);
CREATE INDEX idx_zppa_timestamp ON zppa_contractor_verifications(verification_timestamp DESC);

COMMENT ON TABLE zppa_contractor_verifications IS 'ZPPA contractor verification and blacklist checking';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER trg_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_external_systems_updated_at
    BEFORE UPDATE ON external_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_mobile_money_updated_at
    BEFORE UPDATE ON mobile_money_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate SMS segments
CREATE OR REPLACE FUNCTION calculate_sms_segments()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_count = LENGTH(NEW.message_text);
    NEW.sms_segments = CEIL(NEW.character_count::NUMERIC / 160);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sms_calculate_segments
    BEFORE INSERT OR UPDATE ON sms_delivery_log
    FOR EACH ROW
    EXECUTE FUNCTION calculate_sms_segments();

-- Auto-log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'DELIVERED' AND OLD.status <> 'DELIVERED' THEN
        NEW.delivered_at = NOW();
    END IF;

    IF NEW.status = 'READ' AND OLD.status <> 'READ' THEN
        NEW.read_at = NOW();
    END IF;

    IF NEW.status = 'FAILED' AND OLD.status <> 'FAILED' THEN
        NEW.failed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_delivery_tracking
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION log_notification_delivery();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_money_accounts ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY notifications_read_own ON notifications
    FOR SELECT
    USING (recipient_user_id = current_user_id() OR has_national_access());

-- Only system can write notifications
CREATE POLICY notifications_write_system ON notifications
    FOR ALL
    USING (current_user_role() IN ('SYSTEM_ADMIN'));

-- Bank accounts: Constituency users can read their own
CREATE POLICY bank_accounts_read_policy ON bank_accounts
    FOR SELECT
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- Only SYSTEM_ADMIN and FINANCE_OFFICER can write bank accounts
CREATE POLICY bank_accounts_write_policy ON bank_accounts
    FOR ALL
    USING (current_user_role() IN ('SYSTEM_ADMIN', 'FINANCE_OFFICER'));

-- Mobile money accounts: Users can read within their constituency
CREATE POLICY mobile_money_read_policy ON mobile_money_accounts
    FOR SELECT
    USING (
        constituency_id = ANY(current_user_constituencies())
        OR has_national_access()
    );

-- ============================================================================
-- SEED DATA: Default Notification Templates
-- ============================================================================

INSERT INTO notification_templates (
    template_code, template_name, subject_template, body_template, sms_template,
    supported_channels, default_channel, default_priority, is_critical
) VALUES
    -- Authentication
    (
        'USER_ACCOUNT_CREATED',
        'User Account Created',
        'Welcome to CDF Smart Hub',
        'Hello {{user_name}},\n\nYour account has been created successfully.\n\nEmail: {{email}}\nRole: {{role}}\n\nPlease login and change your password.',
        'Welcome to CDF Smart Hub! Your account is ready. Login: {{email}}',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'EMAIL',
        'HIGH',
        false
    ),
    (
        'PASSWORD_RESET',
        'Password Reset Request',
        'CDF Smart Hub - Password Reset',
        'Hello {{user_name}},\n\nA password reset was requested for your account.\n\nReset Code: {{reset_code}}\n\nThis code expires in 30 minutes.',
        'CDF Hub: Your password reset code is {{reset_code}}. Valid for 30 minutes.',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'EMAIL',
        'URGENT',
        true
    ),

    -- Project Workflow
    (
        'PROJECT_SUBMITTED',
        'Project Submitted for Review',
        'Project Submitted: {{project_title}}',
        'A new project has been submitted for CDFC review.\n\nProject: {{project_title}}\nWard: {{ward_name}}\nBudget: ZMW {{budget}}\n\nPlease review in the system.',
        'New project submitted: {{project_title}}. Budget: ZMW {{budget}}. Review required.',
        ARRAY['EMAIL', 'SMS', 'PUSH']::notification_channel[],
        'EMAIL',
        'HIGH',
        false
    ),
    (
        'PROJECT_APPROVED',
        'Project Approved',
        'Project Approved: {{project_title}}',
        'Congratulations! Your project has been approved.\n\nProject: {{project_title}}\nApproved Budget: ZMW {{approved_budget}}\nNext Steps: {{next_steps}}',
        'Project approved: {{project_title}}. Budget: ZMW {{approved_budget}}.',
        ARRAY['EMAIL', 'SMS', 'PUSH']::notification_channel[],
        'EMAIL',
        'HIGH',
        false
    ),
    (
        'PROJECT_REJECTED',
        'Project Rejected',
        'Project Rejected: {{project_title}}',
        'Your project has been rejected.\n\nProject: {{project_title}}\nReason: {{rejection_reason}}\n\nPlease revise and resubmit.',
        'Project rejected: {{project_title}}. Reason: {{rejection_reason}}',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'EMAIL',
        'MEDIUM',
        false
    ),

    -- Financial
    (
        'PAYMENT_PENDING_APPROVAL',
        'Payment Pending Approval',
        'Payment Approval Required: ZMW {{amount}}',
        'A payment voucher requires your approval.\n\nVoucher: {{voucher_number}}\nProject: {{project_title}}\nAmount: ZMW {{amount}}\nPanel: {{panel}}\n\nPlease review urgently.',
        'Payment approval needed: {{voucher_number}}, ZMW {{amount}}. Panel {{panel}}.',
        ARRAY['EMAIL', 'SMS', 'PUSH']::notification_channel[],
        'EMAIL',
        'URGENT',
        true
    ),
    (
        'PAYMENT_APPROVED',
        'Payment Approved',
        'Payment Approved: ZMW {{amount}}',
        'Payment has been approved.\n\nVoucher: {{voucher_number}}\nAmount: ZMW {{amount}}\nStatus: {{status}}',
        'Payment approved: {{voucher_number}}, ZMW {{amount}}.',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'EMAIL',
        'HIGH',
        false
    ),
    (
        'PAYMENT_EXECUTED',
        'Payment Executed',
        'Payment Completed: ZMW {{amount}}',
        'Payment has been successfully executed.\n\nVoucher: {{voucher_number}}\nAmount: ZMW {{amount}}\nReference: {{transaction_reference}}\nDate: {{payment_date}}',
        'Payment completed: ZMW {{amount}}. Ref: {{transaction_reference}}',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'EMAIL',
        'HIGH',
        false
    ),

    -- Audit & Compliance
    (
        'AUDIT_FINDING_ASSIGNED',
        'Audit Finding Assigned',
        'Audit Finding Requires Action',
        'An audit finding has been assigned to you.\n\nFinding: {{finding_title}}\nSeverity: {{severity}}\nDeadline: {{deadline}}\n\nPlease provide remediation plan.',
        'Audit finding assigned: {{finding_title}}. Severity: {{severity}}. Deadline: {{deadline}}',
        ARRAY['EMAIL', 'SMS', 'PUSH']::notification_channel[],
        'EMAIL',
        'URGENT',
        true
    ),

    -- Task Management
    (
        'TASK_ASSIGNED',
        'Task Assigned',
        'New Task: {{task_title}}',
        'A task has been assigned to you.\n\nTask: {{task_title}}\nPriority: {{priority}}\nDeadline: {{deadline}}\n\nAction URL: {{action_url}}',
        'Task assigned: {{task_title}}. Priority: {{priority}}. Due: {{deadline}}',
        ARRAY['EMAIL', 'SMS', 'PUSH', 'IN_APP']::notification_channel[],
        'IN_APP',
        'MEDIUM',
        false
    ),
    (
        'TASK_OVERDUE',
        'Task Overdue',
        'OVERDUE: {{task_title}}',
        'Your task is overdue.\n\nTask: {{task_title}}\nDeadline was: {{deadline}}\nDays overdue: {{days_overdue}}\n\nPlease complete urgently.',
        'OVERDUE: {{task_title}}. Was due {{deadline}}. Complete now!',
        ARRAY['EMAIL', 'SMS', 'PUSH']::notification_channel[],
        'SMS',
        'URGENT',
        true
    ),

    -- Bursary
    (
        'BURSARY_APPROVED',
        'Bursary Application Approved',
        'Bursary Approved: {{student_name}}',
        'Congratulations! The bursary application has been approved.\n\nStudent: {{student_name}}\nAmount: ZMW {{amount}}\nInstitution: {{institution}}\n\nPayment will be processed soon.',
        'Bursary approved for {{student_name}}: ZMW {{amount}}. Payment processing.',
        ARRAY['EMAIL', 'SMS']::notification_channel[],
        'SMS',
        'HIGH',
        false
    )
ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- SEED DATA: External Systems Registry
-- ============================================================================

INSERT INTO external_systems (
    system_code, system_name, system_category, description,
    base_url, is_active
) VALUES
    -- Banking
    (
        'ZANACO_API',
        'Zanaco Bank API',
        'BANKING',
        'Zanaco Bank payment and account inquiry API',
        'https://api.zanaco.co.zm/v1',
        true
    ),
    (
        'STANBIC_API',
        'Stanbic Bank API',
        'BANKING',
        'Stanbic Bank payment and account inquiry API',
        'https://api.stanbic.co.zm/v1',
        true
    ),

    -- Government Systems
    (
        'IFMIS',
        'Integrated Financial Management Information System',
        'GOVERNMENT',
        'Treasury financial management system for reconciliation',
        'https://ifmis.mof.gov.zm/api',
        true
    ),
    (
        'ZPPA',
        'Zambia Public Procurement Authority',
        'GOVERNMENT',
        'Contractor verification and procurement compliance',
        'https://api.zppa.org.zm',
        true
    ),

    -- Mobile Money
    (
        'AIRTEL_MONEY',
        'Airtel Money API',
        'MOBILE_MONEY',
        'Airtel Money payment disbursement',
        'https://openapiuat.airtel.africa',
        true
    ),
    (
        'MTN_MOMO',
        'MTN Mobile Money API',
        'MOBILE_MONEY',
        'MTN Mobile Money payment disbursement',
        'https://sandbox.momodeveloper.mtn.com',
        true
    ),

    -- Identity Verification
    (
        'NRC_VERIFICATION',
        'National Registration Card Verification',
        'IDENTITY',
        'Department of National Registration and Card - NRC verification',
        'https://nrc-api.gov.zm/v1',
        false  -- Not yet available
    ),

    -- Messaging
    (
        'AFRICASTALKING_SMS',
        'Africa\'s Talking SMS Gateway',
        'MESSAGING',
        'SMS delivery for Zambian mobile networks',
        'https://api.africastalking.com/version1',
        true
    )
ON CONFLICT (system_code) DO NOTHING;

COMMENT ON TABLE external_systems IS 'Registry of external systems for integration tracking and health monitoring';
