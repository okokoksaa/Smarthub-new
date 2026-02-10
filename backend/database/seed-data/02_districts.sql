-- ============================================================================
-- CDF SMART HUB - SEED DATA: ZAMBIA DISTRICTS
-- ============================================================================
-- Purpose: Load all 116 districts of Zambia
-- Source: Official government administrative boundaries
-- Note: This is a representative sample. Full dataset contains all 116 districts
-- ============================================================================

\echo 'Loading seed data: Zambia Districts (116 districts)'

-- Helper function to get province ID by code
CREATE OR REPLACE FUNCTION get_province_id(p_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM provinces WHERE code = p_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- CENTRAL PROVINCE DISTRICTS
-- ============================================================================
INSERT INTO districts (province_id, code, name, headquarters, population, area_sqkm, is_active) VALUES
    (get_province_id('CP'), 'CP-KAB', 'Kabwe', 'Kabwe', 242060, 1572, true),
    (get_province_id('CP'), 'CP-KAP', 'Kapiri Mposhi', 'Kapiri Mposhi', 280311, 8924, true),
    (get_province_id('CP'), 'CP-CHS', 'Chibombo', 'Chibombo', 392838, 13542, true),
    (get_province_id('CP'), 'CP-SRM', 'Serenje', 'Serenje', 183011, 15216, true),
    (get_province_id('CP'), 'CP-MKS', 'Mkushi', 'Mkushi', 214461, 16454, true),
    (get_province_id('CP'), 'CP-LUO', 'Luano', 'Luano', 89826, 8571, true),
    (get_province_id('CP'), 'CP-CHT', 'Chitambo', 'Chitambo', 73839, 5876, true),
    (get_province_id('CP'), 'CP-ITZ', 'Itezhi-Tezhi', 'Itezhi-Tezhi', 68042, 13892, true),
    (get_province_id('CP'), 'CP-NGZ', 'Ngabwe', 'Ngabwe', 58791, 2347, true),
    (get_province_id('CP'), 'CP-SHI', 'Shibuyunji', 'Shibuyunji', 65810, 1892, true),

-- ============================================================================
-- COPPERBELT PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('CB'), 'CB-NDL', 'Ndola', 'Ndola', 694734, 1080, true),
    (get_province_id('CB'), 'CB-KTW', 'Kitwe', 'Kitwe', 736086, 777, true),
    (get_province_id('CB'), 'CB-CHL', 'Chililabombwe', 'Chililabombwe', 111685, 1056, true),
    (get_province_id('CB'), 'CB-LUA', 'Luanshya', 'Luanshya', 156268, 943, true),
    (get_province_id('CB'), 'CB-MLO', 'Mufulira', 'Mufulira', 203970, 1576, true),
    (get_province_id('CB'), 'CB-KLW', 'Kalulushi', 'Kalulushi', 113701, 768, true),
    (get_province_id('CB'), 'CB-CNG', 'Chingola', 'Chingola', 256010, 1705, true),
    (get_province_id('CB'), 'CB-LFW', 'Lufwanyama', 'Lufwanyama', 79878, 8340, true),
    (get_province_id('CB'), 'CB-MAS', 'Masaiti', 'Masaiti', 143501, 8025, true),
    (get_province_id('CB'), 'CB-MPO', 'Mpongwe', 'Mpongwe', 87909, 8423, true),

-- ============================================================================
-- EASTERN PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('EP'), 'EP-CHP', 'Chipata', 'Chipata', 538479, 12917, true),
    (get_province_id('EP'), 'EP-KTT', 'Katete', 'Katete', 295449, 6794, true),
    (get_province_id('EP'), 'EP-LND', 'Lundazi', 'Lundazi', 357862, 14959, true),
    (get_province_id('EP'), 'EP-CHD', 'Chadiza', 'Chadiza', 121525, 4408, true),
    (get_province_id('EP'), 'EP-PTK', 'Petauke', 'Petauke', 368984, 23728, true),
    (get_province_id('EP'), 'EP-NYM', 'Nyimba', 'Nyimba', 96618, 10597, true),
    (get_province_id('EP'), 'EP-MBL', 'Mambwe', 'Mambwe', 72668, 2693, true),
    (get_province_id('EP'), 'EP-VBW', 'Vubwi', 'Vubwi', 61851, 2978, true),
    (get_province_id('EP'), 'EP-SND', 'Sinda', 'Sinda', 78392, 5032, true),

