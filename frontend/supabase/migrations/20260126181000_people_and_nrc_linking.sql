-- Centralize NRC uniqueness via people table and link across modules
-- Depends on: public.normalize_nrc(text), public.is_valid_nrc(text)

-- Create people table
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  nrc text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_people_nrc_format check (public.is_valid_nrc(nrc))
);

-- Unique by normalized NRC (prevents duplicates with spacing variations)
create unique index if not exists uidx_people_nrc_norm
  on public.people (public.normalize_nrc(nrc));

-- Updated-at trigger (function assumed to exist from earlier migrations)
do $$ begin
  perform 1 from pg_proc where proname = 'update_updated_at';
  -- if exists, attach trigger
  if found then
    create trigger if not exists update_people_updated_at
      before update on public.people
      for each row execute function public.update_updated_at();
  end if;
end $$;

-- Seed initial people from existing data (ignore invalid/null NRCs)
insert into public.people (full_name, nrc)
select distinct eg.applicant_name, eg.applicant_nrc
from public.empowerment_grants eg
where eg.applicant_nrc is not null and public.is_valid_nrc(eg.applicant_nrc)
on conflict do nothing;

insert into public.people (full_name, nrc)
select distinct ba.student_name, ba.student_nrc
from public.bursary_applications ba
where ba.student_nrc is not null and public.is_valid_nrc(ba.student_nrc)
on conflict do nothing;

insert into public.people (full_name, nrc)
select distinct ba.guardian_name, ba.guardian_nrc
from public.bursary_applications ba
where ba.guardian_nrc is not null and public.is_valid_nrc(ba.guardian_nrc)
on conflict do nothing;

insert into public.people (full_name, nrc)
select distinct ws.chair_name, ws.chair_nrc
from public.wdc_signoffs ws
where ws.chair_nrc is not null and public.is_valid_nrc(ws.chair_nrc)
on conflict do nothing;

-- Helper to ensure a person exists and return id
create or replace function public.ensure_person_id_from_nrc(nrc text, name text default null)
returns uuid
language plpgsql
volatile
as $$
declare
  pid uuid;
  v text;
begin
  if nrc is null or not public.is_valid_nrc(nrc) then
    return null;
  end if;
  v := public.normalize_nrc(nrc);

  select p.id into pid from public.people p
  where public.normalize_nrc(p.nrc) = v
  limit 1;

  if pid is null then
    insert into public.people (full_name, nrc)
    values (name, nrc)
    on conflict do nothing;

    select p.id into pid from public.people p
    where public.normalize_nrc(p.nrc) = v
    limit 1;
  end if;

  return pid;
end;
$$;

comment on function public.ensure_person_id_from_nrc(text, text) is 'Finds or creates a person by NRC (normalized) and returns the person id.';

-- Add FK columns to link modules
alter table if exists public.empowerment_grants
  add column if not exists applicant_person_id uuid references public.people(id);

alter table if exists public.bursary_applications
  add column if not exists student_person_id uuid references public.people(id),
  add column if not exists guardian_person_id uuid references public.people(id);

alter table if exists public.wdc_signoffs
  add column if not exists chair_person_id uuid references public.people(id);

-- Populate FK columns based on existing NRCs
update public.empowerment_grants eg
set applicant_person_id = p.id
from public.people p
where eg.applicant_nrc is not null
  and public.normalize_nrc(eg.applicant_nrc) = public.normalize_nrc(p.nrc)
  and (eg.applicant_person_id is null or eg.applicant_person_id <> p.id);

update public.bursary_applications ba
set student_person_id = p.id
from public.people p
where ba.student_nrc is not null
  and public.normalize_nrc(ba.student_nrc) = public.normalize_nrc(p.nrc)
  and (ba.student_person_id is null or ba.student_person_id <> p.id);

update public.bursary_applications ba
set guardian_person_id = p.id
from public.people p
where ba.guardian_nrc is not null
  and public.normalize_nrc(ba.guardian_nrc) = public.normalize_nrc(p.nrc)
  and (ba.guardian_person_id is null or ba.guardian_person_id <> p.id);

update public.wdc_signoffs ws
set chair_person_id = p.id
from public.people p
where ws.chair_nrc is not null
  and public.normalize_nrc(ws.chair_nrc) = public.normalize_nrc(p.nrc)
  and (ws.chair_person_id is null or ws.chair_person_id <> p.id);

-- Triggers to auto-populate person references on insert/update
create or replace function public.trg_set_empowerment_grants_applicant_person()
returns trigger
language plpgsql
as $$
begin
  new.applicant_person_id := public.ensure_person_id_from_nrc(new.applicant_nrc, new.applicant_name);
  return new;
end;
$$;

drop trigger if exists set_empowerment_grants_applicant_person on public.empowerment_grants;
create trigger set_empowerment_grants_applicant_person
before insert or update of applicant_nrc, applicant_name on public.empowerment_grants
for each row execute function public.trg_set_empowerment_grants_applicant_person();

create or replace function public.trg_set_bursary_people()
returns trigger
language plpgsql
as $$
begin
  new.student_person_id := public.ensure_person_id_from_nrc(new.student_nrc, new.student_name);
  new.guardian_person_id := public.ensure_person_id_from_nrc(new.guardian_nrc, new.guardian_name);
  return new;
end;
$$;

drop trigger if exists set_bursary_people on public.bursary_applications;
create trigger set_bursary_people
before insert or update of student_nrc, student_name, guardian_nrc, guardian_name on public.bursary_applications
for each row execute function public.trg_set_bursary_people();

create or replace function public.trg_set_wdc_signoffs_chair_person()
returns trigger
language plpgsql
as $$
begin
  new.chair_person_id := public.ensure_person_id_from_nrc(new.chair_nrc, new.chair_name);
  return new;
end;
$$;

drop trigger if exists set_wdc_signoffs_chair_person on public.wdc_signoffs;
create trigger set_wdc_signoffs_chair_person
before insert or update of chair_nrc, chair_name on public.wdc_signoffs
for each row execute function public.trg_set_wdc_signoffs_chair_person();

-- Indexes for FK columns
create index if not exists idx_empowerment_grants_applicant_person on public.empowerment_grants(applicant_person_id);
create index if not exists idx_bursary_student_person on public.bursary_applications(student_person_id);
create index if not exists idx_bursary_guardian_person on public.bursary_applications(guardian_person_id);
create index if not exists idx_wdc_signoffs_chair_person on public.wdc_signoffs(chair_person_id);

-- Optional integrity checks: ensure FK set when NRC provided
alter table if exists public.empowerment_grants
  add constraint if not exists chk_empowerment_grants_applicant_person_present
  check (applicant_nrc is null or applicant_person_id is not null);

alter table if exists public.bursary_applications
  add constraint if not exists chk_bursary_student_person_present
  check (student_nrc is null or student_person_id is not null),
  add constraint if not exists chk_bursary_guardian_person_present
  check (guardian_nrc is null or guardian_person_id is not null);

alter table if exists public.wdc_signoffs
  add constraint if not exists chk_wdc_chair_person_present
  check (chair_nrc is null or chair_person_id is not null);

