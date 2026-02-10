-- Create public_holidays table to support Calendar module
-- Ensures unique dates and supports recurring flags

-- Enable pgcrypto for gen_random_uuid if not already enabled
-- Note: In Supabase this is usually pre-enabled.
-- create extension if not exists pgcrypto;

create table if not exists public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  date date not null unique,
  is_recurring boolean default false,
  created_at timestamptz default now()
);

comment on table public.public_holidays is 'Zambian public holidays used for SLA and working-day calculations.';

-- Migrate any existing rows from legacy `holidays` table if present
insert into public.public_holidays (name, date, is_recurring)
select h.name, h.date, true
from public.holidays h
on conflict (date) do nothing;

-- Seed Zambian holidays for 2026
insert into public.public_holidays (name, date, is_recurring) values
  ('New Year''s Day', '2026-01-01', true),
  ('Youth Day', '2026-03-12', true),
  -- Moveable feasts like Good Friday/Easter Monday are not recurring and may vary by year
  ('Good Friday', '2026-04-03', false),
  ('Easter Monday', '2026-04-06', false),
  ('Labour Day', '2026-05-01', true),
  ('Africa Day', '2026-05-25', true),
  ('Heroes Day', '2026-07-06', true),
  ('Unity Day', '2026-07-07', true),
  ('Farmers Day', '2026-08-03', true),
  ('National Prayer Day', '2026-10-18', true),
  ('Independence Day', '2026-10-24', true),
  ('Christmas Day', '2026-12-25', true)
on conflict (date) do nothing;

-- Optional helper index for date range queries (unique constraint already covers date)
-- create index if not exists idx_public_holidays_date on public.public_holidays (date);

