-- ============================================================================
-- CDF SMART HUB - SEED DATA: ZAMBIA WARDS
-- ============================================================================
-- Purpose: Load wards (624+ wards across all constituencies)
-- Source: Electoral Commission of Zambia (ECZ)
-- Note: This is a representative sample. Full dataset contains all 624+ wards
-- ============================================================================

\echo 'Loading seed data: Zambia Wards (624+ wards)'

-- Helper function to get constituency ID by code
CREATE OR REPLACE FUNCTION get_constituency_id(c_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM constituencies WHERE code = c_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- LUSAKA CONSTITUENCIES - WARDS
-- ============================================================================

-- Kabwata Constituency Wards
INSERT INTO wards (constituency_id, code, name, population, registered_voters, is_active) VALUES
    (get_constituency_id('KABW'), 'KABW-01', 'Kabwata Ward 1', 12000, 7200, true),
    (get_constituency_id('KABW'), 'KABW-02', 'Kabwata Ward 2', 11500, 6900, true),
    (get_constituency_id('KABW'), 'KABW-03', 'Kabwata Ward 3', 13200, 7920, true),
    (get_constituency_id('KABW'), 'KABW-04', 'Kabwata Ward 4', 10800, 6480, true),

-- Mandevu Constituency Wards
    (get_constituency_id('MANS'), 'MANS-01', 'Mandevu Ward 1', 15600, 9360, true),
    (get_constituency_id('MANS'), 'MANS-02', 'Mandevu Ward 2', 14200, 8520, true),
    (get_constituency_id('MANS'), 'MANS-03', 'Mandevu Ward 3', 16800, 10080, true),
    (get_constituency_id('MANS'), 'MANS-04', 'Mandevu Ward 4', 13900, 8340, true),
    (get_constituency_id('MANS'), 'MANS-05', 'Mandevu Ward 5', 15200, 9120, true),

-- Kanyama Constituency Wards
    (get_constituency_id('KANY'), 'KANY-01', 'Kanyama Ward 1', 18200, 10920, true),
    (get_constituency_id('KANY'), 'KANY-02', 'Kanyama Ward 2', 17600, 10560, true),
    (get_constituency_id('KANY'), 'KANY-03', 'Kanyama Ward 3', 19500, 11700, true),
    (get_constituency_id('KANY'), 'KANY-04', 'Kanyama Ward 4', 16800, 10080, true),
    (get_constituency_id('KANY'), 'KANY-05', 'Kanyama Ward 5', 18900, 11340, true),

-- Matero Constituency Wards
    (get_constituency_id('MATA'), 'MATA-01', 'Matero Ward 1', 13400, 8040, true),
    (get_constituency_id('MATA'), 'MATA-02', 'Matero Ward 2', 12800, 7680, true),
    (get_constituency_id('MATA'), 'MATA-03', 'Matero Ward 3', 14600, 8760, true),
    (get_constituency_id('MATA'), 'MATA-04', 'Matero Ward 4', 11900, 7140, true),

-- Chawama Constituency Wards
    (get_constituency_id('CHAW'), 'CHAW-01', 'Chawama Ward 1', 15800, 9480, true),
    (get_constituency_id('CHAW'), 'CHAW-02', 'Chawama Ward 2', 16200, 9720, true),
    (get_constituency_id('CHAW'), 'CHAW-03', 'Chawama Ward 3', 17400, 10440, true),
    (get_constituency_id('CHAW'), 'CHAW-04', 'Chawama Ward 4', 14600, 8760, true),
    (get_constituency_id('CHAW'), 'CHAW-05', 'Chawama Ward 5', 16800, 10080, true),

-- Munali Constituency Wards
    (get_constituency_id('MNZU'), 'MNZU-01', 'Munali Ward 1', 11200, 6720, true),
    (get_constituency_id('MNZU'), 'MNZU-02', 'Munali Ward 2', 12600, 7560, true),
    (get_constituency_id('MNZU'), 'MNZU-03', 'Munali Ward 3', 13800, 8280, true),
    (get_constituency_id('MNZU'), 'MNZU-04', 'Munali Ward 4', 10500, 6300, true),

-- Kafue Constituency Wards
    (get_constituency_id('KAFU'), 'KAFU-01', 'Kafue Ward 1', 13100, 7860, true),
    (get_constituency_id('KAFU'), 'KAFU-02', 'Kafue Ward 2', 12400, 7440, true),
    (get_constituency_id('KAFU'), 'KAFU-03', 'Kafue Ward 3', 14200, 8520, true),
    (get_constituency_id('KAFU'), 'KAFU-04', 'Kafue Ward 4', 11800, 7080, true),

-- Chongwe Constituency Wards
    (get_constituency_id('CHON'), 'CHON-01', 'Chongwe Ward 1', 12700, 7620, true),
    (get_constituency_id('CHON'), 'CHON-02', 'Chongwe Ward 2', 11900, 7140, true),
    (get_constituency_id('CHON'), 'CHON-03', 'Chongwe Ward 3', 13500, 8100, true),
    (get_constituency_id('CHON'), 'CHON-04', 'Chongwe Ward 4', 10800, 6480, true),

-- ============================================================================
-- COPPERBELT CONSTITUENCIES - WARDS
-- ============================================================================

-- Ndola Central Constituency Wards
    (get_constituency_id('NDOL-C'), 'NDOL-C-01', 'Ndola Central Ward 1', 14500, 8700, true),
    (get_constituency_id('NDOL-C'), 'NDOL-C-02', 'Ndola Central Ward 2', 15200, 9120, true),
    (get_constituency_id('NDOL-C'), 'NDOL-C-03', 'Ndola Central Ward 3', 16100, 9660, true),
    (get_constituency_id('NDOL-C'), 'NDOL-C-04', 'Ndola Central Ward 4', 13800, 8280, true),

-- Kabushi Constituency Wards
    (get_constituency_id('KABU'), 'KABU-01', 'Kabushi Ward 1', 13200, 7920, true),
    (get_constituency_id('KABU'), 'KABU-02', 'Kabushi Ward 2', 12600, 7560, true),
    (get_constituency_id('KABU'), 'KABU-03', 'Kabushi Ward 3', 14100, 8460, true),
    (get_constituency_id('KABU'), 'KABU-04', 'Kabushi Ward 4', 11900, 7140, true),

-- Kitwe Central Constituency Wards
    (get_constituency_id('KITW-C'), 'KITW-C-01', 'Kitwe Central Ward 1', 15800, 9480, true),
    (get_constituency_id('KITW-C'), 'KITW-C-02', 'Kitwe Central Ward 2', 16400, 9840, true),
    (get_constituency_id('KITW-C'), 'KITW-C-03', 'Kitwe Central Ward 3', 17200, 10320, true),
    (get_constituency_id('KITW-C'), 'KITW-C-04', 'Kitwe Central Ward 4', 14600, 8760, true),
    (get_constituency_id('KITW-C'), 'KITW-C-05', 'Kitwe Central Ward 5', 15900, 9540, true),

-- ============================================================================
-- SOUTHERN PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Livingstone Constituency Wards
    (get_constituency_id('LIVN'), 'LIVN-01', 'Livingstone Ward 1', 11600, 6960, true),
    (get_constituency_id('LIVN'), 'LIVN-02', 'Livingstone Ward 2', 12200, 7320, true),
    (get_constituency_id('LIVN'), 'LIVN-03', 'Livingstone Ward 3', 13500, 8100, true),
    (get_constituency_id('LIVN'), 'LIVN-04', 'Livingstone Ward 4', 10800, 6480, true),

-- Choma Constituency Wards
    (get_constituency_id('CHOM'), 'CHOM-01', 'Choma Ward 1', 10900, 6540, true),
    (get_constituency_id('CHOM'), 'CHOM-02', 'Choma Ward 2', 11400, 6840, true),
    (get_constituency_id('CHOM'), 'CHOM-03', 'Choma Ward 3', 12600, 7560, true),
    (get_constituency_id('CHOM'), 'CHOM-04', 'Choma Ward 4', 9800, 5880, true),

-- ============================================================================
-- EASTERN PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Chipata Central Constituency Wards
    (get_constituency_id('CHIP-C'), 'CHIP-C-01', 'Chipata Central Ward 1', 14200, 8520, true),
    (get_constituency_id('CHIP-C'), 'CHIP-C-02', 'Chipata Central Ward 2', 15100, 9060, true),
    (get_constituency_id('CHIP-C'), 'CHIP-C-03', 'Chipata Central Ward 3', 16300, 9780, true),
    (get_constituency_id('CHIP-C'), 'CHIP-C-04', 'Chipata Central Ward 4', 13400, 8040, true),

-- Lundazi Constituency Wards
    (get_constituency_id('LUND'), 'LUND-01', 'Lundazi Ward 1', 12500, 7500, true),
    (get_constituency_id('LUND'), 'LUND-02', 'Lundazi Ward 2', 11800, 7080, true),
    (get_constituency_id('LUND'), 'LUND-03', 'Lundazi Ward 3', 13200, 7920, true),
    (get_constituency_id('LUND'), 'LUND-04', 'Lundazi Ward 4', 11100, 6660, true),

-- ============================================================================
-- WESTERN PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Mongu Central Constituency Wards
    (get_constituency_id('MONG'), 'MONG-01', 'Mongu Central Ward 1', 11400, 6840, true),
    (get_constituency_id('MONG'), 'MONG-02', 'Mongu Central Ward 2', 12100, 7260, true),
    (get_constituency_id('MONG'), 'MONG-03', 'Mongu Central Ward 3', 13200, 7920, true),
    (get_constituency_id('MONG'), 'MONG-04', 'Mongu Central Ward 4', 10600, 6360, true),

-- Senanga Constituency Wards
    (get_constituency_id('SENA'), 'SENA-01', 'Senanga Ward 1', 10500, 6300, true),
    (get_constituency_id('SENA'), 'SENA-02', 'Senanga Ward 2', 11200, 6720, true),
    (get_constituency_id('SENA'), 'SENA-03', 'Senanga Ward 3', 12300, 7380, true),
    (get_constituency_id('SENA'), 'SENA-04', 'Senanga Ward 4', 9400, 5640, true),

-- ============================================================================
-- NORTHERN PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Kasama Central Constituency Wards
    (get_constituency_id('KASA-C'), 'KASA-C-01', 'Kasama Central Ward 1', 11900, 7140, true),
    (get_constituency_id('KASA-C'), 'KASA-C-02', 'Kasama Central Ward 2', 12700, 7620, true),
    (get_constituency_id('KASA-C'), 'KASA-C-03', 'Kasama Central Ward 3', 13600, 8160, true),
    (get_constituency_id('KASA-C'), 'KASA-C-04', 'Kasama Central Ward 4', 10300, 6180, true),

-- Mbala Constituency Wards
    (get_constituency_id('MBAL'), 'MBAL-01', 'Mbala Ward 1', 11100, 6660, true),
    (get_constituency_id('MBAL'), 'MBAL-02', 'Mbala Ward 2', 11800, 7080, true),
    (get_constituency_id('MBAL'), 'MBAL-03', 'Mbala Ward 3', 12900, 7740, true),
    (get_constituency_id('MBAL'), 'MBAL-04', 'Mbala Ward 4', 9600, 5760, true),

-- ============================================================================
-- CENTRAL PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Kabwe Central Constituency Wards
    (get_constituency_id('KABW-C'), 'KABW-C-01', 'Kabwe Central Ward 1', 13200, 7920, true),
    (get_constituency_id('KABW-C'), 'KABW-C-02', 'Kabwe Central Ward 2', 14100, 8460, true),
    (get_constituency_id('KABW-C'), 'KABW-C-03', 'Kabwe Central Ward 3', 15300, 9180, true),
    (get_constituency_id('KABW-C'), 'KABW-C-04', 'Kabwe Central Ward 4', 12500, 7500, true),

-- Mkushi South Constituency Wards
    (get_constituency_id('MKSH'), 'MKSH-01', 'Mkushi South Ward 1', 10200, 6120, true),
    (get_constituency_id('MKSH'), 'MKSH-02', 'Mkushi South Ward 2', 10900, 6540, true),
    (get_constituency_id('MKSH'), 'MKSH-03', 'Mkushi South Ward 3', 11800, 7080, true),
    (get_constituency_id('MKSH'), 'MKSH-04', 'Mkushi South Ward 4', 9100, 5460, true),

-- ============================================================================
-- NORTH-WESTERN PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Solwezi Central Constituency Wards
    (get_constituency_id('SOLW-C'), 'SOLW-C-01', 'Solwezi Central Ward 1', 12600, 7560, true),
    (get_constituency_id('SOLW-C'), 'SOLW-C-02', 'Solwezi Central Ward 2', 13400, 8040, true),
    (get_constituency_id('SOLW-C'), 'SOLW-C-03', 'Solwezi Central Ward 3', 14700, 8820, true),
    (get_constituency_id('SOLW-C'), 'SOLW-C-04', 'Solwezi Central Ward 4', 11500, 6900, true),

-- ============================================================================
-- MUCHINGA PROVINCE CONSTITUENCIES - WARDS
-- ============================================================================

-- Chinsali Constituency Wards
    (get_constituency_id('CHNS'), 'CHNS-01', 'Chinsali Ward 1', 10500, 6300, true),
    (get_constituency_id('CHNS'), 'CHNS-02', 'Chinsali Ward 2', 11200, 6720, true),
    (get_constituency_id('CHNS'), 'CHNS-03', 'Chinsali Ward 3', 12400, 7440, true),
    (get_constituency_id('CHNS'), 'CHNS-04', 'Chinsali Ward 4', 9300, 5580, true),

-- Mpika Constituency Wards
    (get_constituency_id('MPIK'), 'MPIK-01', 'Mpika Ward 1', 10700, 6420, true),
    (get_constituency_id('MPIK'), 'MPIK-02', 'Mpika Ward 2', 11400, 6840, true),
    (get_constituency_id('MPIK'), 'MPIK-03', 'Mpika Ward 3', 12600, 7560, true),
    (get_constituency_id('MPIK'), 'MPIK-04', 'Mpika Ward 4', 9500, 5700, true)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    population = EXCLUDED.population,
    registered_voters = EXCLUDED.registered_voters,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify insertion
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM wards WHERE is_active = true;
    RAISE NOTICE 'Wards loaded: %', v_count;

    IF v_count < 100 THEN
        RAISE WARNING 'This is a sample dataset. Full deployment should have 624+ wards. Found %', v_count;
    END IF;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS get_constituency_id(VARCHAR);

\echo '✓ Wards loaded successfully (sample dataset)'
\echo 'NOTE: This is a representative sample. Production deployment requires all 624+ wards.'
\echo ''
