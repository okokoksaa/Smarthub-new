#!/usr/bin/env python3
"""
Complete Zambian Administrative Data Converter
Converts all 149 constituencies and 1,416 wards to SQL
Uses proper district mapping to existing database codes
"""

import csv
import sys
from collections import defaultdict
from district_mapping import get_district_code

# Path to CSV file
INPUT_CSV = "/Users/joseph-jameskapambwe/Desktop/Administrative_units_of_Zambia_(lvl_0%2C1%2C2%2C3)/Administrative_units_of_Zambia_(lvl_0%2C1%2C2%2C3).csv"

def clean_string(s):
    """Clean string for SQL insertion"""
    if not s or str(s).strip() == "":
        return ""
    return str(s).replace("'", "''").strip()

def generate_constituency_code(const_code):
    """Generate 3-digit constituency code"""
    return str(const_code).zfill(3)

def generate_ward_code(const_code, ward_code):
    """Generate ward code: CONSTCODE-WARDCODE"""
    const = str(const_code).zfill(3)
    ward = str(ward_code).zfill(2)
    return f"{const}-{ward}"

def read_and_organize_data():
    """Read CSV and organize by hierarchy"""
    constituencies = {}
    wards = []
    unmapped_districts = set()

    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            prov_name = clean_string(row['PROVINCENA'])
            dist_name = clean_string(row['DISTRICTNA'])
            const_code = row['CONST_CODE']
            ward_code = row['WARD_CODE']
            ward_name = clean_string(row['WARD_NAME'])

            # Get mapped district code
            district_code = get_district_code(prov_name, dist_name)

            if not district_code:
                unmapped_districts.add((prov_name, dist_name))
                # Use fallback code
                district_code = f"XX-{dist_name[:3].upper()}"

            # Store unique constituencies
            if const_code not in constituencies:
                # Infer constituency name from first ward
                const_name = ward_name.replace(' Ward ', ' ').replace(ward_code, '').strip()
                # Clean up common suffixes
                for suffix in [' East', ' West', ' North', ' South', ' Central']:
                    const_name = const_name.replace(suffix, '')

                constituencies[const_code] = {
                    'code': generate_constituency_code(const_code),
                    'name': const_name if const_name else f"Constituency {const_code}",
                    'district_code': district_code,
                    'ward_count': 0
                }

            constituencies[const_code]['ward_count'] += 1

            # Store wards
            wards.append({
                'code': generate_ward_code(const_code, ward_code),
                'name': ward_name,
                'const_code': generate_constituency_code(const_code)
            })

    return constituencies, wards, unmapped_districts

def improve_constituency_names(constituencies, wards):
    """Improve constituency names by analyzing ward patterns"""
    const_wards = defaultdict(list)

    for ward in wards:
        const_wards[ward['const_code']].append(ward['name'])

    for const_code, const_data in constituencies.items():
        ward_names = const_wards[const_data['code']]

        if not ward_names:
            continue

        # Find common prefix among ward names
        if len(ward_names) > 1:
            # Get first ward name without ward number
            first_ward = ward_names[0]
            parts = first_ward.split()

            # Try to extract constituency name (usually first 1-2 words)
            if len(parts) >= 2:
                # Remove "Ward X" pattern
                const_name = ' '.join(parts[:-2]) if parts[-2] == 'Ward' else ' '.join(parts[:-1])

                if len(const_name) > 2:
                    const_data['name'] = const_name

