-- ============================================================================
-- CDF SMART HUB - SEED DATA: PAYMENT CATEGORIES & MILESTONES
-- ============================================================================
-- Purpose: Define standard payment categories, milestones, and types for CDF projects
-- Note: This provides reference data for payment workflows
-- ============================================================================

\echo 'Loading seed data: Payment Categories and Milestones'

-- ============================================================================
-- NOTE: Payments in CDF Smart Hub are linked to projects
-- Projects have sectors: education, health, water, roads, agriculture, community, energy, governance, other
-- Payments have milestones which represent payment types/stages
-- ============================================================================

-- Common CDF Payment Milestones/Categories
-- These are typically used in the "milestone" field of the payments table

/*
Standard CDF Payment Categories by Milestone:

1. MOBILIZATION PAYMENTS (10-20% of contract value)
   - Initial advance payment to contractor
   - Typically 15% of total project cost
   - Paid upon contract signing and site handover

2. MATERIALS PROCUREMENT (20-30%)
   - Payment for materials delivered to site
   - Verified by project committee
   - Invoice-based payment

3. PROGRESS PAYMENT 1 (25-30%)
   - Based on work completion (e.g., foundation complete)
   - Requires site inspection and verification
   - Milestone: 25-40% completion

4. PROGRESS PAYMENT 2 (20-25%)
   - Mid-project milestone payment
   - Milestone: 50-70% completion
   - Verified by technical committee

5. PROGRESS PAYMENT 3 (10-15%)
   - Near-completion payment
   - Milestone: 80-90% completion
   - Pending final inspection

6. RETENTION RELEASE (5-10%)
   - Held back until defects liability period ends
   - Typically 6-12 months after completion
   - Released after satisfactory performance

7. FINAL PAYMENT (5-10%)
   - Completion and handover
   - All defects rectified
   - Final accounts reconciled

8. ADDITIONAL CATEGORIES:
   - Variation Order Payment (approved changes to scope)
   - Emergency Payment (urgent repairs/interventions)
   - Advance for Equipment (specialized equipment procurement)
   - Professional Fees (consultants, architects, engineers)
   - Community Labor Payment (for community-driven projects)
   - Bursary Disbursement (education grants)
   - Empowerment Grant (small business support)
*/

-- ============================================================================
-- EXAMPLE: Insert sample payment milestones (for documentation/reference)
-- ============================================================================
-- Note: These are stored in the "milestone" text field, not a separate table
-- This is reference data for frontend dropdowns and validation

-- In a real implementation, you might want to create a reference table:
-- CREATE TABLE payment_milestones (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     code VARCHAR(50) UNIQUE NOT NULL,
--     name VARCHAR(200) NOT NULL,
--     description TEXT,
--     typical_percentage NUMERIC(5,2),
--     sequence_order INTEGER,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMPTZ DEFAULT now()
-- );

-- For now, common milestone values stored in "milestone" field include:
-- - "Mobilization" or "mobilization_payment"
-- - "Materials Procurement" or "materials"
-- - "Progress Payment 1" or "progress_1"
-- - "Progress Payment 2" or "progress_2"
-- - "Progress Payment 3" or "progress_3"
-- - "Final Payment" or "final"
-- - "Retention Release" or "retention"
-- - "Variation Order" or "variation"
-- - "Professional Fees" or "fees"
-- - "Bursary Disbursement" or "bursary"
-- - "Empowerment Grant" or "empowerment"
-- - "Emergency Payment" or "emergency"
-- - "Community Labor" or "community_labor"

-- ============================================================================
-- PAYMENT AMOUNT GUIDELINES BY PROJECT SECTOR
-- ============================================================================

