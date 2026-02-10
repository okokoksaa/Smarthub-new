# ECZ Data Conversion Guide

This guide helps you convert your Electoral Commission of Zambia (ECZ) CSV/Excel files into SQL INSERT statements for the CDF Smart Hub database.

## Step 1: Prepare Your ECZ Data Files

You should have two files:
1. **Constituencies file** - All 156 constituencies
2. **Wards file** - All 1,820+ wards

### Required Columns for Constituencies

Your Excel/CSV should have these columns (column names can vary):

| Column Name | Example Value | Required | Notes |
|------------|---------------|----------|-------|
| Constituency Name | Kabwata | Yes | Full name |
| District | Lusaka | Yes | Must match existing district |
| Province | Lusaka Province | Yes | For reference |
| Constituency Code | KABW | Optional | We'll generate if missing |
| MP Name | Hon. John Doe | Optional | Use "TBD" if not available |
| Political Party | UPND | Optional | Use "TBD" if not available |
| Registered Voters | 51234 | Yes | Number of registered voters |
| Population | 89543 | Optional | Estimate is fine |

### Required Columns for Wards

| Column Name | Example Value | Required | Notes |
|------------|---------------|----------|-------|
| Ward Name | Kabwata Ward 1 | Yes | Full name |
| Constituency | Kabwata | Yes | Parent constituency |
| Ward Code | KABW-01 | Optional | We'll generate if missing |
| Population | 12000 | Optional | Estimate is fine |
| Registered Voters | 7200 | Optional | ~60% of population |

## Step 2: District Code Mapping

Match your districts to these codes:

### Central Province (CP)
- Kabwe → CP-KAB
- Kapiri Mposhi → CP-KAP
- Mkushi → CP-MKU
- Mumbwa → CP-MUM
- Serenje → CP-SER
- Chibombo → CP-CHB
- Luano → CP-LUA
- Chitambo → CP-CHT
- Ngabwe → CP-NGB
- Shibuyunji → CP-SHB

### Copperbelt Province (CB)
- Ndola → CB-NDL
- Kitwe → CB-KIT
- Luanshya → CB-LUA
- Mufulira → CB-MUF
- Chingola → CB-CHI
- Chililabombwe → CB-CHL
- Kalulushi → CB-KAL
- Lufwanyama → CB-LUF
- Masaiti → CB-MAS
- Mpongwe → CB-MPO

### Eastern Province (EP)
- Chipata → EP-CHP
- Katete → EP-KAT
- Lundazi → EP-LUN
- Chadiza → EP-CHD
- Chama → EP-CHM
- Petauke → EP-PET
- Nyimba → EP-NYI
- Sinda → EP-SIN
- Vubwi → EP-VUB
- Mambwe → EP-MAM

### Luapula Province (LP)
- Mansa → LP-MAN
- Nchelenge → LP-NCH
- Kawambwa → LP-KAW
- Samfya → LP-SAM
- Mwense → LP-MWE
- Mwansabombwe → LP-MWA
- Chembe → LP-CHE
- Lunga → LP-LUN
- Milenge → LP-MIL
- Chipili → LP-CHP

### Lusaka Province (LSK)
- Lusaka → LSK-LSK
- Kafue → LSK-KFU
- Chongwe → LSK-CHO
- Luangwa → LSK-LUA
- Rufunsa → LSK-RUF
- Chirundu → LSK-CHR

### Muchinga Province (MP)
- Chinsali → MP-CHN
- Isoka → MP-ISO
- Nakonde → MP-NAK
- Mpika → MP-MPI
- Shiwang'andu → MP-SHI
- Kanchibiya → MP-KAN
- Lavushimanda → MP-LAV
- Mafinga → MP-MAF

### Northern Province (NP)
- Kasama → NP-KSM
- Mbala → NP-MBA
- Luwingu → NP-LUW
- Kaputa → NP-KAP
- Mporokoso → NP-MPO
- Nsama → NP-NSA
- Lupososhi → NP-LUP
- Lunte → NP-LUN
- Senga Hill → NP-SEN
- Chilubi → NP-CHI

### North-Western Province (NWP)
- Solwezi → NWP-SOL
- Mwinilunga → NWP-MWI
- Kabompo → NWP-KAB
- Kasempa → NWP-KAS
- Zambezi → NWP-ZAM
- Mufumbwe → NWP-MUF
- Mushindamo → NWP-MUS
- Ikelenge → NWP-IKE

### Southern Province (SP)
- Choma → SP-CHO
- Livingstone → SP-LIV
- Monze → SP-MON
- Mazabuka → SP-MAZ
- Namwala → SP-NAM
- Kalomo → SP-KAL
- Kazungula → SP-KAZ
- Gwembe → SP-GWE
- Sinazongwe → SP-SIN
- Siavonga → SP-SIA
- Pemba → SP-PEM
- Zimba → SP-ZIM
- Chikankata → SP-CHI

