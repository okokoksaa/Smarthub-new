-- ============================================================
-- CDF SMART HUB - DEMO DATA SEEDER
-- Corruption Scenario for ICT Steering Committee Demo
-- ============================================================
-- This script creates a realistic "Corruption Attempt" scenario
-- to demonstrate the AI-powered anomaly detection system.
-- ============================================================

-- Step 1: Get or Create Kabwata Constituency
-- (Using existing if available, or insert new)
DO $$
DECLARE
  v_province_id UUID;
  v_district_id UUID;
  v_constituency_id UUID;
  v_ward_id UUID;
  v_project_id UUID;
  v_contractor_id UUID;
BEGIN
  -- Get or create Lusaka Province
  SELECT id INTO v_province_id FROM provinces WHERE name = 'Lusaka' LIMIT 1;
  IF v_province_id IS NULL THEN
    INSERT INTO provinces (name, code) 
    VALUES ('Lusaka', 'LSK')
    RETURNING id INTO v_province_id;
    RAISE NOTICE 'Created Lusaka Province: %', v_province_id;
  END IF;

  -- Get or create Lusaka District
  SELECT id INTO v_district_id FROM districts WHERE name = 'Lusaka' AND province_id = v_province_id LIMIT 1;
  IF v_district_id IS NULL THEN
    INSERT INTO districts (name, code, province_id)
    VALUES ('Lusaka', 'LSK', v_province_id)
    RETURNING id INTO v_district_id;
    RAISE NOTICE 'Created Lusaka District: %', v_district_id;
  END IF;

  -- Get or create Kabwata Constituency
  SELECT id INTO v_constituency_id FROM constituencies WHERE name = 'Kabwata' LIMIT 1;
  IF v_constituency_id IS NULL THEN
    INSERT INTO constituencies (name, code, district_id, total_budget, allocated_budget, disbursed_budget)
    VALUES ('Kabwata', 'KBW', v_district_id, 25000000, 20000000, 15000000)
    RETURNING id INTO v_constituency_id;
    RAISE NOTICE 'Created Kabwata Constituency: %', v_constituency_id;
  END IF;

  -- Get or create Kabwata Central Ward
  SELECT id INTO v_ward_id FROM wards WHERE name = 'Kabwata Central' AND constituency_id = v_constituency_id LIMIT 1;
  IF v_ward_id IS NULL THEN
    INSERT INTO wards (name, code, constituency_id, population)
    VALUES ('Kabwata Central', 'KBW-C', v_constituency_id, 45000)
    RETURNING id INTO v_ward_id;
    RAISE NOTICE 'Created Kabwata Central Ward: %', v_ward_id;
  END IF;

  -- Get or create a Demo Contractor
  SELECT id INTO v_contractor_id FROM contractors WHERE company_name = 'Demo Building Solutions Ltd' LIMIT 1;
  IF v_contractor_id IS NULL THEN
    INSERT INTO contractors (
      company_name, 
      registration_number, 
      zppa_registration,
      zppa_category,
      contact_person,
      email,
      phone,
      bank_name,
      bank_account,
      tax_clearance_valid,
      is_active
    )
    VALUES (
      'Demo Building Solutions Ltd',
      'REG-2024-DEMO',
      'ZPPA-2024-001',
      'Grade A',
      'John Mwale',
      'john@demobuild.zm',
      '+260 97 1234567',
      'Zanaco Bank',
      '0123456789',
      true,
      true
    )
    RETURNING id INTO v_contractor_id;
    RAISE NOTICE 'Created Demo Contractor: %', v_contractor_id;
  END IF;

  -- ============================================================
  -- Step 2: Create "Kabwata School Roof Renovation" Project
  -- ============================================================
  
  -- Delete existing demo project if exists (for re-running)
  DELETE FROM payments WHERE project_id IN (
    SELECT id FROM projects WHERE name = 'Kabwata School Roof Renovation'
  );
  DELETE FROM projects WHERE name = 'Kabwata School Roof Renovation';
  
  INSERT INTO projects (
    project_number,
    name,
    description,
    sector,
    constituency_id,
    ward_id,
    contractor_id,
    budget,
    spent,
    progress,
    status,
    location_description,
    gps_latitude,
    gps_longitude,
    beneficiaries,
    start_date,
    expected_end_date,
    submitted_at,
    approved_at
  )
  VALUES (
    'PROJ-DEMO-2024-001',
    'Kabwata School Roof Renovation',
    'Complete renovation of the roof structure at Kabwata Basic School, including replacement of damaged iron sheets, timber framework reinforcement, and gutter installation. Project approved following community consultation and TAC technical assessment.',
    'education',
    v_constituency_id,
    v_ward_id,
    v_contractor_id,
    500000, -- K500,000 Budget
    50000,  -- K50,000 already spent (first payment)
    15,     -- 15% progress
    'implementation',
    'Plot 234, Kabwata Basic School, Off Kabwata Road',
    -15.4167,
    28.2833,
    850,    -- Students benefiting
    '2024-11-01',
    '2025-03-31',
    '2024-10-15',
    '2024-10-28'
  )
  RETURNING id INTO v_project_id;
  
  RAISE NOTICE '✓ Created Project: Kabwata School Roof Renovation (ID: %)', v_project_id;

  -- ============================================================
  -- Step 3: Create "Good Payment" - The Baseline
  -- ============================================================
  -- This represents normal, low-risk payment behavior
  
  INSERT INTO payments (
    payment_number,
    project_id,
    amount,
    description,
    milestone,
    status,
    beneficiary_name,
    beneficiary_account,
    beneficiary_bank,
    invoice_number,
    invoice_date,
    ai_risk_score,
    ai_risk_level,
    ai_flags,
    panel_a_approved_at,
    panel_b_approved_at,
    executed_at,
    transaction_reference
  )
  VALUES (
    'PAY-DEMO-2024-001',
    v_project_id,
    50000, -- K50,000 - 10% mobilization
    'Mobilization advance for contractor setup, site preparation, and initial materials procurement. Payment verified against approved Bill of Quantities.',
    'Mobilization (10%)',
    'executed',
    'Demo Building Solutions Ltd',
    '0123456789',
    'Zanaco Bank',
    'INV-2024-DBS-001',
    '2024-11-05',
    10, -- LOW RISK
    'low',
    '[]'::jsonb,
    '2024-11-08 10:30:00+02',
    '2024-11-09 14:15:00+02',
    '2024-11-10 09:00:00+02',
    'TXN-ZAN-2024-789456'
  );
  
  RAISE NOTICE '✓ Created Good Payment: K50,000 (Mobilization) - Risk Score: 10';

  -- ============================================================
  -- Step 4: Create "CORRUPTION ATTEMPT" - The Anomaly
  -- ============================================================
  -- This payment MUST trigger the AI risk detection:
  -- - Amount K350,000 > 100,000 → Base Risk = 75
  -- - K350,000 is 78% of remaining budget (K450,000) → +20 Risk
  -- - TOTAL RISK SCORE: 95 (HIGH)
  
  INSERT INTO payments (
    payment_number,
    project_id,
    amount,
    description,
    milestone,
    status,
    beneficiary_name,
    beneficiary_account,
    beneficiary_bank,
    invoice_number,
    invoice_date,
    ai_risk_score,
    ai_risk_level,
    ai_flags
  )
  VALUES (
    'PAY-DEMO-2024-002',
    v_project_id,
    350000, -- K350,000 - 70% OF TOTAL BUDGET IN ONE PAYMENT!
    'Emergency procurement of premium-grade roofing materials. Supplier requires full upfront payment due to material shortage. Urgent approval requested.',
    'Roofing Materials',
    'submitted', -- Pending review - ready for demo
    'Demo Building Solutions Ltd',
    '0123456789',
    'Zanaco Bank',
    'INV-2024-DBS-002',
    '2024-12-28',
    95, -- HIGH RISK - Triggered by AI analysis
    'high',
    '[
      "Amount exceeds threshold for automatic review",
      "Payment represents 78% of remaining project budget",
      "Amount is 70% of total project allocation - unusual for single milestone",
      "Previous similar projects averaged K45,000-K65,000 for roofing materials",
      "Supplier payment terms deviate from standard 30-60-10 structure"
    ]'::jsonb
  );
  
  RAISE NOTICE '✓ Created CORRUPTION ATTEMPT: K350,000 (Roofing) - Risk Score: 95';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'DEMO DATA SEEDED SUCCESSFULLY';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Project: Kabwata School Roof Renovation';
  RAISE NOTICE 'Budget: K500,000 | Spent: K50,000 | Remaining: K450,000';
  RAISE NOTICE '';
  RAISE NOTICE 'Payments Created:';
  RAISE NOTICE '  1. K50,000  (Mobilization)     - ✓ PAID    - Risk: 10 (Low)';
  RAISE NOTICE '  2. K350,000 (Roofing Materials) - ⚠ PENDING - Risk: 95 (HIGH)';
  RAISE NOTICE '';
  RAISE NOTICE 'The K350,000 payment should display:';
  RAISE NOTICE '  • Red Pulse Animation on PaymentApprovalCard';
  RAISE NOTICE '  • "⚠ High Anomaly Detected" badge';
  RAISE NOTICE '  • 5 AI-generated warning flags';
  RAISE NOTICE '============================================================';
  
END $$;

-- ============================================================
-- VERIFICATION QUERY - Run this to confirm data was seeded
-- ============================================================
SELECT 
  p.project_number,
  p.name AS project_name,
  p.budget,
  p.spent,
  (p.budget - p.spent) AS remaining_budget,
  pay.payment_number,
  pay.amount,
  pay.milestone,
  pay.status,
  pay.ai_risk_score,
  pay.ai_risk_level,
  jsonb_array_length(pay.ai_flags) AS flag_count
FROM projects p
JOIN payments pay ON pay.project_id = p.id
WHERE p.name = 'Kabwata School Roof Renovation'
ORDER BY pay.amount;
