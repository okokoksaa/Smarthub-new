-- ============================================================================
-- CDF SMART HUB - DATABASE SCHEMA FOUNDATION
-- ============================================================================
-- Purpose: Enable required PostgreSQL extensions and create custom types
-- Compliance: Zero tolerance for data loss or corruption
-- Multi-Tenancy: Foundation for Row-Level Security (RLS)
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";        -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";         -- Encryption functions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gist";       -- Advanced indexing
CREATE EXTENSION IF NOT EXISTS "tablefunc";        -- Pivot tables for reporting

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User Roles (aligned with CDF Act organizational structure)
CREATE TYPE user_role AS ENUM (
    'SYSTEM_ADMIN',          -- Platform administrator
    'MINISTRY',              -- Ministry of Local Government
    'AUDITOR_GENERAL',       -- Office of the Auditor General
    'PLGO',                  -- Permanent Local Government Officer (Provincial/District)
    'CDFC_CHAIR',            -- CDF Committee Chairperson (MP)
    'CDFC_MEMBER',           -- CDF Committee Member
    'WDC_CHAIR',             -- Ward Development Committee Chairperson
    'WDC_MEMBER',            -- Ward Development Committee Member
    'TAC_MEMBER',            -- Technical Assessment Committee Member
    'FINANCE_OFFICER',       -- Constituency Finance Officer
    'PROCUREMENT_OFFICER',   -- Procurement Officer
    'M_AND_E_OFFICER',       -- Monitoring & Evaluation Officer
    'CONTRACTOR',            -- Registered contractor
    'SUPPLIER',              -- Registered supplier
    'CITIZEN'                -- Public citizen (read-only transparency portal)
);

-- Tenant Scope Levels
CREATE TYPE tenant_scope_level AS ENUM (
    'NATIONAL',
    'PROVINCIAL',
    'DISTRICT',
    'CONSTITUENCY',
    'WARD'
);

-- Project Status
CREATE TYPE project_status AS ENUM (
    'DRAFT',                 -- Being prepared by WDC
    'SUBMITTED',             -- Submitted to CDFC
    'UNDER_TAC_REVIEW',      -- Technical Assessment Committee review
    'TAC_APPROVED',          -- TAC approved, awaiting CDFC
    'TAC_REJECTED',          -- TAC rejected, needs revision
    'CDFC_APPROVED',         -- CDFC approved, ready for procurement
    'CDFC_REJECTED',         -- CDFC rejected
    'PROCUREMENT',           -- Procurement process ongoing
    'AWARDED',               -- Contract awarded
    'ACTIVE',                -- Project execution in progress
    'SUSPENDED',             -- Temporarily suspended
    'COMPLETED',             -- Project completed
    'CLOSED',                -- Formally closed with final reports
    'CANCELLED'              -- Cancelled
);

-- Project Category (aligned with CDF Act)
CREATE TYPE project_category AS ENUM (
    'INFRASTRUCTURE',        -- Roads, bridges, buildings
    'EDUCATION',             -- Schools, classrooms, libraries
    'HEALTH',                -- Health posts, clinics
    'WATER_SANITATION',      -- Boreholes, wells, toilets
    'AGRICULTURE',           -- Irrigation, storage facilities
    'SOCIAL_WELFARE',        -- Community centers
    'EMPOWERMENT',           -- Women/youth empowerment projects
    'BURSARY',               -- Educational bursaries
    'OTHER'                  -- Other approved categories
);

-- Financial Transaction Types
CREATE TYPE transaction_type AS ENUM (
    'BUDGET_ALLOCATION',     -- Annual budget allocation to constituency
    'DISBURSEMENT',          -- Payment to contractor/supplier
    'REFUND',                -- Refund to Treasury
    'ADJUSTMENT',            -- Budget adjustment/reallocation
    'RETENTION',             -- Retention money held
    'RETENTION_RELEASE'      -- Release of retention
);

-- Payment Status
CREATE TYPE payment_status AS ENUM (
    'PENDING_PANEL_A',       -- Awaiting Panel A approval (Planning)
    'PANEL_A_APPROVED',      -- Panel A approved
    'PENDING_PANEL_B',       -- Awaiting Panel B approval (Execution)
    'PANEL_B_APPROVED',      -- Panel B approved
    'PENDING_PAYMENT',       -- Approved, awaiting bank transfer
    'PAID',                  -- Payment executed
    'FAILED',                -- Payment failed
    'CANCELLED',             -- Payment cancelled
    'RECONCILED'             -- Reconciled with bank statement
);

-- Approval Panel Types
CREATE TYPE approval_panel AS ENUM (
    'PANEL_A',               -- Planning approval panel
    'PANEL_B'                -- Execution approval panel
);

-- Document Types
CREATE TYPE document_type AS ENUM (
    'PROJECT_PROPOSAL',
    'TECHNICAL_ASSESSMENT',
    'CDFC_RESOLUTION',
    'PROCUREMENT_DOCUMENT',
    'CONTRACT',
    'INVOICE',
    'PAYMENT_VOUCHER',
    'PROGRESS_REPORT',
    'COMPLETION_CERTIFICATE',
    'AUDIT_REPORT',
    'FINANCIAL_STATEMENT',
    'MEETING_MINUTES',
    'BENEFICIARY_LIST',
    'NRC_COPY',              -- National Registration Card
    'BANK_STATEMENT',
    'OTHER'
);

