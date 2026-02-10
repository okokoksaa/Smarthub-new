# CDF Smart Hub - Data Loading Instructions

## Status: Ready to Load ✅

You have **149 constituencies** and **1,416 wards** ready to load into Supabase!

---

## Step-by-Step Loading Process

### STEP 1: Backup Current Database (5 minutes)

**Via Supabase Dashboard:**
1. Navigate to: https://app.supabase.com/project/yabmrdsavbrcfreowygn/database/backups
2. Click **"Create Backup"**
3. Label: `Pre-Full-Data-Load-Jan-20-2026`
4. Click **"Confirm"**
5. Wait for backup to complete

**Or via CLI** (if you have Supabase CLI installed):
```bash
cd "/Users/joseph-jameskapambwe/Desktop/cdf hun new/Smarthub-new/frontend"
supabase db dump > ~/backup_before_full_load_$(date +%Y%m%d).sql
```

---

### STEP 2: Add Missing Districts (2 minutes)

**File:** `/backend/database/seed-data/02a_missing_districts.sql`

1. Open Supabase SQL Editor: https://app.supabase.com/project/yabmrdsavbrcfreowygn/sql/new
2. Copy the entire content of `02a_missing_districts.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. Verify: Should see "✓ 3 missing districts added"

**Expected result:** 3 new districts added:
- Mpulungu (Northern)
- Mungwi (Northern)
- Itezhi-Tezhi (Southern)

---

### STEP 3: Add Schema Fields (Optional - 3 minutes)

The schema migration adds optional fields like `current_mp_name`, `bank_account_number`, etc.

**File:** Plan file includes the migration SQL

1. Open new SQL Editor tab
2. Paste this SQL:

```sql
-- Add missing columns to constituencies (if not exists)
ALTER TABLE constituencies
  ADD COLUMN IF NOT EXISTS current_mp_name TEXT,
  ADD COLUMN IF NOT EXISTS current_mp_party TEXT,
  ADD COLUMN IF NOT EXISTS current_mp_elected_date DATE,
  ADD COLUMN IF NOT EXISTS annual_cdf_allocation NUMERIC(15,2) DEFAULT 1600000.00,
  ADD COLUMN IF NOT EXISTS current_year_allocation NUMERIC(15,2) DEFAULT 1600000.00,
  ADD COLUMN IF NOT EXISTS registered_voters INTEGER,
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to wards
ALTER TABLE wards
  ADD COLUMN IF NOT EXISTS registered_voters INTEGER,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
```

3. Click **"Run"**

---

### STEP 4: Load All Constituencies (5 minutes)

**File:** `/backend/database/seed-data/zambia_full_admin_data.sql`

**Important:** This file is 130KB and contains 149 constituencies + 1,416 wards

1. Open **new SQL Editor tab**: https://app.supabase.com/project/yabmrdsavbrcfreowygn/sql/new
2. Open the file `zambia_full_admin_data.sql` in a text editor
3. **Copy ONLY the constituencies section** (lines 1-170 approximately):
   - From: `-- CONSTITUENCIES`
   - To: `✓ 149 constituencies loaded`
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait 30-60 seconds for completion
7. Verify: Check for success message

**Verification query:**
```sql
SELECT COUNT(*) FROM constituencies;
-- Expected: 196 (47 existing + 149 new)
```

---

### STEP 5: Load All Wards (10 minutes)

1. Open **new SQL Editor tab**
2. Open `zambia_full_admin_data.sql` again
3. **Copy ONLY the wards section** (lines 170-end):
   - From: `-- WARDS`
   - To: `✓ 1416 wards loaded`
4. Paste into SQL Editor
5. Click **"Run"**
6. **Wait 2-3 minutes** (1,416 rows takes time)
7. Verify: Check for success message

**Verification query:**
```sql
SELECT COUNT(*) FROM wards;
-- Expected: 1,518 (102 existing + 1,416 new)
```

---

### STEP 6: Verify Data Integrity (5 minutes)

Run these verification queries in SQL Editor:

**1. Check geographic hierarchy:**
```sql
SELECT
  p.name AS province,
  COUNT(DISTINCT d.id) AS districts,
  COUNT(DISTINCT c.id) AS constituencies,
  COUNT(DISTINCT w.id) AS wards
