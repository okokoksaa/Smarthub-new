#!/usr/bin/env python3
"""
Convert Zambian Administrative Units CSV to SQL INSERT statements
Source: Administrative_units_of_Zambia_(lvl_0%2C1%2C2%2C3).csv

Data structure:
- Provinces: 10
- Districts: 71
- Constituencies: 149
- Wards: 1,416+

Usage:
    python3 convert_zambia_admin_data.py
"""

import csv
import sys
from collections import defaultdict

# Path to your administrative units CSV
INPUT_CSV = "/Users/joseph-jameskapambwe/Desktop/Administrative_units_of_Zambia_(lvl_0%2C1%2C2%2C3)/Administrative_units_of_Zambia_(lvl_0%2C1%2C2%2C3).csv"

# Province code mapping (PROV_CODE from CSV -> Our province codes)
PROVINCE_MAP = {
    "1": "WP",   # Western
    "2": "CB",   # Copperbelt
    "3": "CP",   # Central
    "4": "EP",   # Eastern
    "5": "LSK",  # Lusaka
    "6": "LP",   # Luapula
    "7": "MP",   # Muchinga
    "8": "NP",   # Northern
    "9": "NWP",  # North-Western
    "10": "SP",  # Southern
}


def clean_string(s):
    """Clean string for SQL insertion"""
    if not s or str(s).strip() == "":
        return ""
    # Escape single quotes
    return str(s).replace("'", "''").strip()


def generate_district_code(prov_code, district_code, district_name):
    """Generate district code: PROV-DISTCODE"""
    prov = PROVINCE_MAP.get(str(prov_code), "XX")
    dist_code = str(district_code).zfill(3)[-3:]  # Last 3 digits
    return f"{prov}-{dist_code}"


def generate_constituency_code(const_code):
    """Generate constituency code from CONST_CODE"""
    return str(const_code).zfill(3)


def generate_ward_code(const_code, ward_code):
    """Generate ward code: CONSTCODE-WARDCODE"""
    const = str(const_code).zfill(3)
    ward = str(ward_code).zfill(2)
    return f"{const}-{ward}"


