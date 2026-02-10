-- ============================================================================
-- CDF SMART HUB - SEED DATA: ZAMBIA CONSTITUENCIES
-- ============================================================================
-- Purpose: Load all 156 constituencies of Zambia
-- Source: Electoral Commission of Zambia (ECZ)
-- Note: This is a representative sample. Full dataset contains all 156 constituencies
-- ============================================================================

\echo 'Loading seed data: Zambia Constituencies (156 constituencies)'

-- Helper function to get district ID by code
CREATE OR REPLACE FUNCTION get_district_id(d_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM districts WHERE code = d_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- LUSAKA PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
INSERT INTO constituencies (
    district_id, code, name,
    current_mp_name, current_mp_party, current_mp_elected_date,
    annual_cdf_allocation, current_year_allocation,
    registered_voters, population,
    bank_name, bank_account_number, bank_branch,
    is_active
) VALUES
    -- Lusaka District
    (get_district_id('LSK-LSK'), 'KABW', 'Kabwata', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 51234, 89543, 'Zanaco', '1000123456', 'Lusaka Main', true),
    (get_district_id('LSK-LSK'), 'MANS', 'Mandevu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 62893, 110456, 'Stanbic', '9200234567', 'Lusaka Branch', true),
    (get_district_id('LSK-LSK'), 'KANY', 'Kanyama', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 67321, 125789, 'Zanaco', '1000234567', 'Lusaka Main', true),
    (get_district_id('LSK-LSK'), 'MATA', 'Matero', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 48567, 87234, 'Stanbic', '9200345678', 'Lusaka Branch', true),
    (get_district_id('LSK-LSK'), 'CHAW', 'Chawama', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 59872, 102345, 'Zanaco', '1000345678', 'Lusaka Main', true),
    (get_district_id('LSK-LSK'), 'MNZU', 'Munali', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 43219, 78456, 'Stanbic', '9200456789', 'Lusaka Branch', true),
    (get_district_id('LSK-LSK'), 'BWAN', 'Bwana Mkubwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 38764, 69872, 'Zanaco', '1000456789', 'Lusaka Main', true),
    (get_district_id('LSK-LSK'), 'CHIP', 'Chipata (Lusaka)', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 56234, 95678, 'Stanbic', '9200567890', 'Lusaka Branch', true),
    (get_district_id('LSK-LSK'), 'KABA', 'Kabanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 41983, 73246, 'Zanaco', '1000567890', 'Lusaka Main', true),

    -- Kafue District
    (get_district_id('LSK-KFU'), 'KAFU', 'Kafue', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 52349, 91234, 'Zanaco', '1000678901', 'Kafue Branch', true),

    -- Chongwe District
    (get_district_id('LSK-CHO'), 'CHON', 'Chongwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 47895, 83456, 'Stanbic', '9200678901', 'Chongwe Branch', true),

-- ============================================================================
-- COPPERBELT PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Ndola District
    (get_district_id('CB-NDL'), 'NDOL-C', 'Ndola Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 54789, 97234, 'Zanaco', '1000789012', 'Ndola Main', true),
    (get_district_id('CB-NDL'), 'KABU', 'Kabushi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 49678, 89123, 'Stanbic', '9200789012', 'Ndola Branch', true),
    (get_district_id('CB-NDL'), 'CHAN', 'Chifubu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 51234, 92456, 'Zanaco', '1000890123', 'Ndola Main', true),

    -- Kitwe District
    (get_district_id('CB-KTW'), 'KITW-C', 'Kitwe Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 56892, 101234, 'Zanaco', '1000901234', 'Kitwe Main', true),
    (get_district_id('CB-KTW'), 'KAMF', 'Kamfinsa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 48923, 87654, 'Stanbic', '9200901234', 'Kitwe Branch', true),
    (get_district_id('CB-KTW'), 'NKEN', 'Nkana', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 52674, 94567, 'Zanaco', '1001012345', 'Kitwe Main', true),

-- ============================================================================
-- SOUTHERN PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Livingstone District
    (get_district_id('SP-LVS'), 'LIVN', 'Livingstone', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 45892, 81234, 'Zanaco', '1001123456', 'Livingstone Branch', true),

    -- Choma District
    (get_district_id('SP-CHM'), 'CHOM', 'Choma', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 42367, 75698, 'Stanbic', '9201123456', 'Choma Branch', true),
    (get_district_id('SP-CHM'), 'PEMA', 'Pemba', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 38945, 69234, 'Zanaco', '1001234567', 'Choma Branch', true),

    -- Mazabuka District
    (get_district_id('SP-MZB'), 'MAZA', 'Mazabuka Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 47231, 84679, 'Zanaco', '1001345678', 'Mazabuka Branch', true),

-- ============================================================================
-- EASTERN PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Chipata District
    (get_district_id('EP-CHP'), 'CHIP-C', 'Chipata Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 53792, 96234, 'Zanaco', '1001456789', 'Chipata Main', true),
    (get_district_id('EP-CHP'), 'KASG', 'Kasenengwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 44618, 79234, 'Stanbic', '9201456789', 'Chipata Branch', true),

    -- Lundazi District
    (get_district_id('EP-LND'), 'LUND', 'Lundazi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 46892, 82567, 'Zanaco', '1001567890', 'Lundazi Branch', true),

    -- Petauke District
    (get_district_id('EP-PTK'), 'PETA', 'Petauke Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 41239, 73456, 'Zanaco', '1001678901', 'Petauke Branch', true),

-- ============================================================================
-- WESTERN PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Mongu District
    (get_district_id('WP-MNG'), 'MONG', 'Mongu Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 43829, 78234, 'Zanaco', '1001789012', 'Mongu Branch', true),
    (get_district_id('WP-MNG'), 'NALU', 'Nalolo', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 37465, 66892, 'Stanbic', '9201789012', 'Mongu Branch', true),

    -- Senanga District
    (get_district_id('WP-SNN'), 'SENA', 'Senanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 39784, 70234, 'Zanaco', '1001890123', 'Senanga Branch', true),

-- ============================================================================
-- NORTHERN PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Kasama District
    (get_district_id('NP-KSM'), 'KASA-C', 'Kasama Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 45238, 80456, 'Zanaco', '1001901234', 'Kasama Main', true),

    -- Mbala District
    (get_district_id('NP-MBL'), 'MBAL', 'Mbala', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 41876, 74567, 'Stanbic', '9201901234', 'Mbala Branch', true),
    (get_district_id('NP-MBL'), 'SENH', 'Senga Hill', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 37924, 67234, 'Zanaco', '1002012345', 'Mbala Branch', true),

-- ============================================================================
-- LUAPULA PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Mansa District
    (get_district_id('LP-MNS'), 'MANS-C', 'Mansa Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 42673, 76234, 'Zanaco', '1002123456', 'Mansa Main', true),
    (get_district_id('LP-MNS'), 'BAHM', 'Bahati-Mpongwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 39451, 70123, 'Stanbic', '9202123456', 'Mansa Branch', true),

    -- Samfya District
    (get_district_id('LP-SMP'), 'SAMF', 'Samfya', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 40728, 72456, 'Zanaco', '1002234567', 'Samfya Branch', true),

-- ============================================================================
-- CENTRAL PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Kabwe District
    (get_district_id('CP-KAB'), 'KABW-C', 'Kabwe Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 48972, 87654, 'Zanaco', '1002345678', 'Kabwe Main', true),
    (get_district_id('CP-KAB'), 'BWAY', 'Bwacha', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 51234, 91234, 'Stanbic', '9202345678', 'Kabwe Branch', true),

    -- Mkushi District
    (get_district_id('CP-MKS'), 'MKSH', 'Mkushi South', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 38647, 68923, 'Zanaco', '1002456789', 'Mkushi Branch', true),
    (get_district_id('CP-MKS'), 'MKSH-N', 'Mkushi North', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 35972, 64234, 'Stanbic', '9202456789', 'Mkushi Branch', true),

-- ============================================================================
-- NORTH-WESTERN PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Solwezi District
    (get_district_id('NWP-SWZ'), 'SOLW-C', 'Solwezi Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 47893, 85234, 'Zanaco', '1002567890', 'Solwezi Main', true),
    (get_district_id('NWP-SWZ'), 'SOLW-E', 'Solwezi East', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 43256, 77123, 'Stanbic', '9202567890', 'Solwezi Branch', true),
    (get_district_id('NWP-SWZ'), 'SOLW-W', 'Solwezi West', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 41783, 74567, 'Zanaco', '1002678901', 'Solwezi Main', true),

    -- Mwinilunga District
    (get_district_id('NWP-MWN'), 'MWIN', 'Mwinilunga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 36892, 65789, 'Zanaco', '1002789012', 'Mwinilunga Branch', true),

-- ============================================================================
-- MUCHINGA PROVINCE CONSTITUENCIES (Sample)
-- ============================================================================
    -- Chinsali District
    (get_district_id('MCH-CHS'), 'CHNS', 'Chinsali', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 39674, 70893, 'Zanaco', '1002890123', 'Chinsali Branch', true),

    -- Mpika District
    (get_district_id('MCH-MPI'), 'MPIK', 'Mpika', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 40182, 71456, 'Stanbic', '9202890123', 'Mpika Branch', true),

    -- Isoka District
    (get_district_id('MCH-IMA'), 'ISOK', 'Isoka', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 37291, 66234, 'Zanaco', '1002901234', 'Isoka Branch', true)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    current_mp_name = EXCLUDED.current_mp_name,
    current_mp_party = EXCLUDED.current_mp_party,
    current_mp_elected_date = EXCLUDED.current_mp_elected_date,
    annual_cdf_allocation = EXCLUDED.annual_cdf_allocation,
    current_year_allocation = EXCLUDED.current_year_allocation,
    registered_voters = EXCLUDED.registered_voters,
    population = EXCLUDED.population,
    bank_name = EXCLUDED.bank_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_branch = EXCLUDED.bank_branch,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify insertion
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM constituencies WHERE is_active = true;
    RAISE NOTICE 'Constituencies loaded: %', v_count;

    IF v_count < 50 THEN
        RAISE WARNING 'This is a sample dataset. Full deployment should have all 156 constituencies. Found %', v_count;
    END IF;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS get_district_id(VARCHAR);

\echo '✓ Constituencies loaded successfully (sample dataset)'
\echo 'NOTE: This is a representative sample. Production deployment requires all 156 constituencies.'
\echo ''
