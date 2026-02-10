-- Site visits for Monitoring & Evaluation with GPS verification

-- Enable pgcrypto for gen_random_uuid if needed
-- create extension if not exists pgcrypto;

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  verifier_id uuid not null,
  verification_date date not null,
  gps_latitude numeric(9,6) not null,
  gps_longitude numeric(9,6) not null,
  distance_to_project_m numeric(10,2),
  within_radius boolean,
  radius_m integer default 200,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

comment on table public.site_visits is 'Field monitoring visits with GPS, photos, and proximity verification to project location.';
create index if not exists idx_site_visits_project_date on public.site_visits(project_id, verification_date desc);

