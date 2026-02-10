-- ============================================================================
-- CDF SMART HUB - USER MANAGEMENT & RBAC SCHEMA
-- ============================================================================
-- Purpose: User authentication, role-based access control, and tenant scoping
-- Security: Multi-factor authentication, session management, audit logging
-- Compliance: Mandatory separation of duties, audit trail for all access
-- ============================================================================

-- ============================================================================
-- USERS
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),                -- For SMS MFA
    password_hash VARCHAR(255) NOT NULL,     -- bcrypt hash
    salt VARCHAR(255) NOT NULL,              -- Unique salt per user

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    national_id_number VARCHAR(20),          -- NRC number
    date_of_birth DATE,
    gender gender,

    -- Role & Permissions
    role user_role NOT NULL,
    tenant_scope_level tenant_scope_level NOT NULL,

    -- Multi-Factor Authentication
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),                 -- TOTP secret
    mfa_backup_codes TEXT[],                 -- Encrypted backup codes

    -- Account Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_reason TEXT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMP WITH TIME ZONE,

    -- Session Management
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    current_session_id UUID,

    -- Password Management
    password_expires_at TIMESTAMP WITH TIME ZONE,
    password_last_changed_at TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,

    -- Profile
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Africa/Lusaka',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE,     -- Soft delete
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0),
    CONSTRAINT chk_password_changed CHECK (password_last_changed_at <= NOW())
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_national_id ON users(national_id_number) WHERE national_id_number IS NOT NULL;

COMMENT ON TABLE users IS 'System users with authentication and RBAC';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password (never store plaintext)';
COMMENT ON COLUMN users.mfa_enabled IS 'Mandatory for financial operations users';
COMMENT ON COLUMN users.failed_login_attempts IS 'Account locked after 5 failed attempts';

-- ============================================================================
-- USER TENANT ASSIGNMENTS
-- ============================================================================
-- Defines which administrative units a user can access
CREATE TABLE user_tenant_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tenant Scope (one of these will be populated based on user's scope level)
    province_id UUID REFERENCES provinces(id),
    district_id UUID REFERENCES districts(id),
    constituency_id UUID REFERENCES constituencies(id),
    ward_id UUID REFERENCES wards(id),

    -- Assignment metadata
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,     -- Optional expiration
    is_primary BOOLEAN NOT NULL DEFAULT false, -- Primary assignment for user

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints: Exactly one tenant level must be assigned
    CONSTRAINT chk_one_tenant_level CHECK (
        (province_id IS NOT NULL)::INTEGER +
        (district_id IS NOT NULL)::INTEGER +
        (constituency_id IS NOT NULL)::INTEGER +
        (ward_id IS NOT NULL)::INTEGER = 1
    )
);

CREATE INDEX idx_user_tenants_user ON user_tenant_assignments(user_id);
CREATE INDEX idx_user_tenants_province ON user_tenant_assignments(province_id) WHERE province_id IS NOT NULL;
CREATE INDEX idx_user_tenants_district ON user_tenant_assignments(district_id) WHERE district_id IS NOT NULL;
CREATE INDEX idx_user_tenants_constituency ON user_tenant_assignments(constituency_id) WHERE constituency_id IS NOT NULL;
CREATE INDEX idx_user_tenants_ward ON user_tenant_assignments(ward_id) WHERE ward_id IS NOT NULL;
CREATE INDEX idx_user_tenants_primary ON user_tenant_assignments(user_id, is_primary) WHERE is_primary = true;

COMMENT ON TABLE user_tenant_assignments IS 'Maps users to their authorized administrative scopes';
COMMENT ON CONSTRAINT chk_one_tenant_level ON user_tenant_assignments IS 'Enforces exactly one tenant level per assignment';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Granular permissions for fine-grained access control
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,       -- e.g., 'project.create', 'payment.approve'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),                    -- e.g., 'PROJECT', 'FINANCE', 'USER'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_category ON permissions(category);

COMMENT ON TABLE permissions IS 'Granular permissions for RBAC';

-- ============================================================================
-- ROLE PERMISSIONS
-- ============================================================================
-- Maps permissions to roles
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE(role, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Maps permissions to user roles';

-- ============================================================================
-- USER SESSIONS
-- ============================================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session Details
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed JWT token
    refresh_token_hash VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),

    -- Timing
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,       -- Session logout/expiration

    -- Session State
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT chk_session_timing CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS 'Active user sessions for JWT token management';
COMMENT ON COLUMN user_sessions.token_hash IS 'SHA-256 hash of JWT token for revocation';

-- ============================================================================
-- LOGIN AUDIT LOG
-- ============================================================================
CREATE TABLE login_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),       -- NULL if login failed
    email VARCHAR(255) NOT NULL,             -- Always capture attempted email

    -- Login Attempt Details
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),             -- e.g., 'Invalid password', 'Account locked'
    mfa_used BOOLEAN NOT NULL DEFAULT false,
    mfa_method VARCHAR(50),                  -- e.g., 'TOTP', 'SMS'

    -- Context
    ip_address INET NOT NULL,
    user_agent TEXT,
    location_country VARCHAR(2),             -- ISO country code
    location_city VARCHAR(100),

    -- Timing
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Security Flags
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    risk_score INTEGER,                      -- 0-100 (AI-calculated)
    risk_factors TEXT[]                      -- e.g., ['unusual_location', 'unusual_time']
);

