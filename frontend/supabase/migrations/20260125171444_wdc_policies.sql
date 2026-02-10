-- WDC signoffs RLS policies and helper
set check_function_bodies = off;

create or replace function public.has_any_role(roles text[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(roles)
  );
$$;

-- Ensure RLS is enabled
alter table if exists public.wdc_signoffs enable row level security;

-- Read policy: allow authenticated users to read WDC signoffs
drop policy if exists "wdc_signoffs_read_authenticated" on public.wdc_signoffs;
create policy "wdc_signoffs_read_authenticated"
  on public.wdc_signoffs
  for select
  to authenticated
  using (true);

-- Insert policy: restrict to WDC/CDFC/PLGO roles
drop policy if exists "wdc_signoffs_insert_wdc_roles" on public.wdc_signoffs;
create policy "wdc_signoffs_insert_wdc_roles"
  on public.wdc_signoffs
  for insert
  to authenticated
  with check (public.has_any_role(array['wdc_member','cdfc_member','cdfc_chair','plgo']));

-- Update policy: restrict to WDC/CDFC/PLGO roles
drop policy if exists "wdc_signoffs_update_wdc_roles" on public.wdc_signoffs;
create policy "wdc_signoffs_update_wdc_roles"
  on public.wdc_signoffs
  for update
  to authenticated
  using (public.has_any_role(array['wdc_member','cdfc_member','cdfc_chair','plgo']))
  with check (public.has_any_role(array['wdc_member','cdfc_member','cdfc_chair','plgo']));

-- Optional: prevent delete by default (no policy created)
