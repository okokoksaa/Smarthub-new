-- ============================================================================
-- CDF SMART HUB - MISSING DISTRICTS
-- ============================================================================
-- Purpose: Add 3 districts that were in ECZ data but missing from seed data
-- ============================================================================

\echo 'Loading missing districts'

-- Helper function
CREATE OR REPLACE FUNCTION get_province_id(p_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM provinces WHERE code = p_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Add missing districts
INSERT INTO districts (province_id, code, name, headquarters, population, area_sqkm, is_active) VALUES
    -- Northern Province
    (get_province_id('NP'), 'NP-MPL', 'Mpulungu', 'Mpulungu', 148386, 9704, true),
    (get_province_id('NP'), 'NP-MNG', 'Mungwi', 'Mungwi', 203930, 11987, true),

    -- Southern Province (Central Province district moved to Southern)
    (get_province_id('SP'), 'SP-ITZ', 'Itezhi-Tezhi', 'Itezhi-Tezhi', 68042, 13892, true);

-- Cleanup
DROP FUNCTION IF EXISTS get_province_id;

\echo '✓ 3 missing districts added'
\echo ''