/*
EDUCATION SECTOR:
- Classroom construction: K50,000 - K500,000 per classroom
- School furniture: K20,000 - K100,000
- Teacher housing: K80,000 - K300,000
- Bursaries: K2,000 - K8,000 per student per year

HEALTH SECTOR:
- Health post construction: K300,000 - K800,000
- Medical equipment: K100,000 - K500,000
- Staff housing: K120,000 - K350,000
- Ambulance: K200,000 - K600,000

WATER SECTOR:
- Borehole with solar pump: K80,000 - K200,000
- Community tap stand: K30,000 - K80,000
- Water reticulation: K500,000 - K2,000,000

ROADS SECTOR:
- Gravel road (per km): K150,000 - K400,000
- Drainage construction: K100,000 - K300,000
- Bridge/culvert: K200,000 - K1,000,000

AGRICULTURE SECTOR:
- Irrigation system: K300,000 - K1,200,000
- Storage facility: K150,000 - K600,000
- Farmer training center: K200,000 - K800,000
- Inputs support: K50,000 - K300,000

COMMUNITY INFRASTRUCTURE:
- Community hall: K400,000 - K1,200,000
- Market shelter: K150,000 - K500,000
- Sports facility: K300,000 - K900,000

ENERGY:
- Solar installation (school/clinic): K100,000 - K400,000
- Mini-grid system: K500,000 - K2,000,000
*/

-- ============================================================================
-- PAYMENT APPROVAL WORKFLOW
-- ============================================================================

/*
Standard CDF Payment Approval Process:

1. PAYMENT REQUEST SUBMISSION
   - Contractor/beneficiary submits payment request
   - Attaches supporting documents (invoices, receipts, progress photos)
   - Status: "pending_submission"

2. CDFC VERIFICATION (Panel A)
   - Constituency Development Fund Committee reviews
   - Site inspection if required
   - Status: "pending_cdfc_approval"
   - Approver: cdfc_chair or cdfc_member

3. TECHNICAL VERIFICATION (Panel B)
   - District technical officers verify
   - Quality and compliance check
   - Status: "pending_technical_approval"
   - Approver: finance_officer or plgo

4. AI RISK ANALYSIS
   - Automated risk scoring
   - Anomaly detection
   - Risk flags generated
   - Risk levels: low, medium, high, critical

5. FINANCIAL APPROVAL
   - Finance officer authorizes
   - Budget availability check
   - Status: "approved"

6. PAYMENT EXECUTION
   - Bank transfer initiated
   - Transaction reference recorded
   - Status: "executed"
   - Beneficiary receives funds

7. AUDIT TRAIL
   - All actions logged
   - Document immutability enforced
   - Blockchain hash for critical payments
*/

-- ============================================================================
-- RISK FLAGS FOR PAYMENTS
-- ============================================================================

/*
AI Risk Flags (stored in ai_flags JSONB field):

1. AMOUNT-BASED RISKS:
   - "excessive_amount": Payment exceeds typical range for sector
   - "round_number": Suspiciously round payment amount
   - "budget_overrun": Exceeds allocated project budget

2. TIMING RISKS:
   - "too_fast": Payment requested too soon after previous
   - "too_slow": Unusual delay in payment request
   - "weekend_submission": Submitted on weekend (unusual)

3. BENEFICIARY RISKS:
   - "new_beneficiary": First-time contractor
   - "blacklisted": Beneficiary on watch list
   - "duplicate_account": Same bank account used multiple times

4. PATTERN RISKS:
   - "split_payment": Appears to be split to avoid threshold
   - "similar_invoice": Invoice number pattern suspicious
   - "ghost_project": No matching project milestones

5. DOCUMENT RISKS:
   - "missing_invoice": No supporting invoice
   - "fake_signature": Digital signature mismatch
   - "altered_document": Document shows signs of tampering
*/

\echo '✓ Payment categories reference data loaded'
\echo ''
\echo 'Payment milestones available:'
\echo '  - Mobilization (10-20%)'
\echo '  - Materials Procurement (20-30%)'
\echo '  - Progress Payments 1-3 (50-60% combined)'
\echo '  - Final Payment (5-10%)'
\echo '  - Retention Release (5-10%)'
\echo ''
\echo 'Project sectors (for categorization):'
\echo '  - Education, Health, Water, Roads, Agriculture'
\echo '  - Community, Energy, Governance, Other'
\echo ''
