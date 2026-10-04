-- Profiles: one row per person, created automatically when the auth user is created.
-- Everything in Stryvv belongs to a person. There is no household.

create type public.sharing_category as enum (
  'money_history',
  'goals',
  'money_moves',
  'scores',
  -- Reserved: no tables yet. Listed now so sharing settings are complete from day one.
  'money_data',
  'documents'
);

create type public.partnership_status as enum ('pending', 'active', 'ended');

-- Shared trigger: keep updated_at current.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Shared trigger: a row's owner can never change, even where a partner may edit the row.
create function public.prevent_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed';
  end if;
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 100),
  last_name text not null default '' check (char_length(last_name) <= 100),
  phone text check (phone is null or char_length(phone) <= 32),
  onboarding_stage text not null default 'not_started' check (char_length(onboarding_stage) <= 50),
  terms_version text check (terms_version is null or char_length(terms_version) <= 50),
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
-- Rows are created by the trigger below and removed by the cascade from auth.users.
revoke insert, update, delete on table public.profiles from authenticated;
-- A person can edit these directly. Terms acceptance is a record of consent,
-- so it is written only by accept_terms() below.
grant update (first_name, last_name, phone, onboarding_stage) on table public.profiles to authenticated;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Runs as the definer because the signing-up user has no session yet.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 100),
    left(coalesce(new.raw_user_meta_data ->> 'last_name', ''), 100),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 32), '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Record that the caller accepted a version of the terms. The time comes from the server.
create function public.accept_terms(_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if _version is null or char_length(trim(_version)) not between 1 and 50 then
    raise exception 'invalid_terms_version';
  end if;
  update public.profiles
  set terms_version = trim(_version), terms_accepted_at = now()
  where id = auth.uid();
end;
$$;

revoke execute on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;
