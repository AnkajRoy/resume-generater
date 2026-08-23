-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- for the project this app connects to.

-- ── PROFILES ────────────────────────────────────────────────────────────────
-- One row per signed-up user. New signups start with approved = false; you
-- approve them manually by flipping this to true in Table Editor (or with an
-- UPDATE statement here in the SQL Editor).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No insert/update/delete policy for regular users on purpose — profile rows
-- are created by the trigger below, and "approved" is only ever changed by
-- you (project owner) via the dashboard, which uses the service role and
-- bypasses RLS entirely.

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, approved)
  values (new.id, new.email, false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RESUME GENERATION EVENTS (usage analytics) ──────────────────────────────
create table if not exists public.resume_generations (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  profile_type text,
  template_style text,
  created_at timestamptz not null default now()
);

alter table public.resume_generations enable row level security;

create policy "Users can insert their own generation events"
  on public.resume_generations for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own generation events"
  on public.resume_generations for select
  using (auth.uid() = user_id);

-- Public aggregate count (no per-row data exposed) — used to show
-- "X resumes generated so far" on the login page.
create or replace function public.total_resume_generations()
returns bigint
language sql
security definer
stable
as $$
  select count(*) from public.resume_generations;
$$;

grant execute on function public.total_resume_generations() to anon, authenticated;
