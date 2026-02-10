-- ============================================================================
-- CDF SMART HUB - SEED DATA: ZAMBIA PROVINCES
-- ============================================================================
-- Purpose: Load all 10 provinces of Zambia
-- Source: Official government administrative boundaries
-- ============================================================================

\echo 'Loading seed data: Zambia Provinces (10 provinces)'

-- Insert provinces
INSERT INTO provinces (code, name, capital, population, area_sqkm, is_active) VALUES
    ('CP', 'Central Province', 'Kabwe', 1598989, 94394, true),
    ('CB', 'Copperbelt Province', 'Ndola', 2984246, 31328, true),
    ('EP', 'Eastern Province', 'Chipata', 1913814, 69106, true),
    ('LP', 'Luapula Province', 'Mansa', 1168717, 50567, true),
    ('LSK', 'Lusaka Province', 'Lusaka', 3423534, 21896, true),
    ('MCH', 'Muchinga Province', 'Chinsali', 891800, 87806, true),
    ('NP', 'Northern Province', 'Kasama', 1808891, 147826, true),
    ('NWP', 'North-Western Province', 'Solwezi', 1055622, 125827, true),
    ('SP', 'Southern Province', 'Livingstone', 2085630, 85283, true),
    ('WP', 'Western Province', 'Mongu', 1084703, 126386, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    capital = EXCLUDED.capital,
    population = EXCLUDED.population,
    area_sqkm = EXCLUDED.area_sqkm,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify insertion
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM provinces WHERE is_active = true;
    RAISE NOTICE 'Provinces loaded: %', v_count;

    IF v_count <> 10 THEN
        RAISE EXCEPTION 'Expected 10 provinces, found %', v_count;
    END IF;
END $$;

\echo '✓ 10 provinces loaded successfully'
\echo ''