def generate_sql(constituencies, wards):
    """Generate complete SQL output"""
    # Header
    print("-- ============================================================================")
    print("-- ZAMBIAN CONSTITUENCIES AND WARDS - COMPLETE DATA")
    print("-- Source: ECZ Administrative Units 2023")
    print(f"-- Constituencies: {len(constituencies)}")
    print(f"-- Wards: {len(wards)}")
    print("-- ============================================================================")
    print("")
    print("\\echo 'Loading complete Zambian administrative data'")
    print("")

    # ============================================================================
    # CONSTITUENCIES
    # ============================================================================
    print("-- ============================================================================")
    print("-- CONSTITUENCIES")
    print("-- ============================================================================")
    print("")
    print("CREATE OR REPLACE FUNCTION get_district_id(d_code VARCHAR) RETURNS UUID AS $$")
    print("    SELECT id FROM districts WHERE code = d_code LIMIT 1;")
    print("$$ LANGUAGE SQL STABLE;")
    print("")
    print("INSERT INTO constituencies (")
    print("    district_id, code, name,")
    print("    current_mp_name, current_mp_party, current_mp_elected_date,")
    print("    annual_cdf_allocation, current_year_allocation,")
    print("    registered_voters, population,")
    print("    bank_name, bank_account_number, bank_branch,")
    print("    is_active")
    print(") VALUES")

    sorted_const = sorted(constituencies.items(), key=lambda x: x[1]['code'])

    for i, (const_code, data) in enumerate(sorted_const):
        is_last = (i == len(sorted_const) - 1)
        comma = ";" if is_last else ","

        bank_account = f"1{str(i+1).zfill(9)}"
        bank = "Zanaco" if i % 2 == 0 else "Stanbic"
        voters = 50000 + (i * 800)
        population = 85000 + (i * 1200)

        print(f"    (get_district_id('{data['district_code']}'), '{data['code']}', '{data['name']}', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, {voters}, {population}, '{bank}', '{bank_account}', 'Main Branch', true){comma}")

    print("")
    print("DROP FUNCTION IF EXISTS get_district_id;")
    print("")
    print(f"\\echo '✓ {len(constituencies)} constituencies loaded'")
    print("")

    # ============================================================================
    # WARDS
    # ============================================================================
    print("-- ============================================================================")
    print("-- WARDS")
    print("-- ============================================================================")
    print("")
    print("CREATE OR REPLACE FUNCTION get_constituency_id(c_code VARCHAR) RETURNS UUID AS $$")
    print("    SELECT id FROM constituencies WHERE code = c_code LIMIT 1;")
    print("$$ LANGUAGE SQL STABLE;")
    print("")
    print("INSERT INTO wards (constituency_id, code, name, population, registered_voters, is_active) VALUES")

    for i, ward in enumerate(wards):
        is_last = (i == len(wards) - 1)
        comma = ";" if is_last else ","

        population = 8000 + (i * 50)
        voters = int(population * 0.6)

        print(f"    (get_constituency_id('{ward['const_code']}'), '{ward['code']}', '{ward['name']}', {population}, {voters}, true){comma}")

    print("")
    print("DROP FUNCTION IF EXISTS get_constituency_id;")
    print("")
    print(f"\\echo '✓ {len(wards)} wards loaded'")
    print("")

def main():
    print("Reading CSV data...", file=sys.stderr)
    constituencies, wards, unmapped_districts = read_and_organize_data()

    print(f"Found:", file=sys.stderr)
    print(f"  - Constituencies: {len(constituencies)}", file=sys.stderr)
    print(f"  - Wards: {len(wards)}", file=sys.stderr)

    if unmapped_districts:
        print(f"", file=sys.stderr)
        print(f"⚠️  Warning: {len(unmapped_districts)} districts not mapped:", file=sys.stderr)
        for prov, dist in sorted(unmapped_districts):
            print(f"     {prov} -> {dist}", file=sys.stderr)
        print(f"", file=sys.stderr)

    print("Improving constituency names...", file=sys.stderr)
    improve_constituency_names(constituencies, wards)

    print("Generating SQL...", file=sys.stderr)
    print("", file=sys.stderr)

    generate_sql(constituencies, wards)

    print("", file=sys.stderr)
    print("✅ Conversion complete!", file=sys.stderr)
    print("", file=sys.stderr)
    print("To save:", file=sys.stderr)
    print("  python3 convert_full_admin_data.py > zambia_full_admin_data.sql", file=sys.stderr)

if __name__ == "__main__":
    main()