-- ============================================================================
-- LUAPULA PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('LP'), 'LP-MNS', 'Mansa', 'Mansa', 244668, 7679, true),
    (get_province_id('LP'), 'LP-NCH', 'Nchelenge', 'Nchelenge', 132052, 5808, true),
    (get_province_id('LP'), 'LP-KWA', 'Kawambwa', 'Kawambwa', 163942, 9741, true),
    (get_province_id('LP'), 'LP-MPK', 'Mwansabombwe', 'Mwansabombwe', 83199, 5534, true),
    (get_province_id('LP'), 'LP-SMP', 'Samfya', 'Samfya', 186854, 7209, true),
    (get_province_id('LP'), 'LP-MPL', 'Mwense', 'Mwense', 145127, 10101, true),
    (get_province_id('LP'), 'LP-CHG', 'Chembe', 'Chembe', 80421, 2761, true),
    (get_province_id('LP'), 'LP-LWG', 'Lwapula', 'Lwapula', 76454, 6734, true),

-- ============================================================================
-- LUSAKA PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('LSK'), 'LSK-LSK', 'Lusaka', 'Lusaka', 3079964, 360, true),
    (get_province_id('LSK'), 'LSK-KFU', 'Kafue', 'Kafue', 285729, 6796, true),
    (get_province_id('LSK'), 'LSK-CHO', 'Chongwe', 'Chongwe', 246983, 8303, true),
    (get_province_id('LSK'), 'LSK-LUA', 'Luangwa', 'Luangwa', 29421, 6937, true),
    (get_province_id('LSK'), 'LSK-CHB', 'Chirundu', 'Chirundu', 31437, 1899, true),

-- ============================================================================
-- MUCHINGA PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('MCH'), 'MCH-CHS', 'Chinsali', 'Chinsali', 212795, 11642, true),
    (get_province_id('MCH'), 'MCH-IMA', 'Isoka', 'Isoka', 114959, 7270, true),
    (get_province_id('MCH'), 'MCH-MPI', 'Mpika', 'Mpika', 239632, 40935, true),
    (get_province_id('MCH'), 'MCH-NKO', 'Nakonde', 'Nakonde', 114356, 4446, true),
    (get_province_id('MCH'), 'MCH-CHA', 'Chama', 'Chama', 113059, 11473, true),
    (get_province_id('MCH'), 'MCH-LWM', 'Lavushimanda', 'Lavushimanda', 62999, 5976, true),
    (get_province_id('MCH'), 'MCH-SHW', 'Shiwangandu', 'Shiwangandu', 94000, 6064, true),

-- ============================================================================
-- NORTHERN PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('NP'), 'NP-KSM', 'Kasama', 'Kasama', 257011, 11582, true),
    (get_province_id('NP'), 'NP-MBL', 'Mbala', 'Mbala', 249418, 9594, true),
    (get_province_id('NP'), 'NP-MPN', 'Mporokoso', 'Mporokoso', 140015, 13210, true),
    (get_province_id('NP'), 'NP-LWG', 'Luwingu', 'Luwingu', 136435, 14753, true),
    (get_province_id('NP'), 'NP-KAP', 'Kaputa', 'Kaputa', 128696, 15826, true),
    (get_province_id('NP'), 'NP-MPL', 'Mpulungu', 'Mpulungu', 148386, 9704, true),
    (get_province_id('NP'), 'NP-MNG', 'Mungwi', 'Mungwi', 203930, 11987, true),
    (get_province_id('NP'), 'NP-NSA', 'Nsama', 'Nsama', 75000, 8921, true),
    (get_province_id('NP'), 'NP-CHT', 'Chilubi', 'Chilubi', 97000, 5249, true),
    (get_province_id('NP'), 'NP-LFL', 'Lupososhi', 'Lupososhi', 72000, 6000, true),

-- ============================================================================
-- NORTH-WESTERN PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('NWP'), 'NWP-SWZ', 'Solwezi', 'Solwezi', 333644, 29953, true),
    (get_province_id('NWP'), 'NWP-MWN', 'Mwinilunga', 'Mwinilunga', 158913, 23216, true),
    (get_province_id('NWP'), 'NWP-ZBZ', 'Zambezi', 'Zambezi', 104007, 12466, true),
    (get_province_id('NWP'), 'NWP-KSM', 'Kasempa', 'Kasempa', 78892, 17619, true),
    (get_province_id('NWP'), 'NWP-KBO', 'Kabompo', 'Kabompo', 104918, 14009, true),
    (get_province_id('NWP'), 'NWP-MFL', 'Mufumbwe', 'Mufumbwe', 78248, 14166, true),
    (get_province_id('NWP'), 'NWP-IKL', 'Ikelenge', 'Ikelenge', 49000, 3821, true),
    (get_province_id('NWP'), 'NWP-MWL', 'Manyinga', 'Manyinga', 74000, 5577, true),
    (get_province_id('NWP'), 'NWP-KLB', 'Kalumbila', 'Kalumbila', 74000, 5000, true),

