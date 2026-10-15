-- LOCAL TESTING ONLY. A stand-in for the legacy production schema, with the same object names,
-- used to test drop-legacy.sql against an empty local database. Column details are simplified;
-- the names, the cross-table foreign keys and the trigger/function dependencies match production.

create type public.conversation_feeling as enum ('calm');
create type public.discussion_frequency as enum ('weekly');
create type public.finance_manager as enum ('me');
create type public.finance_structure as enum ('joint');
create type public.financial_priority as enum ('savings');
create type public.goal_alignment as enum ('aligned');
create type public.learning_style as enum ('visual');
create type public.money_style as enum ('saver');
create type public.partner_type as enum ('spouse');
create type public.reflection_feeling as enum ('hopeful');
create type public.relationship_duration as enum ('years');

create function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create table public.households (id uuid primary key default gen_random_uuid(), invite_code text unique);
create table public.profiles (
  id uuid primary key references auth.users (id),
  household_id uuid references public.households (id),
  updated_at timestamptz default now()
);
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  household_id uuid references public.households (id),
  q12_my_money_style public.money_style,
  updated_at timestamptz default now()
);
create table public.chat_messages (id uuid primary key default gen_random_uuid(), household_id uuid references public.households (id), user_id uuid references auth.users (id));
create table public.snapshots (household_id uuid primary key references public.households (id));
create table public.money_histories (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users (id), household_id uuid references public.households (id));

create function public.get_my_household_id() returns uuid language sql stable as $$
  select household_id from public.profiles where id = auth.uid();
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger survey_responses_updated_at before update on public.survey_responses for each row execute function public.set_updated_at();

alter table public.households enable row level security;
create policy "households read" on public.households for select using (id = public.get_my_household_id());

insert into public.households (invite_code) values ('AAA111'), ('BBB222'), ('CCC333');
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'legacy' || n || '@test.dev', '', now(), now()
from generate_series(1, 3) n;
insert into public.profiles (id) select id from auth.users;