CREATE INDEX idx_login_audit_user ON login_audit_log(user_id);
CREATE INDEX idx_login_audit_email ON login_audit_log(email);
CREATE INDEX idx_login_audit_timestamp ON login_audit_log(attempted_at DESC);
CREATE INDEX idx_login_audit_failed ON login_audit_log(attempted_at DESC) WHERE success = false;
CREATE INDEX idx_login_audit_suspicious ON login_audit_log(attempted_at DESC) WHERE is_suspicious = true;

COMMENT ON TABLE login_audit_log IS 'Immutable log of all login attempts (successful and failed)';
COMMENT ON COLUMN login_audit_log.risk_score IS 'AI-calculated risk score for anomaly detection';

-- ============================================================================
-- PASSWORD HISTORY
-- ============================================================================
-- Prevents password reuse
CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);

COMMENT ON TABLE password_history IS 'Password history to prevent reuse of last 5 passwords';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_tenants_updated_at
    BEFORE UPDATE ON user_tenant_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-lock account after 5 failed login attempts
CREATE OR REPLACE FUNCTION auto_lock_account()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.failed_login_attempts >= 5 AND NOT OLD.is_locked THEN
        NEW.is_locked = true;
        NEW.locked_at = NOW();
        NEW.locked_reason = 'Automatic lock after 5 failed login attempts';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_auto_lock
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.failed_login_attempts <> OLD.failed_login_attempts)
    EXECUTE FUNCTION auto_lock_account();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY users_read_own ON users
    FOR SELECT
    USING (id = current_user_id() OR has_national_access());

-- Users with SYSTEM_ADMIN, MINISTRY can read all users
CREATE POLICY users_read_all ON users
    FOR SELECT
    USING (
        current_user_role() IN ('SYSTEM_ADMIN', 'MINISTRY', 'PLGO')
    );

-- Only SYSTEM_ADMIN can create/update/delete users
CREATE POLICY users_write_policy ON users
    FOR ALL
    USING (current_user_role() IN ('SYSTEM_ADMIN', 'MINISTRY'));

-- Users can read their own tenant assignments
CREATE POLICY user_tenants_read_own ON user_tenant_assignments
    FOR SELECT
    USING (user_id = current_user_id() OR has_national_access());

-- Users can read their own sessions
CREATE POLICY user_sessions_read_own ON user_sessions
    FOR SELECT
    USING (user_id = current_user_id());

-- ============================================================================
-- SEED DATA: Default Permissions
-- ============================================================================

INSERT INTO permissions (code, name, description, category) VALUES
    -- Project Permissions
    ('project.view', 'View Projects', 'View project details', 'PROJECT'),
    ('project.create', 'Create Projects', 'Create new projects', 'PROJECT'),
    ('project.update', 'Update Projects', 'Update project information', 'PROJECT'),
    ('project.delete', 'Delete Projects', 'Delete projects', 'PROJECT'),
    ('project.approve', 'Approve Projects', 'Approve projects (CDFC)', 'PROJECT'),
    ('project.submit', 'Submit Projects', 'Submit projects for approval', 'PROJECT'),

    -- Financial Permissions
    ('finance.view', 'View Financial Records', 'View financial transactions', 'FINANCE'),
    ('finance.create_payment', 'Create Payments', 'Initiate payment requests', 'FINANCE'),
    ('finance.approve_panel_a', 'Approve Panel A', 'Approve payments (Panel A)', 'FINANCE'),
    ('finance.approve_panel_b', 'Approve Panel B', 'Approve payments (Panel B)', 'FINANCE'),
    ('finance.execute_payment', 'Execute Payments', 'Execute approved payments', 'FINANCE'),
    ('finance.reconcile', 'Reconcile Accounts', 'Perform account reconciliation', 'FINANCE'),

    -- User Management Permissions
    ('user.view', 'View Users', 'View user accounts', 'USER'),
    ('user.create', 'Create Users', 'Create new user accounts', 'USER'),
    ('user.update', 'Update Users', 'Update user information', 'USER'),
    ('user.delete', 'Delete Users', 'Delete user accounts', 'USER'),
    ('user.assign_role', 'Assign Roles', 'Assign roles to users', 'USER'),

    -- Document Permissions
    ('document.view', 'View Documents', 'View documents', 'DOCUMENT'),
    ('document.upload', 'Upload Documents', 'Upload new documents', 'DOCUMENT'),
    ('document.delete', 'Delete Documents', 'Delete documents', 'DOCUMENT'),
    ('document.sign', 'Sign Documents', 'Digitally sign documents', 'DOCUMENT'),

    -- Audit Permissions
    ('audit.view', 'View Audit Logs', 'View audit trail', 'AUDIT'),
    ('audit.export', 'Export Audit Logs', 'Export audit data', 'AUDIT'),

    -- Reporting Permissions
    ('report.view', 'View Reports', 'View generated reports', 'REPORTING'),
    ('report.export', 'Export Reports', 'Export reports', 'REPORTING'),
    ('report.create', 'Create Reports', 'Create custom reports', 'REPORTING'),

    -- System Administration
    ('system.configure', 'Configure System', 'Modify system configuration', 'SYSTEM'),
    ('system.backup', 'Backup System', 'Perform system backups', 'SYSTEM'),
    ('system.monitor', 'Monitor System', 'View system health and metrics', 'SYSTEM')
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE permissions IS 'Granular permissions for fine-grained access control';