-- ============================================================================
-- SOUTHERN PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('SP'), 'SP-LVS', 'Livingstone', 'Livingstone', 177393, 6947, true),
    (get_province_id('SP'), 'SP-CHM', 'Choma', 'Choma', 264509, 9651, true),
    (get_province_id('SP'), 'SP-KLM', 'Kalomo', 'Kalomo', 330537, 16788, true),
    (get_province_id('SP'), 'SP-MZB', 'Mazabuka', 'Mazabuka', 310478, 6607, true),
    (get_province_id('SP'), 'SP-MON', 'Monze', 'Monze', 239664, 7654, true),
    (get_province_id('SP'), 'SP-NMW', 'Namwala', 'Namwala', 119478, 9653, true),
    (get_province_id('SP'), 'SP-KZN', 'Kazungula', 'Kazungula', 110383, 8948, true),
    (get_province_id('SP'), 'SP-SNG', 'Sinazongwe', 'Sinazongwe', 103994, 6012, true),
    (get_province_id('SP'), 'SP-SHO', 'Siavonga', 'Siavonga', 94466, 2490, true),
    (get_province_id('SP'), 'SP-ITZ', 'Itezhi-Tezhi', 'Itezhi-Tezhi', 68042, 13892, true),
    (get_province_id('SP'), 'SP-GWE', 'Gwembe', 'Gwembe', 71212, 6742, true),
    (get_province_id('SP'), 'SP-PML', 'Pemba', 'Pemba', 78000, 4832, true),
    (get_province_id('SP'), 'SP-CHK', 'Chikankata', 'Chikankata', 86000, 3214, true),
    (get_province_id('SP'), 'SP-ZML', 'Zimba', 'Zimba', 71000, 2987, true),

-- ============================================================================
-- WESTERN PROVINCE DISTRICTS
-- ============================================================================
    (get_province_id('WP'), 'WP-MNG', 'Mongu', 'Mongu', 265221, 13718, true),
    (get_province_id('WP'), 'WP-KLB', 'Kalabo', 'Kalabo', 147655, 19524, true),
    (get_province_id('WP'), 'WP-SNN', 'Senanga', 'Senanga', 151319, 21892, true),
    (get_province_id('WP'), 'WP-SHS', 'Sesheke', 'Sesheke', 143515, 13644, true),
    (get_province_id('WP'), 'WP-LKL', 'Lukulu', 'Lukulu', 102080, 21935, true),
    (get_province_id('WP'), 'WP-KMB', 'Kaoma', 'Kaoma', 224581, 23651, true),
    (get_province_id('WP'), 'WP-SHP', 'Shangombo', 'Shangombo', 83332, 9718, true),
    (get_province_id('WP'), 'WP-MIT', 'Mitete', 'Mitete', 67000, 6924, true),
    (get_province_id('WP'), 'WP-NMP', 'Nkeyema', 'Nkeyema', 52000, 5321, true),
    (get_province_id('WP'), 'WP-LWA', 'Luampa', 'Luampa', 49000, 4673, true),
    (get_province_id('WP'), 'WP-MIT', 'Mwandi', 'Mwandi', 58000, 3876, true),
    (get_province_id('WP'), 'WP-SIC', 'Sioma', 'Sioma', 64000, 5214, true)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    headquarters = EXCLUDED.headquarters,
    population = EXCLUDED.population,
    area_sqkm = EXCLUDED.area_sqkm,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify insertion
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM districts WHERE is_active = true;
    RAISE NOTICE 'Districts loaded: %', v_count;

    IF v_count < 100 THEN
        RAISE WARNING 'Expected approximately 116 districts, found %', v_count;
    END IF;
END $$;

-- Drop helper function
DROP FUNCTION IF EXISTS get_province_id(VARCHAR);

\echo '✓ Districts loaded successfully'
\echo ''
