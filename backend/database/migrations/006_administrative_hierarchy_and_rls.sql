-- =====================================================
-- 006: Administrative Hierarchy and Row-Level Security
-- =====================================================
-- Implements Province → District → Constituency → Ward hierarchy
-- with role-based access control for WDC, MP, CDFC, etc.
--
-- Access Rules:
-- - WDC Member: Access only to their assigned ward
-- - MP: Access to all wards in their constituency
-- - CDFC Member: Access to their constituency
-- - District Officer: Access to all constituencies in their district
-- - Provincial Officer: Access to all districts in their province
-- - National Officers: Access to all data
-- =====================================================

-- =====================================================
-- 1. PROVINCES
-- =====================================================

CREATE TABLE IF NOT EXISTS provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_provinces_code ON provinces(code);
CREATE INDEX idx_provinces_name ON provinces(name);

-- =====================================================
-- 2. DISTRICTS
-- =====================================================

CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(province_id, name)
);

CREATE INDEX idx_districts_province ON districts(province_id);
CREATE INDEX idx_districts_code ON districts(code);
CREATE INDEX idx_districts_name ON districts(name);

-- =====================================================
-- 3. CONSTITUENCIES
-- =====================================================

CREATE TABLE IF NOT EXISTS constituencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    mp_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    population INTEGER,
    area_sq_km DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(district_id, name)
);

CREATE INDEX idx_constituencies_district ON constituencies(district_id);
CREATE INDEX idx_constituencies_province ON constituencies(province_id);
CREATE INDEX idx_constituencies_code ON constituencies(code);
CREATE INDEX idx_constituencies_mp ON constituencies(mp_user_id);
CREATE INDEX idx_constituencies_name ON constituencies(name);

-- =====================================================
-- 4. WARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    wdc_chairperson_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    population INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(constituency_id, name)
);

CREATE INDEX idx_wards_constituency ON wards(constituency_id);
CREATE INDEX idx_wards_district ON wards(district_id);
CREATE INDEX idx_wards_province ON wards(province_id);
CREATE INDEX idx_wards_code ON wards(code);
CREATE INDEX idx_wards_wdc_chairperson ON wards(wdc_chairperson_user_id);
CREATE INDEX idx_wards_name ON wards(name);

-- =====================================================
-- 5. USER SCOPE ASSIGNMENTS
-- =====================================================

-- Link users to their administrative scope
CREATE TABLE IF NOT EXISTS user_administrative_scope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
    district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
    constituency_id UUID REFERENCES constituencies(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES wards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_user_scope_user ON user_administrative_scope(user_id);
CREATE INDEX idx_user_scope_province ON user_administrative_scope(province_id);
CREATE INDEX idx_user_scope_district ON user_administrative_scope(district_id);
CREATE INDEX idx_user_scope_constituency ON user_administrative_scope(constituency_id);
CREATE INDEX idx_user_scope_ward ON user_administrative_scope(ward_id);

-- =====================================================
-- 6. ROW-LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all administrative tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_administrative_scope ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6.1 PROVINCES RLS
-- =====================================================

-- National officers can see all provinces
CREATE POLICY provinces_national_access ON provinces
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
    );

