-- Bank CSV import support: imports and transactions tables

-- create extension if not exists pgcrypto;

create table if not exists public.bank_imports (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_number text not null,
  statement_period_start date,
  statement_period_end date,
  file_name text,
  imported_by uuid,
  created_at timestamptz default now()
);

comment on table public.bank_imports is 'Metadata for uploaded bank statements (CSV).';

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.bank_imports(id) on delete cascade,
  txn_date date not null,
  description text,
  reference text,
  debit numeric(14,2),
  credit numeric(14,2),
  amount numeric(14,2) generated always as (coalesce(credit,0) - coalesce(debit,0)) stored,
  balance numeric(14,2),
  raw jsonb,
  matched_payment_id uuid,
  created_at timestamptz default now()
);

comment on table public.bank_transactions is 'Normalized transactions parsed from bank CSV statements.';

create index if not exists idx_bank_txn_import_date on public.bank_transactions(import_id, txn_date);
create index if not exists idx_bank_txn_reference on public.bank_transactions(reference);