### Western Province (WP)
- Mongu → WP-MON
- Senanga → WP-SEN
- Kaoma → WP-KAO
- Lukulu → WP-LUK
- Kalabo → WP-KAL
- Sesheke → WP-SES
- Shangombo → WP-SHA
- Nalolo → WP-NAL
- Luampa → WP-LUA
- Mitete → WP-MIT
- Sikongo → WP-SIK
- Mulobezi → WP-MUL
- Nkeyema → WP-NKE
- Limulunga → WP-LIM

## Step 3: Excel Formula Method (Fastest)

If using Excel/Google Sheets, you can auto-generate SQL INSERT statements using formulas.

### For Constituencies:

In a new column, use this formula (adjust cell references):

```excel
="(get_district_id('"&B2&"'), '"&C2&"', '"&A2&"', '"&IF(D2="","TBD",D2)&"', '"&IF(E2="","TBD",E2)&"', '2021-08-12', 1600000.00, 1600000.00, "&F2&", "&G2&", 'Zanaco', '1"&TEXT(ROW(),"000000")&"', 'Lusaka Main', true),"
```

Where:
- A2 = Constituency Name
- B2 = District Code (you'll need to add this column using VLOOKUP/mapping)
- C2 = Constituency Code (first 4 letters of name, uppercase)
- D2 = MP Name
- E2 = Party
- F2 = Registered Voters
- G2 = Population

### For Wards:

```excel
="(get_constituency_id('"&B2&"'), '"&C2&"', '"&A2&"', "&D2&", "&E2&", true),"
```

Where:
- A2 = Ward Name
- B2 = Constituency Code
- C2 = Ward Code (constituency code + "-" + sequential number)
- D2 = Population (or blank)
- E2 = Registered Voters (or blank)

## Step 4: Manual Conversion Template

If you prefer manual conversion or have a small dataset, use these templates:

### Constituencies Template:

```sql
-- Helper function (run once at the top)
CREATE OR REPLACE FUNCTION get_district_id(d_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM districts WHERE code = d_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- INSERT statements (one per constituency)
INSERT INTO constituencies (
    district_id, code, name,
    current_mp_name, current_mp_party, current_mp_elected_date,
    annual_cdf_allocation, current_year_allocation,
    registered_voters, population,
    bank_name, bank_account_number, bank_branch,
    is_active
) VALUES
    (get_district_id('LSK-LSK'), 'KABW', 'Kabwata', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 51234, 89543, 'Zanaco', '1000123456', 'Lusaka Main', true),
    (get_district_id('LSK-LSK'), 'MANS', 'Mandevu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 62893, 110456, 'Stanbic', '9200234567', 'Lusaka Branch', true),
    -- Add more constituencies...
    (get_district_id('CB-NDL'), 'NDOL', 'Ndola Central', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 54789, 97234, 'Zanaco', '1000789012', 'Ndola Main', true);
    -- IMPORTANT: Last entry should NOT have a trailing comma
```

### Wards Template:

```sql
-- Helper function
CREATE OR REPLACE FUNCTION get_constituency_id(c_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM constituencies WHERE code = c_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- INSERT statements grouped by constituency
-- Kabwata Constituency Wards
INSERT INTO wards (constituency_id, code, name, population, registered_voters, is_active) VALUES
    (get_constituency_id('KABW'), 'KABW-01', 'Kabwata Ward 1', 12000, 7200, true),
    (get_constituency_id('KABW'), 'KABW-02', 'Kabwata Ward 2', 11500, 6900, true),
    (get_constituency_id('KABW'), 'KABW-03', 'Kabwata Ward 3', 13200, 7920, true),

-- Mandevu Constituency Wards
    (get_constituency_id('MANS'), 'MANS-01', 'Mandevu Ward 1', 15600, 9360, true),
    (get_constituency_id('MANS'), 'MANS-02', 'Mandevu Ward 2', 14200, 8520, true);
    -- Last entry NO comma
```

## Step 5: Validation Before Saving

Before saving your SQL files, validate:

1. **Correct syntax**:
   - All strings in single quotes: `'Kabwata'`
   - Numbers without quotes: `51234`
   - No trailing comma on last INSERT value
   - Each value separated by commas
   - Helper function created before INSERT statements

2. **Data integrity**:
   - All district codes exist in the mapping above
   - No duplicate constituency codes
   - No duplicate ward codes
   - All wards reference valid constituency codes

3. **Quick counts**:
   ```bash
   # Count constituencies
   grep -c "get_district_id" constituencies_ecz_full.sql
   # Should be 156

   # Count wards
   grep -c "get_constituency_id" wards_ecz_full.sql
   # Should be 1820+
   ```

## Step 6: Save Your Files

Save as:
- `/backend/database/seed-data/constituencies_ecz_full.sql`
- `/backend/database/seed-data/wards_ecz_full.sql`

## Need Help?

If you run into issues:
1. Share a sample of your ECZ data (5-10 rows)
2. I'll generate the SQL conversion for you
3. You can then replicate the pattern for the remaining data

Common issues:
- **District code mismatch**: Check the mapping table above
- **Syntax errors**: Usually missing/extra commas or quotes
- **Special characters**: Use `\'` for apostrophes in names (e.g., `'O\'Brien'`)
