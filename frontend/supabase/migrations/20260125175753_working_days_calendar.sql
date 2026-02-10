-- Working days calendar and SLA helpers
set check_function_bodies = off;

create table if not exists public.working_days_calendar (
  day date primary key,
  is_working_day boolean not null default true,
  holiday_name text
);

comment on table public.working_days_calendar is 'Tracks working vs non-working days and holidays for SLA calculations.';

-- Function: is_working_day(date)
drop function if exists public.is_working_day(date);
create or replace function public.is_working_day(d date)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select wdc.is_working_day from public.working_days_calendar wdc where wdc.day = d),
    -- Default: weekdays are working days
    extract(isodow from d) < 6
  );
$$;

-- Function: business_days_add(start_date, n_days)
create or replace function public.business_days_add(start_date date, n_days integer)
returns date
language plpgsql
stable
as $$
declare
  d date := start_date;
  added integer := 0;
begin
  if n_days <= 0 then
    return start_date;
  end if;
  while added < n_days loop
    d := d + interval '1 day';
    if public.is_working_day(d) then
      added := added + 1;
    end if;
  end loop;
  return d;
end;
$$;

-- Function: working_days_between(start_date, end_date)
create or replace function public.working_days_between(start_date date, end_date date)
returns integer
language plpgsql
stable
as $$
declare
  d date := start_date;
  count_days integer := 0;
begin
  if end_date < start_date then
    return 0;
  end if;
  while d <= end_date loop
    if public.is_working_day(d) then
      count_days := count_days + 1;
    end if;
    d := d + interval '1 day';
  end loop;
  return count_days;
end;
$$;
