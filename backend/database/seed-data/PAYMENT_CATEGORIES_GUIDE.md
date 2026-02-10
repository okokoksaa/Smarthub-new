# CDF Smart Hub - Payment Categories Guide

## Overview

The CDF Smart Hub uses a flexible payment categorization system with two main dimensions:

1. **Project Sectors** (what the project is about)
2. **Payment Milestones** (what stage of payment)

---

## 1. Project Sectors (Categories)

Payments inherit their category from the parent project's sector:

| Sector | Description | Typical Projects |
|--------|-------------|------------------|
| **Education** | Schools, classrooms, training | Classroom construction, teacher housing, school furniture, bursaries |
| **Health** | Medical facilities & services | Health posts, clinics, medical equipment, ambulances |
| **Water** | Water supply & sanitation | Boreholes, water reticulation, community taps, sanitation |
| **Roads** | Transport infrastructure | Road construction/maintenance, bridges, culverts, drainage |
| **Agriculture** | Farming & food security | Irrigation, storage, farmer training, inputs support |
| **Community** | Community infrastructure | Community halls, markets, sports facilities |
| **Energy** | Power & electricity | Solar installations, mini-grids, electrification |
| **Governance** | Admin & civic engagement | Office buildings, civic centers, e-government |
| **Other** | Miscellaneous projects | Any other constituency development project |

---

## 2. Payment Milestones (Types)

Standard payment milestones for CDF projects:

### A. Construction/Infrastructure Projects

| Milestone | % of Total | Timing | Description |
|-----------|-----------|---------|-------------|
| **Mobilization** | 10-20% | Contract signing | Initial advance to contractor for setup |
| **Materials Procurement** | 20-30% | After delivery | Payment for materials delivered to site |
| **Progress Payment 1** | 25-30% | 25-40% complete | Foundation/initial phase complete |
| **Progress Payment 2** | 20-25% | 50-70% complete | Mid-project milestone |
| **Progress Payment 3** | 10-15% | 80-90% complete | Near completion payment |
| **Final Payment** | 5-10% | 100% complete | Project handover and final accounts |
| **Retention Release** | 5-10% | 6-12 months later | After defects liability period |

### B. Special Payment Types

| Type | Use Case | Typical Amount |
|------|----------|----------------|
| **Variation Order** | Approved scope changes | Variable |
| **Emergency Payment** | Urgent repairs/interventions | As needed |
| **Equipment Advance** | Specialized equipment | 30-50% of equipment cost |
| **Professional Fees** | Consultants, engineers, architects | 5-10% of project cost |
| **Community Labor** | Community-driven projects | Variable |

### C. Social Program Payments

| Type | Use Case | Typical Amount |
|------|----------|----------------|
| **Bursary Disbursement** | Student education support | K2,000-K8,000/student/year |
| **Empowerment Grant** | Small business support | K5,000-K50,000 per beneficiary |
| **Skills Training** | Vocational training | K3,000-K15,000 per trainee |

---

## 3. Payment Amount Guidelines by Sector

### Education Sector
- Classroom construction: **K50,000 - K500,000** per classroom
- School furniture (desks, chairs): **K20,000 - K100,000**
- Teacher housing (1 unit): **K80,000 - K300,000**
- Bursaries: **K2,000 - K8,000** per student per year
- Library/Lab equipment: **K50,000 - K200,000**

### Health Sector
- Health post construction: **K300,000 - K800,000**
- Clinic renovation: **K100,000 - K400,000**
- Medical equipment: **K100,000 - K500,000**
- Staff housing: **K120,000 - K350,000**
- Ambulance: **K200,000 - K600,000**

### Water Sector
- Borehole with solar pump: **K80,000 - K200,000**
- Community tap stand: **K30,000 - K80,000**
- Water reticulation system: **K500,000 - K2,000,000**
- Sanitation facility: **K50,000 - K150,000**

### Roads Sector
- Gravel road construction: **K150,000 - K400,000** per km
- Road maintenance: **K50,000 - K150,000** per km
- Drainage construction: **K100,000 - K300,000**
- Bridge/culvert: **K200,000 - K1,000,000**

### Agriculture Sector
- Irrigation system: **K300,000 - K1,200,000**
- Storage facility: **K150,000 - K600,000**
- Farmer training center: **K200,000 - K800,000**
- Inputs support (seeds, fertilizer): **K50,000 - K300,000**

### Community Infrastructure
- Community hall: **K400,000 - K1,200,000**
- Market shelter: **K150,000 - K500,000**
- Sports facility: **K300,000 - K900,000**
- Playground equipment: **K80,000 - K250,000**

### Energy Sector
- Solar installation (school/clinic): **K100,000 - K400,000**
- Mini-grid system: **K500,000 - K2,000,000**
- Street lighting: **K50,000 - K200,000** per km

---

## 4. Payment Approval Workflow