FROM provinces p
LEFT JOIN districts d ON d.province_id = p.id
LEFT JOIN constituencies c ON c.district_id = d.id
LEFT JOIN wards w ON w.constituency_id = c.id
GROUP BY p.id, p.name
ORDER BY p.name;
```

**Expected:** All 10 provinces with data

**2. Check for orphaned records:**
```sql
SELECT 'Orphaned Constituencies' as issue, COUNT(*) as count
FROM constituencies c
WHERE c.district_id NOT IN (SELECT id FROM districts)
UNION ALL
SELECT 'Orphaned Wards', COUNT(*)
FROM wards w
WHERE w.constituency_id NOT IN (SELECT id FROM constituencies);
```

**Expected:** Both counts should be 0

**3. Check constituency distribution:**
```sql
SELECT
  d.name as district,
  COUNT(c.id) as constituencies
FROM districts d
LEFT JOIN constituencies c ON c.district_id = d.id
GROUP BY d.id, d.name
HAVING COUNT(c.id) > 0
ORDER BY COUNT(c.id) DESC
LIMIT 20;
```

**Expected:** Reasonable distribution across districts

---

### STEP 7: Test Frontend Geography Hooks (3 minutes)

1. Ensure frontend dev server is running: http://localhost:8080
2. Navigate to any page with geography dropdowns (e.g., `/projects/create`)
3. Test cascading dropdowns:
   - Select **Province** → Should show all 10 provinces
   - Select **District** → Should show correct districts
   - Select **Constituency** → Should now show **196 total** (47 old + 149 new)
   - Select **Ward** → Should show wards for selected constituency

---

## If Something Goes Wrong

### Rollback Option 1: Restore from Backup

1. Go to: https://app.supabase.com/project/yabmrdsavbrcfreowygn/database/backups
2. Find your backup: `Pre-Full-Data-Load-Jan-20-2026`
3. Click **"..."** → **"Restore"**
4. Confirm restoration

### Rollback Option 2: Delete New Data

```sql
-- Remove newly added constituencies (keep original 47)
DELETE FROM constituencies
WHERE id NOT IN (
  SELECT id FROM constituencies
  ORDER BY created_at
  LIMIT 47
);

-- Remove newly added wards (keep original 102)
DELETE FROM wards
WHERE id NOT IN (
  SELECT id FROM wards
  ORDER BY created_at
  LIMIT 102
);

-- Verify counts
SELECT COUNT(*) FROM constituencies;  -- Should be 47
SELECT COUNT(*) FROM wards;           -- Should be 102
```

---

## File Locations

| File | Path | Purpose |
|------|------|---------|
| **Missing Districts** | `/backend/database/seed-data/02a_missing_districts.sql` | Add 3 missing districts |
| **Full Admin Data** | `/backend/database/seed-data/zambia_full_admin_data.sql` | 149 constituencies + 1,416 wards |
| **Payment Categories** | `/backend/database/seed-data/06_payment_categories.sql` | Payment milestone reference |
| **Conversion Script** | `/backend/database/seed-data/convert_full_admin_data.py` | Python converter (for future use) |
| **This Guide** | `/LOAD_DATA_INSTRUCTIONS.md` | You are here |

---

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| 1. Backup Database | 5 min | ⏳ Pending |
| 2. Add Missing Districts | 2 min | ⏳ Pending |
| 3. Schema Migration | 3 min | ⏳ Pending |
| 4. Load Constituencies | 5 min | ⏳ Pending |
| 5. Load Wards | 10 min | ⏳ Pending |
| 6. Verify Data | 5 min | ⏳ Pending |
| 7. Test Frontend | 3 min | ⏳ Pending |
| **Total** | **33 min** | |

---

## Next Steps After Data Loading

Once data is loaded successfully:

1. ✅ **Create 17 pilot users** (via Supabase Dashboard)
   - Follow the plan in `/Users/joseph-jameskapambwe/.claude/plans/prancy-tinkering-glacier.md`
   - Section: "PHASE 4: Create Pilot Users"

2. ✅ **Test role-based access** (login as different roles)
   - Super admin, PLGO, MP, CDFC chair, WDC member, etc.

3. ✅ **Run end-to-end tests**
   - Create project in Kabwata constituency
   - Submit payment request
   - Test approval workflow

4. ✅ **Document pilot user credentials**
   - Create spreadsheet with emails and roles
   - Share with stakeholders

---

## Quick Reference

**Supabase Dashboard:** https://app.supabase.com/project/yabmrdsavbrcfreowygn

**SQL Editor:** https://app.supabase.com/project/yabmrdsavbrcfreowygn/sql/new

**Backups:** https://app.supabase.com/project/yabmrdsavbrcfreowygn/database/backups

**Frontend:** http://localhost:8080

---

**Status:** Ready to load! Follow steps 1-7 above. 🚀