-- Provincial officers can see their province
CREATE POLICY provinces_provincial_access ON provinces
    FOR ALL
    USING (
        id = (
            SELECT province_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- =====================================================
-- 6.2 DISTRICTS RLS
-- =====================================================

-- National officers can see all districts
CREATE POLICY districts_national_access ON districts
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
    );

-- Provincial officers can see districts in their province
CREATE POLICY districts_provincial_access ON districts
    FOR ALL
    USING (
        province_id = (
            SELECT province_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- District officers can see their district
CREATE POLICY districts_district_access ON districts
    FOR ALL
    USING (
        id = (
            SELECT district_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- =====================================================
-- 6.3 CONSTITUENCIES RLS
-- =====================================================

-- National officers can see all constituencies
CREATE POLICY constituencies_national_access ON constituencies
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
    );

-- Provincial officers can see constituencies in their province
CREATE POLICY constituencies_provincial_access ON constituencies
    FOR ALL
    USING (
        province_id = (
            SELECT province_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- District officers can see constituencies in their district
CREATE POLICY constituencies_district_access ON constituencies
    FOR ALL
    USING (
        district_id = (
            SELECT district_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- MP and CDFC can see their constituency
CREATE POLICY constituencies_constituency_access ON constituencies
    FOR ALL
    USING (
        id = (
            SELECT constituency_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) IN ('MP', 'CDFC_MEMBER')
    );

-- =====================================================
-- 6.4 WARDS RLS
-- =====================================================

-- National officers can see all wards
CREATE POLICY wards_national_access ON wards
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
    );

-- Provincial officers can see wards in their province
CREATE POLICY wards_provincial_access ON wards
    FOR ALL
    USING (
        province_id = (
            SELECT province_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- District officers can see wards in their district
CREATE POLICY wards_district_access ON wards
    FOR ALL
    USING (
        district_id = (
            SELECT district_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
    );

-- MP and CDFC can see all wards in their constituency
CREATE POLICY wards_constituency_access ON wards
    FOR ALL
    USING (
        constituency_id = (
            SELECT constituency_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) IN ('MP', 'CDFC_MEMBER', 'LOCAL_AUTHORITY_OFFICIAL')
    );

-- WDC member can see only their ward
CREATE POLICY wards_ward_access ON wards
    FOR ALL
    USING (
        id = (
            SELECT ward_id
            FROM user_administrative_scope
            WHERE user_id = current_setting('app.current_user_id', true)::UUID
        )
        AND current_setting('app.current_user_role', true) = 'WDC_MEMBER'
    );

-- =====================================================
-- 6.5 USER ADMINISTRATIVE SCOPE RLS
-- =====================================================

-- Users can see their own scope
CREATE POLICY user_scope_own_access ON user_administrative_scope
    FOR ALL
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
    );

-- Admins can see all scopes
CREATE POLICY user_scope_admin_access ON user_administrative_scope
    FOR ALL
    USING (
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN'
        )
    );

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's accessible province IDs
CREATE OR REPLACE FUNCTION get_user_accessible_provinces(user_id_param UUID, user_role_param VARCHAR)
RETURNS TABLE(province_id UUID) AS $$
BEGIN
    IF user_role_param IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
                           'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT') THEN
        -- National officers see all provinces
        RETURN QUERY SELECT p.id FROM provinces p WHERE p.is_active = true;
    ELSE
        -- Return user's assigned province
        RETURN QUERY
        SELECT uas.province_id
        FROM user_administrative_scope uas
        WHERE uas.user_id = user_id_param AND uas.province_id IS NOT NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible district IDs
CREATE OR REPLACE FUNCTION get_user_accessible_districts(user_id_param UUID, user_role_param VARCHAR)
RETURNS TABLE(district_id UUID) AS $$
BEGIN
    IF user_role_param IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
                           'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT') THEN
        -- National officers see all districts
        RETURN QUERY SELECT d.id FROM districts d WHERE d.is_active = true;
    ELSE
        -- Return districts based on user's scope
        RETURN QUERY
        SELECT d.id
        FROM districts d
        INNER JOIN user_administrative_scope uas ON (
            (uas.district_id = d.id) OR
            (uas.province_id = d.province_id AND uas.district_id IS NULL)
        )
        WHERE uas.user_id = user_id_param AND d.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible constituency IDs
CREATE OR REPLACE FUNCTION get_user_accessible_constituencies(user_id_param UUID, user_role_param VARCHAR)
RETURNS TABLE(constituency_id UUID) AS $$
BEGIN
    IF user_role_param IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
                           'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT') THEN
        -- National officers see all constituencies
        RETURN QUERY SELECT c.id FROM constituencies c WHERE c.is_active = true;
    ELSE
        -- Return constituencies based on user's scope
        RETURN QUERY
        SELECT c.id
        FROM constituencies c
        INNER JOIN user_administrative_scope uas ON (
            (uas.constituency_id = c.id) OR
            (uas.district_id = c.district_id AND uas.constituency_id IS NULL) OR
            (uas.province_id = c.province_id AND uas.district_id IS NULL AND uas.constituency_id IS NULL)
        )
        WHERE uas.user_id = user_id_param AND c.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible ward IDs
CREATE OR REPLACE FUNCTION get_user_accessible_wards(user_id_param UUID, user_role_param VARCHAR)
RETURNS TABLE(ward_id UUID) AS $$
BEGIN
    IF user_role_param IN ('SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
                           'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT') THEN
        -- National officers see all wards
        RETURN QUERY SELECT w.id FROM wards w WHERE w.is_active = true;
    ELSIF user_role_param = 'WDC_MEMBER' THEN
        -- WDC member sees only their ward
        RETURN QUERY
        SELECT uas.ward_id
        FROM user_administrative_scope uas
        WHERE uas.user_id = user_id_param AND uas.ward_id IS NOT NULL;
    ELSE
        -- Others see wards based on hierarchical scope
        RETURN QUERY
        SELECT w.id
        FROM wards w
        INNER JOIN user_administrative_scope uas ON (
            (uas.ward_id = w.id) OR
            (uas.constituency_id = w.constituency_id AND uas.ward_id IS NULL) OR
            (uas.district_id = w.district_id AND uas.constituency_id IS NULL AND uas.ward_id IS NULL) OR
            (uas.province_id = w.province_id AND uas.district_id IS NULL AND uas.constituency_id IS NULL AND uas.ward_id IS NULL)
        )
        WHERE uas.user_id = user_id_param AND w.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access ward
CREATE OR REPLACE FUNCTION can_user_access_ward(user_id_param UUID, user_role_param VARCHAR, ward_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM get_user_accessible_wards(user_id_param, user_role_param)
        WHERE ward_id = ward_id_param
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access constituency
CREATE OR REPLACE FUNCTION can_user_access_constituency(user_id_param UUID, user_role_param VARCHAR, constituency_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM get_user_accessible_constituencies(user_id_param, user_role_param)
        WHERE constituency_id = constituency_id_param
    ) INTO has_access;

    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. UPDATE EXISTING TABLES TO USE HIERARCHICAL ACCESS
-- =====================================================

-- Add administrative hierarchy columns to projects table
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES provinces(id),
    ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id),
    ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id);

CREATE INDEX IF NOT EXISTS idx_projects_province ON projects(province_id);
CREATE INDEX IF NOT EXISTS idx_projects_district ON projects(district_id);
CREATE INDEX IF NOT EXISTS idx_projects_ward ON projects(ward_id);

-- Add administrative hierarchy columns to budget_allocations table
ALTER TABLE budget_allocations
    ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES provinces(id),
    ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id),
    ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id);

CREATE INDEX IF NOT EXISTS idx_budget_province ON budget_allocations(province_id);
CREATE INDEX IF NOT EXISTS idx_budget_district ON budget_allocations(district_id);
CREATE INDEX IF NOT EXISTS idx_budget_ward ON budget_allocations(ward_id);

-- Update projects RLS to use hierarchical access
DROP POLICY IF EXISTS projects_constituency_access ON projects;

CREATE POLICY projects_hierarchical_access ON projects
    FOR ALL
    USING (
        -- National officers see all
        current_setting('app.current_user_role', true) IN (
            'SUPER_ADMIN', 'SYSTEM_ADMIN', 'MINISTRY_OFFICIAL',
            'NATIONAL_TREASURY', 'AUDITOR_GENERAL', 'PARLIAMENT_OVERSIGHT'
        )
        OR
        -- MP sees projects in their constituency
        (constituency_id IN (
            SELECT * FROM get_user_accessible_constituencies(
                current_setting('app.current_user_id', true)::UUID,
                current_setting('app.current_user_role', true)
            )
        ) AND current_setting('app.current_user_role', true) IN ('MP', 'CDFC_MEMBER'))
        OR
        -- WDC member sees projects in their ward only
        (ward_id IN (
            SELECT * FROM get_user_accessible_wards(
                current_setting('app.current_user_id', true)::UUID,
                current_setting('app.current_user_role', true)
            )
        ) AND current_setting('app.current_user_role', true) = 'WDC_MEMBER')
        OR
        -- District/Provincial officers see based on hierarchy
        (district_id IN (
            SELECT * FROM get_user_accessible_districts(
                current_setting('app.current_user_id', true)::UUID,
                current_setting('app.current_user_role', true)
            )
        ))
        OR
        (province_id IN (
            SELECT * FROM get_user_accessible_provinces(
                current_setting('app.current_user_id', true)::UUID,
                current_setting('app.current_user_role', true)
            )
        ))
    );

-- =====================================================
-- 9. AUDIT TRAIL
-- =====================================================

-- Trigger for provinces
CREATE TRIGGER provinces_updated_at
    BEFORE UPDATE ON provinces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for districts
CREATE TRIGGER districts_updated_at
    BEFORE UPDATE ON districts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for constituencies
CREATE TRIGGER constituencies_updated_at
    BEFORE UPDATE ON constituencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for wards
CREATE TRIGGER wards_updated_at
    BEFORE UPDATE ON wards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_administrative_scope
CREATE TRIGGER user_scope_updated_at
    BEFORE UPDATE ON user_administrative_scope
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE provinces IS 'Provincial administrative divisions (9 provinces in Zambia)';
COMMENT ON TABLE districts IS 'District administrative divisions within provinces';
COMMENT ON TABLE constituencies IS 'Parliamentary constituencies (156 total) within districts';
COMMENT ON TABLE wards IS 'Electoral wards within constituencies';
COMMENT ON TABLE user_administrative_scope IS 'Links users to their administrative scope for RLS';

COMMENT ON FUNCTION get_user_accessible_wards IS 'Returns ward IDs accessible to user based on role and assignment';
COMMENT ON FUNCTION can_user_access_ward IS 'Checks if user can access specific ward';
COMMENT ON FUNCTION can_user_access_constituency IS 'Checks if user can access specific constituency';
