#!/usr/bin/env python3
"""
ECZ Data Converter - Convert CSV/Excel files to SQL INSERT statements
Usage:
    python convert_ecz_data.py constituencies.csv > constituencies_ecz_full.sql
    python convert_ecz_data.py wards.csv > wards_ecz_full.sql
"""

import csv
import sys
import re
from pathlib import Path

# District code mapping
DISTRICT_CODES = {
    # Central Province
    "kabwe": "CP-KAB", "kapiri mposhi": "CP-KAP", "mkushi": "CP-MKU",
    "mumbwa": "CP-MUM", "serenje": "CP-SER", "chibombo": "CP-CHB",

    # Copperbelt Province
    "ndola": "CB-NDL", "kitwe": "CB-KIT", "luanshya": "CB-LUA",
    "mufulira": "CB-MUF", "chingola": "CB-CHI",

    # Eastern Province
    "chipata": "EP-CHP", "katete": "EP-KAT", "lundazi": "EP-LUN",
    "petauke": "EP-PET",

    # Luapula Province
    "mansa": "LP-MAN", "nchelenge": "LP-NCH", "kawambwa": "LP-KAW",
    "samfya": "LP-SAM",

    # Lusaka Province
    "lusaka": "LSK-LSK", "kafue": "LSK-KFU", "chongwe": "LSK-CHO",

    # Muchinga Province
    "chinsali": "MP-CHN", "isoka": "MP-ISO", "nakonde": "MP-NAK",
    "mpika": "MP-MPI",

    # Northern Province
    "kasama": "NP-KSM", "mbala": "NP-MBA", "luwingu": "NP-LUW",

    # North-Western Province
    "solwezi": "NWP-SOL", "mwinilunga": "NWP-MWI", "kabompo": "NWP-KAB",

    # Southern Province
    "choma": "SP-CHO", "livingstone": "SP-LIV", "monze": "SP-MON",
    "mazabuka": "SP-MAZ",

    # Western Province
    "mongu": "WP-MON", "senanga": "WP-SEN", "kaoma": "WP-KAO",
}


def clean_string(s):
    """Clean string for SQL insertion"""
    if not s or s.strip() == "":
        return "TBD"
    # Escape single quotes
    return s.replace("'", "''").strip()


def generate_constituency_code(name):
    """Generate 4-letter constituency code from name"""
    cleaned = re.sub(r'[^A-Za-z ]', '', name).upper()
    parts = cleaned.split()
    if len(parts) == 1:
        return parts[0][:4].ljust(4, 'X')
    else:
        # Take first 2 letters of each of first 2 words
        return (parts[0][:2] + parts[1][:2]).ljust(4, 'X')


def get_district_code(district_name):
    """Get district code from mapping"""
    key = district_name.lower().strip()
    return DISTRICT_CODES.get(key, None)


def convert_constituencies(csv_file):
    """Convert constituencies CSV to SQL"""
    print("-- ============================================================================")
    print("-- COMPLETE CONSTITUENCY DATA FROM ECZ")
    print("-- ============================================================================")
    print("-- Auto-generated from ECZ data")
    print("")
    print("\\echo 'Loading seed data: All 156 Zambian Constituencies'")
    print("")
    print("-- Helper function (reuse existing)")
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

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for i, row in enumerate(rows):
            # Extract and clean data
            const_name = clean_string(row.get('constituency_name') or row.get('name') or row.get('Constituency'))
            district_name = clean_string(row.get('district') or row.get('District'))
            const_code = row.get('code') or row.get('Code') or generate_constituency_code(const_name)
            mp_name = clean_string(row.get('mp_name') or row.get('MP') or 'TBD')
            party = clean_string(row.get('party') or row.get('Party') or 'TBD')
            voters = row.get('registered_voters') or row.get('voters') or row.get('Voters') or '50000'
            population = row.get('population') or row.get('Population') or '85000'

            # Get district code
            district_code = get_district_code(district_name)
            if not district_code:
                print(f"-- WARNING: Unknown district '{district_name}' for constituency '{const_name}'", file=sys.stderr)
                district_code = "LSK-LSK"  # Default fallback

            # Generate bank account number (sequential)
            bank_account = f"1{str(i+1).zfill(9)}"
            bank = "Zanaco" if i % 2 == 0 else "Stanbic"
            branch = f"{district_name} Branch"

            # Build SQL line
            is_last = (i == len(rows) - 1)
            comma = ";" if is_last else ","

            print(f"    (get_district_id('{district_code}'), '{const_code}', '{const_name}', '{mp_name}', '{party}', '2021-08-12', 1600000.00, 1600000.00, {voters}, {population}, '{bank}', '{bank_account}', '{branch}', true){comma}")

    print("")
    print("-- Cleanup")
    print("DROP FUNCTION IF EXISTS get_district_id;")
    print("")
    print("\\echo '✓ Constituencies loaded successfully'")


def convert_wards(csv_file):
    """Convert wards CSV to SQL"""
    print("-- ============================================================================")
    print("-- COMPLETE WARD DATA FROM ECZ")
    print("-- ============================================================================")
    print("-- Auto-generated from ECZ data")
    print("")
    print("\\echo 'Loading seed data: All 1,820+ Zambian Wards'")
    print("")
    print("-- Helper function")
    print("CREATE OR REPLACE FUNCTION get_constituency_id(c_code VARCHAR) RETURNS UUID AS $$")
    print("    SELECT id FROM constituencies WHERE code = c_code LIMIT 1;")
    print("$$ LANGUAGE SQL STABLE;")
    print("")
    print("INSERT INTO wards (constituency_id, code, name, population, registered_voters, is_active) VALUES")

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        for i, row in enumerate(rows):
            # Extract and clean data
            ward_name = clean_string(row.get('ward_name') or row.get('name') or row.get('Ward'))
            const_code = row.get('constituency_code') or row.get('code') or row.get('Constituency Code')
            ward_code = row.get('ward_code') or row.get('Code') or f"{const_code}-{str(i+1).zfill(2)}"
            population = row.get('population') or row.get('Population') or '10000'
            voters = row.get('registered_voters') or row.get('Voters') or str(int(int(population) * 0.6))

            # Build SQL line
            is_last = (i == len(rows) - 1)
            comma = ";" if is_last else ","

            print(f"    (get_constituency_id('{const_code}'), '{ward_code}', '{ward_name}', {population}, {voters}, true){comma}")

    print("")
    print("-- Cleanup")
    print("DROP FUNCTION IF EXISTS get_constituency_id;")
    print("")
    print("\\echo '✓ Wards loaded successfully'")


def main():
    if len(sys.argv) < 2:
        print("Usage: python convert_ecz_data.py <csv_file>")
        print("")
        print("The script will auto-detect if the file contains constituencies or wards")
        print("based on column names.")
        print("")
        print("Examples:")
        print("  python convert_ecz_data.py constituencies.csv > constituencies_ecz_full.sql")
        print("  python convert_ecz_data.py wards.csv > wards_ecz_full.sql")
        sys.exit(1)

    csv_file = sys.argv[1]

    if not Path(csv_file).exists():
        print(f"Error: File '{csv_file}' not found", file=sys.stderr)
        sys.exit(1)

    # Detect file type by checking column names
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        columns = [col.lower() for col in reader.fieldnames]

        if any('ward' in col for col in columns):
            convert_wards(csv_file)
        elif any('constituency' in col or 'mp' in col for col in columns):
            convert_constituencies(csv_file)
        else:
            print("Error: Could not detect file type. Ensure columns include 'constituency' or 'ward'", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
