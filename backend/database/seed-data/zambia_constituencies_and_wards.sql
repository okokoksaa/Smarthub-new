Reading CSV data...
Found:
  - Provinces: 9
  - Districts: 75
  - Constituencies: 149
  - Wards: 1416

Inferring constituency names from ward patterns...
Generating SQL...

-- ============================================================================
-- ZAMBIAN CONSTITUENCIES (149 constituencies)
-- Source: ECZ Administrative Units 2023
-- ============================================================================

\echo 'Loading seed data: Zambian Constituencies'

-- Helper function
CREATE OR REPLACE FUNCTION get_district_id(d_code VARCHAR) RETURNS UUID AS $$
    SELECT id FROM districts WHERE code = d_code LIMIT 1;
$$ LANGUAGE SQL STABLE;

INSERT INTO constituencies (
    district_id, code, name,
    current_mp_name, current_mp_party, current_mp_elected_date,
    annual_cdf_allocation, current_year_allocation,
    registered_voters, population,
    bank_name, bank_account_number, bank_branch,
    is_active
) VALUES
    (get_district_id('WP-101'), '001', 'Muswishi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 50000, 85000, 'Zanaco', '1000000001', 'Main Branch', true),
    (get_district_id('WP-101'), '002', 'Kabile', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 51000, 86500, 'Stanbic', '1000000002', 'Main Branch', true),
    (get_district_id('WP-101'), '003', 'Chaloshi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 52000, 88000, 'Zanaco', '1000000003', 'Main Branch', true),
    (get_district_id('WP-102'), '004', 'Kawama', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 53000, 89500, 'Stanbic', '1000000004', 'Main Branch', true),
    (get_district_id('WP-102'), '005', 'Kalonga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 54000, 91000, 'Zanaco', '1000000005', 'Main Branch', true),
    (get_district_id('WP-103'), '006', 'Ngabwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 55000, 92500, 'Stanbic', '1000000006', 'Main Branch', true),
    (get_district_id('WP-104'), '007', 'Chibefwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 56000, 94000, 'Zanaco', '1000000007', 'Main Branch', true),
    (get_district_id('WP-104'), '008', 'Kalwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 57000, 95500, 'Stanbic', '1000000008', 'Main Branch', true),
    (get_district_id('WP-105'), '009', 'Lutondo', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 58000, 97000, 'Zanaco', '1000000009', 'Main Branch', true),
    (get_district_id('WP-105'), '010', 'Nalusanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 59000, 98500, 'Stanbic', '1000000010', 'Main Branch', true),
    (get_district_id('WP-105'), '011', 'Nakasaka', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 60000, 100000, 'Zanaco', '1000000011', 'Main Branch', true),
    (get_district_id('WP-106'), '012', 'Lulimala', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 61000, 101500, 'Stanbic', '1000000012', 'Main Branch', true),
    (get_district_id('WP-106'), '013', 'Kabansa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 62000, 103000, 'Zanaco', '1000000013', 'Main Branch', true),
    (get_district_id('WP-106'), '014', 'Kabamba', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 63000, 104500, 'Stanbic', '1000000014', 'Main Branch', true),
    (get_district_id('CB-201'), '015', 'Kamina', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 64000, 106000, 'Zanaco', '1000000015', 'Main Branch', true),
    (get_district_id('CB-202'), '016', 'Musenga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 65000, 107500, 'Stanbic', '1000000016', 'Main Branch', true),
    (get_district_id('CB-202'), '017', 'Buntungwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 66000, 109000, 'Zanaco', '1000000017', 'Main Branch', true),
    (get_district_id('CB-203'), '018', 'Kalanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 67000, 110500, 'Stanbic', '1000000018', 'Main Branch', true),
    (get_district_id('CB-204'), '019', 'Lubuto', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 68000, 112000, 'Zanaco', '1000000019', 'Main Branch', true),
    (get_district_id('CB-204'), '020', 'Bupe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 69000, 113500, 'Stanbic', '1000000020', 'Main Branch', true),
    (get_district_id('CB-204'), '021', 'Kwacha', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 70000, 115000, 'Zanaco', '1000000021', 'Main Branch', true),
    (get_district_id('CB-204'), '022', 'Buchi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 71000, 116500, 'Stanbic', '1000000022', 'Main Branch', true),
    (get_district_id('CB-204'), '023', 'Wusakile', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 72000, 118000, 'Zanaco', '1000000023', 'Main Branch', true),
    (get_district_id('CB-205'), '024', 'Misaka', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 73000, 119500, 'Stanbic', '1000000024', 'Main Branch', true),
    (get_district_id('CB-205'), '025', 'Kafue', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 74000, 121000, 'Zanaco', '1000000025', 'Main Branch', true),
    (get_district_id('CB-209'), '026', 'Buntungwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 75000, 122500, 'Stanbic', '1000000026', 'Main Branch', true),
    (get_district_id('CB-209'), '027', 'Leya Mukutu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 76000, 124000, 'Zanaco', '1000000027', 'Main Branch', true),
    (get_district_id('CB-209'), '028', 'Mutundu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 77000, 125500, 'Stanbic', '1000000028', 'Main Branch', true),
    (get_district_id('CB-207'), '029', 'Mwatishi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 78000, 127000, 'Zanaco', '1000000029', 'Main Branch', true),
    (get_district_id('CB-206'), '030', 'Kasanta', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 79000, 128500, 'Stanbic', '1000000030', 'Main Branch', true),
    (get_district_id('CB-207'), '031', 'Kashitu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 80000, 130000, 'Zanaco', '1000000031', 'Main Branch', true),
    (get_district_id('CB-208'), '032', 'Luswishi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 81000, 131500, 'Stanbic', '1000000032', 'Main Branch', true),
    (get_district_id('CB-210'), '033', 'Itawa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 82000, 133000, 'Zanaco', '1000000033', 'Main Branch', true),
    (get_district_id('CB-210'), '034', 'Pamodzi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 83000, 134500, 'Stanbic', '1000000034', 'Main Branch', true),
    (get_district_id('CB-210'), '035', 'Toka', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 84000, 136000, 'Zanaco', '1000000035', 'Main Branch', true),
    (get_district_id('CB-210'), '036', 'Kaniki', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 85000, 137500, 'Stanbic', '1000000036', 'Main Branch', true),
    (get_district_id('CP-301'), '037', 'Mangwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 86000, 139000, 'Zanaco', '1000000037', 'Main Branch', true),
    (get_district_id('CP-301'), '038', 'Dzozwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 87000, 140500, 'Stanbic', '1000000038', 'Main Branch', true),
    (get_district_id('CP-302'), '039', 'Ndunda', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 88000, 142000, 'Zanaco', '1000000039', 'Main Branch', true),
    (get_district_id('CP-301'), '040', 'Chipala', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 89000, 143500, 'Stanbic', '1000000040', 'Main Branch', true),
    (get_district_id('CP-303'), '041', 'Sisinje', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 90000, 145000, 'Zanaco', '1000000041', 'Main Branch', true),
    (get_district_id('CP-303'), '042', 'Msanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 91000, 146500, 'Stanbic', '1000000042', 'Main Branch', true),
    (get_district_id('CP-303'), '043', 'Makungwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 92000, 148000, 'Zanaco', '1000000043', 'Main Branch', true),
    (get_district_id('CP-303'), '044', 'Kazimule', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 93000, 149500, 'Stanbic', '1000000044', 'Main Branch', true),
    (get_district_id('CP-304'), '045', 'Kafumbwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 94000, 151000, 'Zanaco', '1000000045', 'Main Branch', true),
    (get_district_id('CP-304'), '046', 'Chimtende', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 95000, 152500, 'Stanbic', '1000000046', 'Main Branch', true),
    (get_district_id('CP-304'), '047', 'Kamwaza', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 96000, 154000, 'Zanaco', '1000000047', 'Main Branch', true),
    (get_district_id('CP-305'), '048', 'Manda Hill', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 97000, 155500, 'Stanbic', '1000000048', 'Main Branch', true),
    (get_district_id('CP-305'), '049', 'Chamtowa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 98000, 157000, 'Zanaco', '1000000049', 'Main Branch', true),
    (get_district_id('CP-305'), '050', 'Vuu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 99000, 158500, 'Stanbic', '1000000050', 'Main Branch', true),
    (get_district_id('CP-306'), '052', 'Chinsimbwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 100000, 160000, 'Zanaco', '1000000051', 'Main Branch', true),
    (get_district_id('CP-307'), '053', 'Lusinde', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 101000, 161500, 'Stanbic', '1000000052', 'Main Branch', true),
    (get_district_id('CP-307'), '054', 'Manjazi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 102000, 163000, 'Zanaco', '1000000053', 'Main Branch', true),
    (get_district_id('CP-307'), '055', 'Nyakawise', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 103000, 164500, 'Stanbic', '1000000054', 'Main Branch', true),
    (get_district_id('EP-402'), '056', 'Chisenga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 104000, 166000, 'Zanaco', '1000000055', 'Main Branch', true),
    (get_district_id('EP-402'), '057', 'Mwansabombwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 105000, 167500, 'Stanbic', '1000000056', 'Main Branch', true),
    (get_district_id('EP-402'), '058', 'Ilombe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 106000, 169000, 'Zanaco', '1000000057', 'Main Branch', true),
    (get_district_id('EP-403'), '059', 'Mulenshi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 107000, 170500, 'Stanbic', '1000000058', 'Main Branch', true),
    (get_district_id('EP-403'), '060', 'lukola', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 108000, 172000, 'Zanaco', '1000000059', 'Main Branch', true),
    (get_district_id('EP-403'), '061', 'Chilyapa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 109000, 173500, 'Stanbic', '1000000060', 'Main Branch', true),
    (get_district_id('EP-405'), '062', 'Nsenga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 110000, 175000, 'Zanaco', '1000000061', 'Main Branch', true),
    (get_district_id('EP-405'), '063', 'Mpasa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 111000, 176500, 'Stanbic', '1000000062', 'Main Branch', true),
    (get_district_id('EP-405'), '064', 'Kalanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 112000, 178000, 'Zanaco', '1000000063', 'Main Branch', true),
    (get_district_id('EP-401'), '065', 'Chipamba', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 113000, 179500, 'Stanbic', '1000000064', 'Main Branch', true),
    (get_district_id('EP-406'), '066', 'Kilwa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 114000, 181000, 'Zanaco', '1000000065', 'Main Branch', true),
    (get_district_id('EP-407'), '067', 'Chimana', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 115000, 182500, 'Stanbic', '1000000066', 'Main Branch', true),
    (get_district_id('EP-407'), '068', 'Kasansa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 116000, 184000, 'Zanaco', '1000000067', 'Main Branch', true),
    (get_district_id('EP-407'), '069', 'Nkutila', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 117000, 185500, 'Stanbic', '1000000068', 'Main Branch', true),
    (get_district_id('LSK-502'), '070', 'Chiyaba', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 118000, 187000, 'Zanaco', '1000000069', 'Main Branch', true),
    (get_district_id('LSK-503'), '071', 'Mankhokwe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 119000, 188500, 'Stanbic', '1000000070', 'Main Branch', true),
    (get_district_id('LSK-502'), '072', 'Chilanga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 120000, 190000, 'Zanaco', '1000000071', 'Main Branch', true),
    (get_district_id('LSK-501'), '073', 'Kapwayambale', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 121000, 191500, 'Stanbic', '1000000072', 'Main Branch', true),
    (get_district_id('LSK-501'), '074', 'Shikabeta', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 122000, 193000, 'Zanaco', '1000000073', 'Main Branch', true),
    (get_district_id('LSK-504'), '075', 'Nkoloma', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 123000, 194500, 'Stanbic', '1000000074', 'Main Branch', true),
    (get_district_id('LSK-504'), '076', 'Chilenje', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 124000, 196000, 'Zanaco', '1000000075', 'Main Branch', true),
    (get_district_id('LSK-504'), '077', 'Kanyama', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 125000, 197500, 'Stanbic', '1000000076', 'Main Branch', true),
    (get_district_id('LSK-504'), '078', 'Silwizya', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 126000, 199000, 'Zanaco', '1000000077', 'Main Branch', true),
    (get_district_id('LSK-504'), '079', 'Chaisa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 127000, 200500, 'Stanbic', '1000000078', 'Main Branch', true),
    (get_district_id('LSK-504'), '080', 'Muchinga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 128000, 202000, 'Zanaco', '1000000079', 'Main Branch', true),
    (get_district_id('LSK-504'), '081', 'Kalingalinga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 129000, 203500, 'Stanbic', '1000000080', 'Main Branch', true),
    (get_district_id('MP-701'), '082', 'Mofu', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 130000, 205000, 'Zanaco', '1000000081', 'Main Branch', true),
    (get_district_id('LP-602'), '083', 'Itapa', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 131000, 206500, 'Stanbic', '1000000082', 'Main Branch', true),
    (get_district_id('LP-601'), '084', 'Muchinga', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 132000, 208000, 'Zanaco', '1000000083', 'Main Branch', true),
    (get_district_id('LP-604'), '085', 'Thendere', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 133000, 209500, 'Stanbic', '1000000084', 'Main Branch', true),
    (get_district_id('LP-603'), '086', 'Kasoka', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 134000, 211000, 'Zanaco', '1000000085', 'Main Branch', true),
    (get_district_id('LP-606'), '087', 'Mpanda', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 135000, 212500, 'Stanbic', '1000000086', 'Main Branch', true),
    (get_district_id('MP-702'), '088', 'Kapisha', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 136000, 214000, 'Zanaco', '1000000087', 'Main Branch', true),
    (get_district_id('MP-702'), '089', 'Choma', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 137000, 215500, 'Stanbic', '1000000088', 'Main Branch', true),
    (get_district_id('MP-703'), '090', 'Mulilansolo', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 138000, 217000, 'Zanaco', '1000000089', 'Main Branch', true),
    (get_district_id('MP-703'), '091', 'Kapumaula', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 139000, 218500, 'Stanbic', '1000000090', 'Main Branch', true),
    (get_district_id('MP-708'), '092', 'Kabisha', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 140000, 220000, 'Zanaco', '1000000091', 'Main Branch', true),
    (get_district_id('MP-704'), '093', 'Katopola', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 141000, 221500, 'Stanbic', '1000000092', 'Main Branch', true),
    (get_district_id('MP-704'), '094', 'Itandashi', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 142000, 223000, 'Zanaco', '1000000093', 'Main Branch', true),
    (get_district_id('MP-705'), '095', 'Kawimbe', 'TBD', 'TBD', '2021-08-12', 1600000.00, 1600000.00, 143000, 224500, 'Stanbic', '1000000094', 'Main Branch', true),
