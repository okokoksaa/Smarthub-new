-- NRC/People integrity verification script
-- Usage: psql "$DATABASE_URL" -f scripts/verify_nrc_integrity.sql

\echo '--- NRC & People Integrity Checks ---'

-- 1) Objects existence
with checks as (
  select 'fn_normalize_nrc_exists' as check, exists(select 1 from pg_proc where proname = 'normalize_nrc') as ok
  union all
  select 'fn_is_valid_nrc_exists', exists(select 1 from pg_proc where proname = 'is_valid_nrc')
  union all
  select 'tbl_people_exists', to_regclass('public.people') is not null
  union all
  select 'idx_people_nrc_unique_exists', exists(select 1 from pg_indexes where indexname = 'uidx_people_nrc_norm')
  union all
  select 'constraint_emp_grants_applicant_nrc_chk', exists(select 1 from pg_constraint where conname = 'chk_empowerment_grants_applicant_nrc_format')
  union all
  select 'idx_emp_grants_applicant_nrc_unique', exists(select 1 from pg_indexes where indexname = 'uidx_empowerment_grants_applicant_nrc_norm')
  union all
  select 'constraint_bursary_student_nrc_chk', exists(select 1 from pg_constraint where conname = 'chk_bursary_applications_student_nrc_format')
  union all
  select 'idx_bursary_student_nrc_unique', exists(select 1 from pg_indexes where indexname = 'uidx_bursary_applications_student_nrc_norm')
  union all
  select 'constraint_bursary_guardian_nrc_chk', exists(select 1 from pg_constraint where conname = 'chk_bursary_applications_guardian_nrc_format')
  union all
  select 'constraint_wdc_chair_nrc_chk', exists(select 1 from pg_constraint where conname = 'chk_wdc_signoffs_chair_nrc_format')
  union all
  select 'fk_cols_present',
    (
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='empowerment_grants' and column_name='applicant_person_id') and
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='bursary_applications' and column_name='student_person_id') and
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='bursary_applications' and column_name='guardian_person_id') and
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='wdc_signoffs' and column_name='chair_person_id')
    )
)
select * from checks order by check;

\echo ''
\echo '--- Duplicate NRCs (normalized) by table (should be zero rows) ---'

-- 2) Potential duplicates by normalized NRC
select 'people' as table, public.normalize_nrc(nrc) as nrc_norm, count(*)
from public.people
group by 1,2 having count(*) > 1;

select 'empowerment_grants.applicant_nrc' as table, public.normalize_nrc(applicant_nrc) as nrc_norm, count(*)
from public.empowerment_grants where applicant_nrc is not null
group by 1,2 having count(*) > 1;

select 'bursary_applications.student_nrc' as table, public.normalize_nrc(student_nrc) as nrc_norm, count(*)
from public.bursary_applications where student_nrc is not null
group by 1,2 having count(*) > 1;

\echo ''
\echo '--- Person link integrity (NRC present -> person_id present) ---'

-- 3) Missing person_id where NRC provided (should be zero counts)
select 'empowerment_grants_missing_person' as check, count(*) as missing
from public.empowerment_grants
where applicant_nrc is not null and applicant_person_id is null;

select 'bursary_student_missing_person' as check, count(*) as missing
from public.bursary_applications
where student_nrc is not null and student_person_id is null;

select 'bursary_guardian_missing_person' as check, count(*) as missing
from public.bursary_applications
where guardian_nrc is not null and guardian_person_id is null;

select 'wdc_chair_missing_person' as check, count(*) as missing
from public.wdc_signoffs
where chair_nrc is not null and chair_person_id is null;