def read_csv_data():
    """Read and organize CSV data"""
    provinces = {}
    districts = {}
    constituencies = {}
    wards = []

    with open(INPUT_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Extract data
            prov_code = row['PROV_CODE']
            prov_name = clean_string(row['PROVINCENA'])
            dist_code = row['DISTRICT_C']
            dist_name = clean_string(row['DISTRICTNA'])
            const_code = row['CONST_CODE']
            ward_code = row['WARD_CODE']
            ward_name = clean_string(row['WARD_NAME'])

            # Store unique provinces
            if prov_code not in provinces:
                provinces[prov_code] = {
                    'code': PROVINCE_MAP.get(prov_code, f"P{prov_code}"),
                    'name': prov_name
                }

            # Store unique districts
            dist_key = f"{prov_code}-{dist_code}"
            if dist_key not in districts:
                districts[dist_key] = {
                    'code': generate_district_code(prov_code, dist_code, dist_name),
                    'name': dist_name,
                    'prov_code': PROVINCE_MAP.get(prov_code, f"P{prov_code}")
                }

            # Store unique constituencies
            const_key = const_code
            if const_key not in constituencies:
                # Infer constituency name from first ward's pattern
                # Most wards are named like "Ward Name" where constituency is the area
                # For now, we'll use district name + constituency code
                const_name = f"{dist_name} Constituency {const_code}"

                constituencies[const_key] = {
                    'code': generate_constituency_code(const_code),
                    'name': const_name,
                    'district_code': generate_district_code(prov_code, dist_code, dist_name),
                    'first_ward': ward_name  # We'll use this to infer better names
                }

            # Store wards
            wards.append({
                'code': generate_ward_code(const_code, ward_code),
                'name': ward_name,
                'const_code': generate_constituency_code(const_code),
                'const_name': constituencies[const_key]['name']
            })

    return provinces, districts, constituencies, wards


def infer_constituency_names(constituencies, wards):
    """Infer better constituency names from ward patterns"""
    # Group wards by constituency
    const_wards = defaultdict(list)
    for ward in wards:
        const_wards[ward['const_code']].append(ward['name'])

    # Try to infer constituency name
    for const_code, const_data in constituencies.items():
        ward_names = const_wards[generate_constituency_code(const_code)]

        # Common pattern: "Area Ward X" -> Area is the constituency
        # Try to find common prefix
        if ward_names:
            # Simple heuristic: use first ward name without "Ward" suffix
            first_ward = ward_names[0]
            # Remove "Ward X" pattern
            const_name = first_ward.split(' Ward ')[0] if ' Ward ' in first_ward else first_ward

            # Clean up
            const_name = const_name.replace(' East', '').replace(' West', '').replace(' North', '').replace(' South', '').replace(' Central', '')

            if const_name and len(const_name) > 2:
                const_data['name'] = const_name


def generate_constituencies_sql(constituencies):
    """Generate SQL for constituencies"""
    print("-- ============================================================================")
    print("-- ZAMBIAN CONSTITUENCIES (149 constituencies)")
    print("-- Source: ECZ Administrative Units 2023")
    print("-- ============================================================================")
    print("")
    print("\\echo 'Loading seed data: Zambian Constituencies'")
    print("")
    print("-- Helper function")
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

        # Generate bank account (sequential)
        bank_account = f"1{str(i+1).zfill(9)}"
        bank = "Zanaco" if i % 2 == 0 else "Stanbic"

        # Default values for missing data
        voters = 50000 + (i * 1000)  # Estimated
        population = 85000 + (i * 1500)  # Estimated

        print(f"    (get_district_id('{data['district_code']}'), '{data['code']}', '{data['name']}', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, {voters}, {population}, '{bank}', '{bank_account}', 'Main Branch', true){comma}")

    print("")
    print("-- Cleanup")
    print("DROP FUNCTION IF EXISTS get_district_id;")
    print("")
    print("\\echo '✓ Constituencies loaded successfully'")


def generate_wards_sql(wards):
    """Generate SQL for wards"""
    print("")
    print("-- ============================================================================")
    print("-- ZAMBIAN WARDS (1,416+ wards)")
    print("-- Source: ECZ Administrative Units 2023")
    print("-- ============================================================================")
    print("")
    print("\\echo 'Loading seed data: Zambian Wards'")
    print("")
    print("-- Helper function")
    print("CREATE OR REPLACE FUNCTION get_constituency_id(c_code VARCHAR) RETURNS UUID AS $$")
    print("    SELECT id FROM constituencies WHERE code = c_code LIMIT 1;")
    print("$$ LANGUAGE SQL STABLE;")
    print("")
    print("INSERT INTO wards (constituency_id, code, name, population, registered_voters, is_active) VALUES")

    for i, ward in enumerate(wards):
        is_last = (i == len(wards) - 1)
        comma = ";" if is_last else ","

        # Estimate population and voters
        population = 8000 + (i * 100)  # Estimated
        voters = int(population * 0.6)  # 60% registration rate

        print(f"    (get_constituency_id('{ward['const_code']}'), '{ward['code']}', '{ward['name']}', {population}, {voters}, true){comma}")

    print("")
    print("-- Cleanup")
    print("DROP FUNCTION IF EXISTS get_constituency_id;")
    print("")
    print("\\echo '✓ Wards loaded successfully'")


def main():
    print("Reading CSV data...", file=sys.stderr)
    provinces, districts, constituencies, wards = read_csv_data()

    print(f"Found:", file=sys.stderr)
    print(f"  - Provinces: {len(provinces)}", file=sys.stderr)
    print(f"  - Districts: {len(districts)}", file=sys.stderr)
    print(f"  - Constituencies: {len(constituencies)}", file=sys.stderr)
    print(f"  - Wards: {len(wards)}", file=sys.stderr)
    print("", file=sys.stderr)

    # Infer better constituency names
    print("Inferring constituency names from ward patterns...", file=sys.stderr)
    infer_constituency_names(constituencies, wards)

    print("Generating SQL...", file=sys.stderr)
    print("", file=sys.stderr)

    # Generate SQL
    generate_constituencies_sql(constituencies)
    generate_wards_sql(wards)

    print("", file=sys.stderr)
    print("✅ Conversion complete!", file=sys.stderr)
    print("", file=sys.stderr)
    print("Save the output to files:", file=sys.stderr)
    print("  python3 convert_zambia_admin_data.py > full_admin_data.sql", file=sys.stderr)


if __name__ == "__main__":
    main()
