-- Run this in the SQL Editor AFTER schema.sql has already been applied.
-- Adds premium/payment support on top of the existing profiles table.

-- ── ROLE + PAID STATUS on profiles ──────────────────────────────────────────
alter table public.profiles add column if not exists role text not null default 'free';
alter table public.profiles add column if not exists is_paid boolean not null default false;

-- 'role' is either 'free' or 'premium'. Premium users skip the payment gate
-- entirely regardless of is_paid. Both columns are only ever changed by you
-- (project owner) via the dashboard — same manual pattern as 'approved'.

-- ── PAYMENTS (usage/audit log of payment claims) ────────────────────────────
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 100,
  currency text not null default 'INR',
  status text not null default 'pending', -- pending | verified | rejected
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

alter table public.payments enable row level security;

create policy "Users can insert their own payment claims"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own payment claims"
  on public.payments for select
  using (auth.uid() = user_id);

-- No update/delete policy for regular users — verifying a payment (and
-- flipping profiles.is_paid to true) is done by you via the dashboard,
-- which uses the service role and bypasses RLS.
