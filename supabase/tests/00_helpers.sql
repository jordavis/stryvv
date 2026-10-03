-- Test helpers. This file is not rolled back, so the helpers exist for the files that run after it.
-- Local and CI databases only: nothing here is part of a migration.

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

-- Create a confirmed auth user. The profile row is created by the on_auth_user_created trigger.
create or replace function tests.create_user(_email text, _first_name text default 'Test')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values (
    '00000000-0000-0000-0000-000000000000', _id, 'authenticated', 'authenticated', _email, '', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('first_name', _first_name),
    now(), now()
  );
  return _id;
end;
$$;

create or replace function tests.uid(_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where email = _email;
$$;

-- Act as a signed-in user for the rest of the transaction (or until the next act_as / act_as_anon).
create or replace function tests.act_as(_email text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  _id uuid := tests.uid(_email);
begin
  if _id is null then
    raise exception 'no test user %', _email;
  end if;
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', _id, 'role', 'authenticated', 'email', _email)::text,
    true
  );
end;
$$;

-- Act as a visitor who is not signed in.
create or replace function tests.act_as_anon()
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
end;
$$;

-- Back to the database owner, who bypasses the access rules. Use for setup and for checking stored state.
create or replace function tests.act_as_admin()
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Three people: an owner, their partner, and a stranger. Links owner and partner with everything shared,
-- and gives the owner one row in every table.
create or replace function tests.seed_linked_couple()
returns void
language plpgsql
set search_path = ''
as $$
declare
  _code text;
  _partnership uuid;
  _conversation uuid;
  _goal uuid;
  _move uuid;
  _check_in uuid;
begin
  perform tests.create_user('owner@test.dev', 'Olive');
  perform tests.create_user('partner@test.dev', 'Pat');
  perform tests.create_user('stranger@test.dev', 'Sam');

  perform tests.act_as('owner@test.dev');
  select code into _code from public.create_invite();

  perform tests.act_as('partner@test.dev');
  _partnership := public.accept_invite(_code);

  perform tests.act_as('owner@test.dev');
  insert into public.conversations (kind, topic) values ('onboarding', 'Money history') returning id into _conversation;
  insert into public.messages (conversation_id, role, content) values (_conversation, 'user', 'Dad handled everything.');
  insert into public.money_history_entries (kind, title, source_conversation_id)
    values ('belief', 'Spending on fun is risky', _conversation);
  insert into public.goals (title) values ('Personal goal') returning id into _goal;
  insert into public.goals (title, partnership_id) values ('Shared goal', _partnership);
  insert into public.money_moves (title, goal_id) values ('Personal move', _goal) returning id into _move;
  insert into public.money_moves (title, partnership_id) values ('Shared move', _partnership);
  insert into public.money_move_logs (money_move_id, week_start, done_count) values (_move, date '2026-09-28', 2);
  insert into public.check_ins (kind) values ('baseline') returning id into _check_in;
  insert into public.measurements (check_in_id, metric, value) values (_check_in, 'cfpb_score', 54);
  insert into public.money_dates (partnership_id, notes) values (_partnership, 'Talked about the Visa.');

  perform tests.act_as_admin();
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

begin;
select plan(1);
select has_function('tests', 'act_as', 'test helpers are installed');
select * from finish();
rollback;
