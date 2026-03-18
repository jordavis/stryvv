-- profiles
-- id mirrors auth.users.id (no separate sequence).
-- household_id is NULL until the user completes onboarding.

create table public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  first_name   text        not null default '',
  last_name    text        not null default '',
  household_id uuid        references public.households (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
