#!/usr/bin/env python3
"""
District Mapping: CSV District Names -> Database District Codes
Maps districts from ECZ CSV to existing database district codes
"""

# Comprehensive district mapping: CSV District Name -> Database District Code
DISTRICT_MAPPING = {
    # CENTRAL PROVINCE
    ("Central", "Kabwe"): "CP-KAB",
    ("Central", "Kapiri Mposhi"): "CP-KAP",
    ("Central", "Chibombo"): "CP-CHS",
    ("Central", "Serenje"): "CP-SRM",
    ("Central", "Mkushi"): "CP-MKS",
    ("Central", "Mumbwa"): "CP-MUM",  # Not in current seed, will need to add

    # COPPERBELT PROVINCE
    ("Copperbelt", "Ndola"): "CB-NDL",
    ("Copperbelt", "Kitwe"): "CB-KTW",
    ("Copperbelt", "Chililabombwe"): "CB-CHL",
    ("Copperbelt", "Luanshya"): "CB-LUA",
    ("Copperbelt", "Mufulira"): "CB-MLO",
    ("Copperbelt", "Kalulushi"): "CB-KLW",
    ("Copperbelt", "Chingola"): "CB-CNG",
    ("Copperbelt", "Lufwanyama"): "CB-LFW",
    ("Copperbelt", "Masaiti"): "CB-MAS",
    ("Copperbelt", "Mpongwe"): "CB-MPO",

    # EASTERN PROVINCE
    ("Eastern", "Chipata"): "EP-CHP",  # Not in CSV, using common knowledge
    ("Eastern", "Katete"): "EP-KTT",
    ("Eastern", "Lundazi"): "EP-LND",
    ("Eastern", "Chadiza"): "EP-CHD",
    ("Eastern", "Petauke"): "EP-PTK",
    ("Eastern", "Nyimba"): "EP-NYM",
    ("Eastern", "Mambwe"): "EP-MBL",

    # LUAPULA PROVINCE
    ("Luapula", "Mansa"): "LP-MNS",
    ("Luapula", "Nchelenge"): "LP-NCH",
    ("Luapula", "Kawambwa"): "LP-KWA",
    ("Luapula", "Samfya"): "LP-SMP",
    ("Luapula", "Mwense"): "LP-MPL",
    ("Luapula", "Chienge"): "LP-CHG",  # Mapped to Chembe
    ("Luapula", "Milenge"): "LP-MLG",  # Will need to add

    # LUSAKA PROVINCE
    ("Lusaka", "Lusaka"): "LSK-LSK",
    ("Lusaka", "Kafue"): "LSK-KFU",
    ("Lusaka", "Chongwe"): "LSK-CHO",
    ("Lusaka", "Luangwa"): "LSK-LUA",

    # MUCHINGA PROVINCE
    ("Muchinga", "Chinsali"): "MCH-CHS",
    ("Muchinga", "Isoka"): "MCH-IMA",
    ("Muchinga", "Mpika"): "MCH-MPI",
    ("Muchinga", "Nakonde"): "MCH-NKO",
    ("Muchinga", "Chama"): "MCH-CHA",
    ("Muchinga", "Mafinga"): "MCH-MAF",  # Will need to add

    # NORTHERN PROVINCE
    ("Northern", "Kasama"): "NP-KSM",
    ("Northern", "Mbala"): "NP-MBL",
    ("Northern", "Luwingu"): "NP-LWG",
    ("Northern", "Kaputa"): "NP-KAP",
    ("Northern", "Chilubi"): "NP-CHI",  # Will need to add
    ("Northern", "Mporokoso"): "NP-MPN",

    # NORTH-WESTERN PROVINCE
    ("North-Western", "Solwezi"): "NWP-SOL",  # Using NWP prefix
    ("North-Western", "Mwinilunga"): "NWP-MWI",
    ("North-Western", "Kabompo"): "NWP-KAB",
    ("North-Western", "Zambezi"): "NWP-ZAM",
    ("North-Western", "Mufumbwe"): "NWP-MUF",  # Will need to add
    ("North-Western", "Chavuma"): "NWP-CHV",  # Will need to add

    # SOUTHERN PROVINCE
    ("Southern", "Choma"): "SP-CHO",
    ("Southern", "Livingstone"): "SP-LIV",
    ("Southern", "Monze"): "SP-MON",
    ("Southern", "Mazabuka"): "SP-MAZ",
    ("Southern", "Kalomo"): "SP-KAL",
    ("Southern", "Namwala"): "SP-NAM",
    ("Southern", "Kazungula"): "SP-KAZ",
    ("Southern", "Gwembe"): "SP-GWE",
    ("Southern", "Sinazongwe"): "SP-SIN",
    ("Southern", "Siavonga"): "SP-SIA",

    # WESTERN PROVINCE
    ("Western", "Mongu"): "WP-MON",
    ("Western", "Senanga"): "WP-SEN",
    ("Western", "Kaoma"): "WP-KAO",
    ("Western", "Lukulu"): "WP-LUK",
    ("Western", "Kalabo"): "WP-KAL",
    ("Western", "Sesheke"): "WP-SES",
    ("Western", "Shangombo"): "WP-SHA",
    ("Western", "Nalolo"): "WP-NAL",
}

def get_district_code(province, district):
    """Get database district code from province and district names"""
    key = (province, district)
    return DISTRICT_MAPPING.get(key, None)

def print_mapping():
    """Print the mapping for verification"""
    print("District Mapping (CSV -> Database):")
    print("=" * 80)
    for (prov, dist), code in sorted(DISTRICT_MAPPING.items()):
        print(f"{prov:20} | {dist:25} -> {code}")
    print("=" * 80)
    print(f"Total mapped districts: {len(DISTRICT_MAPPING)}")

if __name__ == "__main__":
    print_mapping()