```
┌─────────────────────────────────────────────────┐
│  1. Payment Request Submission                  │
│     Contractor/beneficiary submits              │
│     Status: pending_submission                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  2. CDFC Verification (Panel A)                 │
│     Committee reviews & site inspection         │
│     Status: pending_cdfc_approval               │
│     Approvers: cdfc_chair, cdfc_member          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  3. Technical Verification (Panel B)            │
│     Technical officers verify quality           │
│     Status: pending_technical_approval          │
│     Approvers: finance_officer, plgo            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  4. AI Risk Analysis                            │
│     Automated anomaly detection                 │
│     Risk score: 0-100                           │
│     Risk level: low/medium/high/critical        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  5. Financial Approval                          │
│     Budget check & authorization                │
│     Status: approved                            │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  6. Payment Execution                           │
│     Bank transfer initiated                     │
│     Status: executed                            │
│     Transaction reference recorded              │
└─────────────────────────────────────────────────┘
```

---

## 5. Risk Flags & AI Analysis

The system automatically flags suspicious payments:

### Amount-Based Risks
- **excessive_amount**: Payment exceeds typical range for sector
- **round_number**: Suspiciously round amount (e.g., exactly K100,000.00)
- **budget_overrun**: Exceeds allocated project budget

### Timing Risks
- **too_fast**: Payment requested too soon after previous payment
- **too_slow**: Unusual delay between milestones
- **weekend_submission**: Submitted on weekend (unusual pattern)

### Beneficiary Risks
- **new_beneficiary**: First-time contractor (requires extra scrutiny)
- **blacklisted**: Beneficiary on watch list
- **duplicate_account**: Same bank account used multiple times

### Pattern Risks
- **split_payment**: Appears to be split to avoid oversight threshold
- **similar_invoice**: Invoice number pattern matches known fraud
- **ghost_project**: No matching project milestones

### Document Risks
- **missing_invoice**: No supporting invoice attached
- **fake_signature**: Digital signature mismatch
- **altered_document**: Document shows signs of tampering

---

## 6. How to Use in Frontend

### Dropdown for Payment Milestone:
```typescript
const paymentMilestones = [
  { value: 'mobilization', label: 'Mobilization (10-20%)', percentage: 15 },
  { value: 'materials', label: 'Materials Procurement (20-30%)', percentage: 25 },
  { value: 'progress_1', label: 'Progress Payment 1 (25-30%)', percentage: 27 },
  { value: 'progress_2', label: 'Progress Payment 2 (20-25%)', percentage: 22 },
  { value: 'progress_3', label: 'Progress Payment 3 (10-15%)', percentage: 12 },
  { value: 'final', label: 'Final Payment (5-10%)', percentage: 8 },
  { value: 'retention', label: 'Retention Release (5-10%)', percentage: 6 },
  { value: 'variation', label: 'Variation Order', percentage: null },
  { value: 'emergency', label: 'Emergency Payment', percentage: null },
  { value: 'fees', label: 'Professional Fees', percentage: null },
  { value: 'bursary', label: 'Bursary Disbursement', percentage: null },
  { value: 'empowerment', label: 'Empowerment Grant', percentage: null },
]
```

### Example Payment Creation:
```typescript
const payment = {
  project_id: 'project-uuid',
  beneficiary_name: 'ABC Construction Ltd',
  amount: 150000.00,
  milestone: 'mobilization',  // Payment milestone/category
  description: 'Mobilization payment for classroom construction - 15% of K1,000,000',
  beneficiary_bank: 'Zanaco',
  beneficiary_account: '1234567890',
  invoice_number: 'INV-2025-001',
  invoice_date: '2025-01-10',
  status: 'pending_submission'
}
```

### Filtering Payments by Category:
```typescript
// Get all education sector payments
const educationPayments = await supabase
  .from('payments')
  .select(`
    *,
    project:projects(sector, name)
  `)
  .eq('project.sector', 'education')

// Get all mobilization payments
const mobilizationPayments = await supabase
  .from('payments')
  .select('*')
  .eq('milestone', 'mobilization')
```

---

## 7. Best Practices

1. **Always link payments to projects** - Don't create standalone payments
2. **Use standard milestones** - Helps with reporting and auditing
3. **Attach supporting documents** - Invoices, receipts, progress photos
4. **Follow the approval workflow** - Don't skip steps
5. **Monitor AI risk scores** - Investigate high-risk payments
6. **Keep audit trail** - All approvals and modifications logged
7. **Use retention** - Hold back 5-10% until defects period ends

---

## 8. Reporting Queries

### Payments by Sector:
```sql
SELECT
  p.sector,
  COUNT(pay.id) as payment_count,
  SUM(pay.amount) as total_disbursed
FROM payments pay
JOIN projects p ON p.id = pay.project_id
GROUP BY p.sector
ORDER BY total_disbursed DESC;
```

### Payments by Milestone:
```sql
SELECT
  milestone,
  COUNT(*) as count,
  AVG(amount) as avg_amount,
  SUM(amount) as total_amount
FROM payments
WHERE status = 'executed'
GROUP BY milestone
ORDER BY total_amount DESC;
```

### High-Risk Payments:
```sql
SELECT
  payment_number,
  beneficiary_name,
  amount,
  ai_risk_score,
  ai_risk_level,
  ai_flags
FROM payments
WHERE ai_risk_level IN ('high', 'critical')
  AND status != 'rejected'
ORDER BY ai_risk_score DESC;
```

---

**File:** `/backend/database/seed-data/06_payment_categories.sql`
**Status:** ✅ Created and ready for reference

This data is primarily for documentation - the actual categories are used via:
- `projects.sector` (enum field)
- `payments.milestone` (text field)
