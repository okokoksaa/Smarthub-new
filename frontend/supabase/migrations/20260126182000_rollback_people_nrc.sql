-- Rollback for people registry and NRC constraints
-- Safely drops triggers, FKs, helper functions, constraints, and tables

-- 1) Drop triggers that reference helper functions
drop trigger if exists set_empowerment_grants_applicant_person on public.empowerment_grants;
drop trigger if exists set_bursary_people on public.bursary_applications;
drop trigger if exists set_wdc_signoffs_chair_person on public.wdc_signoffs;
drop trigger if exists update_people_updated_at on public.people;

-- 2) Drop trigger functions
drop function if exists public.trg_set_empowerment_grants_applicant_person() cascade;
drop function if exists public.trg_set_bursary_people() cascade;
drop function if exists public.trg_set_wdc_signoffs_chair_person() cascade;

-- 3) Drop constraints added to enforce person_id presence when NRC provided
alter table if exists public.empowerment_grants
  drop constraint if exists chk_empowerment_grants_applicant_person_present;

alter table if exists public.bursary_applications
  drop constraint if exists chk_bursary_student_person_present,
  drop constraint if exists chk_bursary_guardian_person_present;

alter table if exists public.wdc_signoffs
  drop constraint if exists chk_wdc_chair_person_present;

-- 4) Drop indexes on new FK columns
drop index if exists idx_empowerment_grants_applicant_person;
drop index if exists idx_bursary_student_person;
drop index if exists idx_bursary_guardian_person;
drop index if exists idx_wdc_signoffs_chair_person;

-- 5) Drop FK columns from modules
alter table if exists public.empowerment_grants drop column if exists applicant_person_id;
alter table if exists public.bursary_applications drop column if exists student_person_id;
alter table if exists public.bursary_applications drop column if exists guardian_person_id;
alter table if exists public.wdc_signoffs drop column if exists chair_person_id;

-- 6) Drop helper to resolve people by NRC
drop function if exists public.ensure_person_id_from_nrc(text, text);

-- 7) Drop people table (cascades indexes)
drop table if exists public.people;

-- 8) Drop per-table NRC constraints and indexes (from 20260126180000_nrc_constraints.sql)
alter table if exists public.empowerment_grants
  drop constraint if exists chk_empowerment_grants_applicant_nrc_format;
drop index if exists uidx_empowerment_grants_applicant_nrc_norm;

alter table if exists public.bursary_applications
  drop constraint if exists chk_bursary_applications_student_nrc_format,
  drop constraint if exists chk_bursary_applications_guardian_nrc_format;
drop index if exists uidx_bursary_applications_student_nrc_norm;

alter table if exists public.wdc_signoffs
  drop constraint if exists chk_wdc_signoffs_chair_nrc_format;

-- 9) Drop NRC helper functions last
drop function if exists public.is_valid_nrc(text);
drop function if exists public.normalize_nrc(text);