-- Workflow Task Types
CREATE TYPE task_type AS ENUM (
    'APPROVAL',              -- Requires approval decision
    'REVIEW',                -- Requires review and feedback
    'SIGNATURE',             -- Requires digital signature
    'COMPLIANCE_CHECK',      -- Automated compliance verification
    'DOCUMENT_UPLOAD',       -- Document submission required
    'PAYMENT_AUTHORIZATION', -- Payment authorization required
    'FIELD_VERIFICATION'     -- On-site verification required
);

-- Task Priority
CREATE TYPE task_priority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);

-- Task Status
CREATE TYPE task_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'OVERDUE',
    'ESCALATED',
    'CANCELLED'
);

-- Notification Channels
CREATE TYPE notification_channel AS ENUM (
    'EMAIL',
    'SMS',
    'PUSH',
    'WHATSAPP',
    'IN_APP'
);

-- Notification Status
CREATE TYPE notification_status AS ENUM (
    'PENDING',
    'SENT',
    'DELIVERED',
    'FAILED',
    'READ'
);

-- Audit Event Types
CREATE TYPE audit_event_type AS ENUM (
    'USER_LOGIN',
    'USER_LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_STATUS_CHANGED',
    'PAYMENT_INITIATED',
    'PAYMENT_APPROVED',
    'PAYMENT_EXECUTED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_ACCESSED',
    'APPROVAL_GRANTED',
    'APPROVAL_DENIED',
    'WORKFLOW_STARTED',
    'WORKFLOW_COMPLETED',
    'COMPLIANCE_VIOLATION',
    'AI_INFERENCE',
    'AI_OVERRIDE',
    'DATA_EXPORT',
    'SYSTEM_CONFIGURATION_CHANGED',
    'SECURITY_EVENT'
);

-- AI Service Types
CREATE TYPE ai_service_type AS ENUM (
    'DOCUMENT_INTELLIGENCE',
    'ANOMALY_DETECTION',
    'RISK_SCORING',
    'PREDICTIVE_ANALYTICS',
    'COMPLIANCE_VERIFICATION',
    'CONFLICT_DETECTION'
);

-- AI Confidence Levels
CREATE TYPE ai_confidence_level AS ENUM (
    'HIGH',
    'MEDIUM',
    'LOW'
);

-- Procurement Methods (aligned with ZPPA)
CREATE TYPE procurement_method AS ENUM (
    'OPEN_BIDDING',
    'RESTRICTED_BIDDING',
    'REQUEST_FOR_QUOTATION',
    'DIRECT_PROCUREMENT',
    'EMERGENCY_PROCUREMENT'
);

-- Contract Status
CREATE TYPE contract_status AS ENUM (
    'DRAFT',
    'PENDING_SIGNATURE',
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'COMPLETED',
    'EXPIRED'
);

-- Bursary Award Status
CREATE TYPE bursary_status AS ENUM (
    'APPLICATION_RECEIVED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'APPROVED',
    'REJECTED',
    'PAID',
    'CANCELLED'
);

-- Gender (for demographic tracking)
CREATE TYPE gender AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);

-- Empowerment Program Types
CREATE TYPE empowerment_program_type AS ENUM (
    'WOMEN_EMPOWERMENT',
    'YOUTH_EMPOWERMENT',
    'PWD_SUPPORT',           -- Persons with Disabilities
    'ELDERLY_SUPPORT',
    'AGRICULTURE_SUPPORT',
    'BUSINESS_GRANT',
    'SKILLS_TRAINING',
    'OTHER'
);

-- ============================================================================
-- CUSTOM FUNCTIONS
-- ============================================================================

-- Function to get current user's ID (used in RLS policies)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true)::user_role;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get current user's constituency IDs
CREATE OR REPLACE FUNCTION current_user_constituencies()
RETURNS UUID[] AS $$
BEGIN
    RETURN string_to_array(current_setting('app.current_user_constituencies', true), ',')::UUID[];
EXCEPTION
    WHEN OTHERS THEN
        RETURN ARRAY[]::UUID[];
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user has national-level access
CREATE OR REPLACE FUNCTION has_national_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() IN ('SYSTEM_ADMIN', 'MINISTRY', 'AUDITOR_GENERAL');
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to generate audit log hash
CREATE OR REPLACE FUNCTION calculate_audit_hash(
    p_previous_hash TEXT,
    p_event_data JSONB,
    p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            p_previous_hash || p_event_data::TEXT || p_timestamp::TEXT,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation for primary keys';
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions for hashing and encryption';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for fuzzy text search';

COMMENT ON TYPE user_role IS 'User roles aligned with CDF Act organizational structure';
COMMENT ON TYPE project_status IS 'Project lifecycle states from intake to closure';
COMMENT ON TYPE audit_event_type IS 'Comprehensive audit event types for compliance';
COMMENT ON TYPE ai_service_type IS 'AI assistive services (advisory only, read-only)';

COMMENT ON FUNCTION current_user_id() IS 'Returns current authenticated user ID for RLS policies';
COMMENT ON FUNCTION current_user_role() IS 'Returns current user role for authorization checks';
COMMENT ON FUNCTION has_national_access() IS 'Checks if user has national-level visibility';
COMMENT ON FUNCTION calculate_audit_hash() IS 'Generates SHA-256 hash for audit log chain';
