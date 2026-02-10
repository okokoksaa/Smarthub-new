-- ============================================================================
-- CDF SMART HUB - TENANT HIERARCHY SCHEMA
-- ============================================================================
-- Purpose: Define the five-tier administrative hierarchy for multi-tenancy
-- Hierarchy: National → Provincial → District → Constituency → Ward
-- Compliance: Immutable administrative boundaries aligned with Zambia's structure
-- ============================================================================

-- ============================================================================
-- PROVINCES (10 provinces in Zambia)
-- ============================================================================
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,        -- e.g., 'LSK' for Lusaka
    name VARCHAR(100) NOT NULL UNIQUE,       -- e.g., 'Lusaka Province'
    capital VARCHAR(100),                    -- Provincial capital
    population INTEGER,                      -- Latest census data
    area_sqkm NUMERIC(10, 2),               -- Area in square kilometers

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,                         -- User who created record
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit
    version INTEGER NOT NULL DEFAULT 1       -- Optimistic locking
);

CREATE INDEX idx_provinces_code ON provinces(code);
CREATE INDEX idx_provinces_active ON provinces(is_active) WHERE is_active = true;

COMMENT ON TABLE provinces IS 'Zambia provinces (10 total) - top of administrative hierarchy';
COMMENT ON COLUMN provinces.code IS 'Unique province code (immutable)';
COMMENT ON COLUMN provinces.version IS 'Version number for optimistic locking';

-- ============================================================================
-- DISTRICTS (116 districts in Zambia)
-- ============================================================================
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    code VARCHAR(10) NOT NULL UNIQUE,        -- e.g., 'LSK-D01'
    name VARCHAR(100) NOT NULL,              -- e.g., 'Lusaka District'
    headquarters VARCHAR(100),               -- District headquarters location
    population INTEGER,
    area_sqkm NUMERIC(10, 2),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    UNIQUE(province_id, name)
);

CREATE INDEX idx_districts_province ON districts(province_id);
CREATE INDEX idx_districts_code ON districts(code);
CREATE INDEX idx_districts_active ON districts(is_active) WHERE is_active = true;

COMMENT ON TABLE districts IS 'Zambia districts (116 total) - second tier of hierarchy';

-- ============================================================================
-- CONSTITUENCIES (156 constituencies in Zambia)
-- ============================================================================
-- This is the PRIMARY TENANT level for CDF operations
CREATE TABLE constituencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL UNIQUE,        -- e.g., 'KABW' for Kabwata
    name VARCHAR(100) NOT NULL,              -- e.g., 'Kabwata Constituency'

    -- Member of Parliament (MP) - CDFC Chairperson
    current_mp_name VARCHAR(200),
    current_mp_party VARCHAR(100),
    current_mp_elected_date DATE,

    -- Financial
    annual_cdf_allocation NUMERIC(15, 2),    -- Annual CDF allocation in ZMW
    current_year_allocation NUMERIC(15, 2),  -- Current fiscal year allocation

    -- Demographics
    registered_voters INTEGER,
    population INTEGER,
    area_sqkm NUMERIC(10, 2),

    -- Banking details for CDF account
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_branch VARCHAR(100),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(district_id, name)
);

CREATE INDEX idx_constituencies_district ON constituencies(district_id);
CREATE INDEX idx_constituencies_code ON constituencies(code);
CREATE INDEX idx_constituencies_active ON constituencies(is_active) WHERE is_active = true;
CREATE INDEX idx_constituencies_mp ON constituencies(current_mp_name);

COMMENT ON TABLE constituencies IS '156 constituencies - PRIMARY TENANT LEVEL for CDF';
COMMENT ON COLUMN constituencies.annual_cdf_allocation IS 'Standard annual CDF allocation per constituency';
COMMENT ON COLUMN constituencies.current_mp_name IS 'Current Member of Parliament (CDFC Chairperson)';

-- ============================================================================
-- WARDS (624+ wards in Zambia)
-- ============================================================================
-- Finest level of granularity - where projects originate
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL UNIQUE,        -- e.g., 'KABW-W01'
    name VARCHAR(100) NOT NULL,              -- e.g., 'Libala Ward'

    -- Ward Councillor (WDC Chairperson)
    current_councillor_name VARCHAR(200),
    current_councillor_party VARCHAR(100),
    current_councillor_elected_date DATE,

    -- Demographics
    population INTEGER,
    households INTEGER,
    area_sqkm NUMERIC(10, 2),

    -- Geographic coordinates (for mapping)
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geojson_boundary JSONB,                  -- GeoJSON polygon for ward boundaries

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,

    UNIQUE(constituency_id, name)
);

CREATE INDEX idx_wards_constituency ON wards(constituency_id);
CREATE INDEX idx_wards_code ON wards(code);
CREATE INDEX idx_wards_active ON wards(is_active) WHERE is_active = true;
CREATE INDEX idx_wards_councillor ON wards(current_councillor_name);
CREATE INDEX idx_wards_location ON wards USING gist(
    ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE wards IS '624+ wards - finest granularity level, where projects originate';
COMMENT ON COLUMN wards.geojson_boundary IS 'GeoJSON polygon defining ward geographic boundaries';
COMMENT ON COLUMN wards.current_councillor_name IS 'Ward Councillor (typically WDC Chairperson)';

-- ============================================================================
-- MATERIALIZED VIEW: Complete Hierarchy Path
-- ============================================================================
-- Provides quick lookup of full administrative path for any ward
CREATE MATERIALIZED VIEW vw_administrative_hierarchy AS
SELECT
    w.id AS ward_id,
    w.code AS ward_code,
    w.name AS ward_name,
    c.id AS constituency_id,
    c.code AS constituency_code,
    c.name AS constituency_name,
    d.id AS district_id,
    d.code AS district_code,
    d.name AS district_name,
    p.id AS province_id,
    p.code AS province_code,
    p.name AS province_name,
    -- Full path for display
    p.name || ' > ' || d.name || ' > ' || c.name || ' > ' || w.name AS full_path
FROM wards w
JOIN constituencies c ON w.constituency_id = c.id
JOIN districts d ON c.district_id = d.id
JOIN provinces p ON d.province_id = p.id
WHERE w.is_active AND c.is_active AND d.is_active AND p.is_active;

CREATE UNIQUE INDEX idx_vw_hierarchy_ward ON vw_administrative_hierarchy(ward_id);
CREATE INDEX idx_vw_hierarchy_constituency ON vw_administrative_hierarchy(constituency_id);
CREATE INDEX idx_vw_hierarchy_district ON vw_administrative_hierarchy(district_id);
CREATE INDEX idx_vw_hierarchy_province ON vw_administrative_hierarchy(province_id);

COMMENT ON MATERIALIZED VIEW vw_administrative_hierarchy IS 'Denormalized view of complete administrative hierarchy for quick lookups';

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_administrative_hierarchy()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_administrative_hierarchy;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_provinces_updated_at
    BEFORE UPDATE ON provinces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_districts_updated_at
    BEFORE UPDATE ON districts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_constituencies_updated_at
    BEFORE UPDATE ON constituencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_wards_updated_at
    BEFORE UPDATE ON wards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- NOTE: Administrative hierarchy is read-only for most users
-- Only SYSTEM_ADMIN can modify

ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;

-- Read access: Everyone can read active administrative units
CREATE POLICY provinces_read_policy ON provinces
    FOR SELECT
    USING (is_active = true OR has_national_access());

CREATE POLICY districts_read_policy ON districts
    FOR SELECT
    USING (is_active = true OR has_national_access());

CREATE POLICY constituencies_read_policy ON constituencies
    FOR SELECT
    USING (is_active = true OR has_national_access());

CREATE POLICY wards_read_policy ON wards
    FOR SELECT
    USING (is_active = true OR has_national_access());

-- Write access: Only SYSTEM_ADMIN can insert/update/delete
CREATE POLICY provinces_write_policy ON provinces
    FOR ALL
    USING (current_user_role() = 'SYSTEM_ADMIN');

CREATE POLICY districts_write_policy ON districts
    FOR ALL
    USING (current_user_role() = 'SYSTEM_ADMIN');

CREATE POLICY constituencies_write_policy ON constituencies
    FOR ALL
    USING (current_user_role() = 'SYSTEM_ADMIN');

CREATE POLICY wards_write_policy ON wards
    FOR ALL
    USING (current_user_role() = 'SYSTEM_ADMIN');
