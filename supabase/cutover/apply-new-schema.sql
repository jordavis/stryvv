-- ONE-OFF production cutover, step 5 + 6 for the Supabase SQL editor.
-- GENERATED from supabase/migrations/ by the cutover branch; do not edit by hand.
--
-- Use this instead of `migration repair` + the CLI push when the CLI can't reach the database
-- (for example "IPv6 is not supported on your current network"). Run it AFTER drop-legacy.sql.
--
-- In one transaction it:
--   1. refuses to run unless the legacy schema is gone and the new one isn't there yet;
--   2. applies the six migrations in supabase/migrations/, in order;
--   3. replaces the remote migration history with those six versions, so later CLI pushes
--      only apply newer migrations.

begin;

do $$
begin
  if to_regclass('public.households') is not null then
    raise exception 'The legacy schema is still here: run drop-legacy.sql first. Nothing was changed.';
  end if;
  if to_regclass('public.partnerships') is not null then
    raise exception 'The new schema is already applied. Nothing was changed.';
  end if;
end;
$$;

-- ============================================================
-- Migration 20261003000100_profiles.sql
-- ============================================================
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

-- ============================================================
-- Migration 20261003000200_partnerships.sql
-- ============================================================
-- Partnerships: the link between two people, and what each of them shares.
-- Nothing is ever copied between partners. Sharing is decided on every query.

create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  -- Set null, not cascade: when one person deletes their account, the partnership row stays
  -- (ended) so the other person's couple records are not deleted with it. See end_partnership migration.
  inviter_id uuid references auth.users (id) on delete set null,
  invitee_id uuid references auth.users (id) on delete set null,
  status public.partnership_status not null default 'pending',
  -- A bearer token. Only ever looked up inside the functions below.
  invite_code text not null unique,
  invite_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references auth.users (id) on delete set null,
  check (invitee_id is null or invitee_id <> inviter_id),
  check (status = 'ended' or inviter_id is not null),
  check (status <> 'active' or invitee_id is not null)
);

-- A person can have at most one open (pending or active) partnership they started,
-- and at most one active partnership they joined. The guard trigger below covers the case
-- these two indexes can't: the same person as inviter of one and invitee of another.
create unique index partnerships_one_open_per_inviter
  on public.partnerships (inviter_id) where status in ('pending', 'active');
create unique index partnerships_one_active_per_invitee
  on public.partnerships (invitee_id) where status = 'active';
create index partnerships_invitee_idx on public.partnerships (invitee_id);

-- Last line of defence for "one active partnership per person", whatever path made the change.
create function public.partnerships_guard_single_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from public.partnerships p
    where p.id <> new.id
      and p.status = 'active'
      and (
        p.inviter_id in (new.inviter_id, new.invitee_id)
        or p.invitee_id in (new.inviter_id, new.invitee_id)
      )
  ) then
    raise exception 'already_partnered';
  end if;
  return new;
end;
$$;

create trigger partnerships_guard_single_active
  before insert or update on public.partnerships
  for each row execute function public.partnerships_guard_single_active();

create table public.sharing_settings (
  partnership_id uuid not null references public.partnerships (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  category public.sharing_category not null,
  shared boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (partnership_id, owner_id, category)
);

create index sharing_settings_owner_idx on public.sharing_settings (owner_id);

create trigger sharing_settings_set_updated_at
  before update on public.sharing_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper functions used by access rules. They run as the definer so they can
-- read partnerships and sharing_settings without re-entering those tables' rules.
--
-- Read policies call the no-row-argument helpers inside a scalar subquery, e.g.
--   owner_id = (select public.partner_sharing('goals'))
-- so Postgres evaluates them once per query, not once per row.
-- ---------------------------------------------------------------------------

-- Is the caller one of the two people in this partnership (any status)?
create function public.is_partnership_member(_partnership_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partnerships p
    where p.id = _partnership_id
      and (select auth.uid()) in (p.inviter_id, p.invitee_id)
  );
$$;

-- The caller's active partnership, or null.
create function public.active_partnership_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.partnerships p
  where p.status = 'active'
    and (select auth.uid()) in (p.inviter_id, p.invitee_id)
  limit 1;
$$;

-- The sharing rule: the caller's active partner's id, if that partner currently shares this category; else null.
create function public.partner_sharing(_category public.sharing_category)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select s.owner_id
  from public.partnerships p
  join public.sharing_settings s on s.partnership_id = p.id
  where p.status = 'active'
    and (select auth.uid()) in (p.inviter_id, p.invitee_id)
    and s.owner_id <> (select auth.uid())
    and s.category = _category
    and s.shared
  limit 1;
$$;

-- The same rule for one record, for use in app code: is it mine, or my partner's and shared?
create function public.can_view(_owner_id uuid, _category public.sharing_category)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    _owner_id = (select auth.uid()) or _owner_id = public.partner_sharing(_category),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Access rules
-- ---------------------------------------------------------------------------

alter table public.partnerships enable row level security;
alter table public.sharing_settings enable row level security;

revoke all on table public.partnerships from anon;
revoke all on table public.sharing_settings from anon;
-- Partnerships change only through the functions below.
revoke insert, update, delete on table public.partnerships from authenticated;
-- A person may only flip their own "shared" switch.
revoke insert, update, delete on table public.sharing_settings from authenticated;
grant update (shared) on table public.sharing_settings to authenticated;

create policy "partnerships: members read"
  on public.partnerships for select to authenticated
  using ((select auth.uid()) in (inviter_id, invitee_id));

create policy "sharing_settings: members read"
  on public.sharing_settings for select to authenticated
  using (public.is_partnership_member(partnership_id));

create policy "sharing_settings: owner updates own"
  on public.sharing_settings for update to authenticated
  using (owner_id = (select auth.uid()) and partnership_id = (select public.active_partnership_id()))
  with check (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Invite and link functions
--
-- Every function that opens, accepts or ends a partnership first takes a per-person lock
-- (lock_people). accept_invite locks both people, always in the same order, so two requests
-- about the same people run one after the other instead of racing or deadlocking.
-- ---------------------------------------------------------------------------

create function public.lock_people(_a uuid, _b uuid default null)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if _b is null or _a = _b then
    perform pg_advisory_xact_lock(hashtextextended(_a::text, 0));
  else
    perform pg_advisory_xact_lock(hashtextextended(least(_a, _b)::text, 0));
    perform pg_advisory_xact_lock(hashtextextended(greatest(_a, _b)::text, 0));
  end if;
end;
$$;

revoke execute on function public.lock_people(uuid, uuid) from public, anon, authenticated;

-- Create (or return) the caller's pending invite.
create function public.create_invite()
returns table (code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  -- No 0/O, 1/I/L: easy to read aloud and type.
  _alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  _code text;
  _bytes bytea;
  _existing public.partnerships%rowtype;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.lock_people(_uid);

  select * into _existing
  from public.partnerships p
  where p.status in ('pending', 'active')
    and _uid in (p.inviter_id, p.invitee_id)
  limit 1;

  if found then
    if _existing.status = 'active' then
      raise exception 'already_partnered';
    end if;
    if _existing.invite_expires_at > now() then
      return query select _existing.invite_code, _existing.invite_expires_at;
      return;
    end if;
    -- The old invite expired: close it and issue a new one.
    update public.partnerships set status = 'ended', ended_at = now(), ended_by = _uid
    where id = _existing.id;
  end if;

  loop
    _bytes := extensions.gen_random_bytes(10);
    _code := '';
    for i in 0..9 loop
      _code := _code || substr(_alphabet, (get_byte(_bytes, i) % length(_alphabet)) + 1, 1);
    end loop;
    begin
      insert into public.partnerships (inviter_id, invite_code, invite_expires_at)
      values (_uid, _code, now() + interval '14 days');
      exit;
    exception when unique_violation then
      -- Code collision (or a concurrent invite). Try another code.
      if exists (
        select 1 from public.partnerships p
        where p.inviter_id = _uid and p.status in ('pending', 'active')
      ) then
        raise exception 'already_partnered';
      end if;
    end;
  end loop;

  return query select _code, (now() + interval '14 days')::timestamptz;
end;
$$;

-- What an invited person may know before accepting: whether the code still works and,
-- only if it does, the inviter's first name. A used, expired or withdrawn code reveals no name.
create function public.preview_invite(_code text)
returns table (inviter_first_name text, valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case when p.status = 'pending' and p.invite_expires_at > now() then pr.first_name end,
    (p.status = 'pending' and p.invite_expires_at > now())
  from public.partnerships p
  left join public.profiles pr on pr.id = p.inviter_id
  where (select auth.uid()) is not null
    and p.invite_code = upper(trim(_code));
$$;

-- Link the caller to the inviter. Creates both people's sharing settings with everything shared.
create function public.accept_invite(_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _inviter uuid;
  _p public.partnerships%rowtype;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Find who is involved, lock both people, then read the invite again under the lock.
  select p.inviter_id into _inviter
  from public.partnerships p
  where p.invite_code = upper(trim(_code));

  if not found then
    raise exception 'invite_not_found';
  end if;
  if _inviter is null then
    raise exception 'invite_used';
  end if;
  if _inviter = _uid then
    raise exception 'cannot_accept_own_invite';
  end if;

  perform public.lock_people(_uid, _inviter);

  select * into _p
  from public.partnerships p
  where p.invite_code = upper(trim(_code))
  for update;

  if _p.status <> 'pending' then
    raise exception 'invite_used';
  end if;
  if _p.invite_expires_at <= now() then
    raise exception 'invite_expired';
  end if;

  -- Neither person may already be in an active partnership.
  if exists (
    select 1 from public.partnerships p
    where p.status = 'active'
      and (
        _uid in (p.inviter_id, p.invitee_id)
        or _p.inviter_id in (p.inviter_id, p.invitee_id)
      )
  ) then
    raise exception 'already_partnered';
  end if;

  -- The caller's own unanswered invite, if any, is withdrawn.
  update public.partnerships
  set status = 'ended', ended_at = now(), ended_by = _uid
  where inviter_id = _uid and status = 'pending';

  update public.partnerships
  set invitee_id = _uid, status = 'active', accepted_at = now()
  where id = _p.id;

  insert into public.sharing_settings (partnership_id, owner_id, category)
  select _p.id, person, category
  from unnest(array[_p.inviter_id, _uid]) as person
  cross join unnest(enum_range(null::public.sharing_category)) as category;

  return _p.id;
end;
$$;

-- The caller's active partner: id and first name only.
create function public.get_partner()
returns table (id uuid, first_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.id, pr.first_name
  from public.partnerships p
  join public.profiles pr
    on pr.id = case when p.inviter_id = (select auth.uid()) then p.invitee_id else p.inviter_id end
  where p.status = 'active'
    and (select auth.uid()) in (p.inviter_id, p.invitee_id);
$$;

revoke execute on function public.is_partnership_member(uuid) from public, anon;
revoke execute on function public.active_partnership_id() from public, anon;
revoke execute on function public.partner_sharing(public.sharing_category) from public, anon;
revoke execute on function public.can_view(uuid, public.sharing_category) from public, anon;
revoke execute on function public.create_invite() from public, anon;
revoke execute on function public.preview_invite(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
revoke execute on function public.get_partner() from public, anon;

grant execute on function public.is_partnership_member(uuid) to authenticated;
grant execute on function public.active_partnership_id() to authenticated;
grant execute on function public.partner_sharing(public.sharing_category) to authenticated;
grant execute on function public.can_view(uuid, public.sharing_category) to authenticated;
grant execute on function public.create_invite() to authenticated;
grant execute on function public.preview_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.get_partner() to authenticated;

-- ============================================================
-- Migration 20261003000300_conversations.sql
-- ============================================================
-- Conversations and messages: the raw chat. Always private to their owner.
-- A partner can only ever see confirmed entries (later migrations), never a transcript.

create type public.conversation_kind as enum ('onboarding', 'coach', 'check_in');
create type public.message_role as enum ('user', 'assistant');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.conversation_kind not null,
  topic text check (topic is null or char_length(topic) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_owner_idx on public.conversations (owner_id, created_at desc);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role public.message_role not null,
  content text not null check (char_length(content) between 1 and 20000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_owner_idx on public.messages (owner_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on table public.conversations from anon;
revoke all on table public.messages from anon;
-- Chat history can't be edited or deleted by the person for now (decided 2026-10-03).
revoke delete on table public.conversations from authenticated;
revoke update, delete on table public.messages from authenticated;

create policy "conversations: owner reads"
  on public.conversations for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "conversations: owner creates"
  on public.conversations for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "conversations: owner updates"
  on public.conversations for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "messages: owner reads"
  on public.messages for select to authenticated
  using (owner_id = (select auth.uid()));

-- A message can only be added to the person's own conversation.
create policy "messages: owner creates"
  on public.messages for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- Migration 20261003000400_captured_records.sql
-- ============================================================
-- What the coach captures and the person confirms: money history, goals, Money Moves.
-- A row exists only once its owner has confirmed it on a review card.
-- A partner sees a category only while its owner shares it: read rules compare owner_id with
-- partner_sharing(category), evaluated once per query.
-- "Archived" is a timestamp (archived_at), separate from status, so archiving never erases
-- the fact that a goal was reached or a Money Move was paused.

create type public.money_history_kind as enum ('memory', 'belief', 'pattern', 'win');
create type public.goal_status as enum ('active', 'reached');
create type public.money_move_status as enum ('active', 'paused');

-- ---------------------------------------------------------------------------
-- Money history
-- ---------------------------------------------------------------------------

create table public.money_history_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.money_history_kind not null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 2000),
  -- Short facts shown as chips on the entry, e.g. ["From childhood", "Still feels true"].
  attributes jsonb not null default '[]'::jsonb check (jsonb_typeof(attributes) = 'array'),
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_history_entries_owner_idx on public.money_history_entries (owner_id, confirmed_at desc);

create trigger money_history_entries_set_updated_at
  before update on public.money_history_entries
  for each row execute function public.set_updated_at();

alter table public.money_history_entries enable row level security;
revoke all on table public.money_history_entries from anon;

create policy "money_history_entries: owner or sharing partner reads"
  on public.money_history_entries for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_history'))
  );

create policy "money_history_entries: owner creates"
  on public.money_history_entries for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "money_history_entries: owner updates"
  on public.money_history_entries for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "money_history_entries: owner deletes"
  on public.money_history_entries for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Goals
-- A goal is personal (partnership_id is null) or shared with the couple.
-- A shared goal is visible to, and editable by, both partners while the link is active.
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partnership_id uuid references public.partnerships (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  why text check (why is null or char_length(why) <= 2000),
  target_amount numeric(14, 2) check (target_amount is null or target_amount >= 0),
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  status public.goal_status not null default 'active',
  archived_at timestamptz,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_owner_idx on public.goals (owner_id, status);
create index goals_partnership_idx on public.goals (partnership_id) where partnership_id is not null;

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();
create trigger goals_prevent_owner_change
  before update on public.goals
  for each row execute function public.prevent_owner_change();

alter table public.goals enable row level security;
revoke all on table public.goals from anon;

create policy "goals: owner, sharing partner, or shared-goal member reads"
  on public.goals for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('goals'))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "goals: owner creates"
  on public.goals for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (partnership_id is null or partnership_id = (select public.active_partnership_id()))
  );

create policy "goals: owner or shared-goal member updates"
  on public.goals for update to authenticated
  using (
    owner_id = (select auth.uid())
    or partnership_id = (select public.active_partnership_id())
  )
  with check (
    (owner_id = (select auth.uid()) and (partnership_id is null or public.is_partnership_member(partnership_id)))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "goals: owner deletes"
  on public.goals for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Money Moves: the behaviors a person is working on, and their weekly counts.
-- ---------------------------------------------------------------------------

create table public.money_moves (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  partnership_id uuid references public.partnerships (id) on delete set null,
  goal_id uuid references public.goals (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  why text check (why is null or char_length(why) <= 2000),
  times_per_week smallint not null default 1 check (times_per_week between 1 and 21),
  status public.money_move_status not null default 'active',
  archived_at timestamptz,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_moves_owner_idx on public.money_moves (owner_id, status);
create index money_moves_partnership_idx on public.money_moves (partnership_id) where partnership_id is not null;

create trigger money_moves_set_updated_at
  before update on public.money_moves
  for each row execute function public.set_updated_at();
create trigger money_moves_prevent_owner_change
  before update on public.money_moves
  for each row execute function public.prevent_owner_change();

alter table public.money_moves enable row level security;
revoke all on table public.money_moves from anon;

create policy "money_moves: owner, sharing partner, or shared-move member reads"
  on public.money_moves for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_moves'))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "money_moves: owner creates"
  on public.money_moves for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (partnership_id is null or partnership_id = (select public.active_partnership_id()))
  );

create policy "money_moves: owner or shared-move member updates"
  on public.money_moves for update to authenticated
  using (
    owner_id = (select auth.uid())
    or partnership_id = (select public.active_partnership_id())
  )
  with check (
    (owner_id = (select auth.uid()) and (partnership_id is null or public.is_partnership_member(partnership_id)))
    or partnership_id = (select public.active_partnership_id())
  );

create policy "money_moves: owner deletes"
  on public.money_moves for delete to authenticated
  using (owner_id = (select auth.uid()));

-- One row per person per Money Move per week. On a shared move, each partner logs their own count.
create table public.money_move_logs (
  id uuid primary key default gen_random_uuid(),
  money_move_id uuid not null references public.money_moves (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null,
  done_count smallint not null default 0 check (done_count between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (money_move_id, owner_id, week_start)
);

create index money_move_logs_owner_idx on public.money_move_logs (owner_id, week_start desc);

create trigger money_move_logs_set_updated_at
  before update on public.money_move_logs
  for each row execute function public.set_updated_at();

alter table public.money_move_logs enable row level security;
revoke all on table public.money_move_logs from anon;
-- Only the count can change. A log can't be moved to another Money Move, week or person.
revoke update on table public.money_move_logs from authenticated;
grant update (done_count) on table public.money_move_logs to authenticated;

-- Your own logs, always. Someone else's logs only while you may see their Money Moves
-- (they share the category) or the move is one you both adopted and the link is active.
-- After unlinking, a former partner's logs on your shared move are hidden from you too.
create policy "money_move_logs: own, sharing partner's, or shared-move member's"
  on public.money_move_logs for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('money_moves'))
    or exists (
      select 1 from public.money_moves m
      where m.id = money_move_id
        and m.partnership_id = (select public.active_partnership_id())
    )
  );

create policy "money_move_logs: person logs their own count"
  on public.money_move_logs for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.money_moves m
      where m.id = money_move_id
        and (
          m.owner_id = (select auth.uid())
          or m.partnership_id = (select public.active_partnership_id())
        )
    )
  );

create policy "money_move_logs: person updates their own count"
  on public.money_move_logs for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "money_move_logs: person deletes their own count"
  on public.money_move_logs for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ============================================================
-- Migration 20261003000500_check_ins.sql
-- ============================================================
-- Check-ins, measurements and money dates.
-- Measurements are a history: rows are only ever added, so "then vs. now" can always be shown
-- and the baseline is never overwritten.

create type public.check_in_kind as enum ('baseline', 'weekly', 'monthly', 'quarterly');

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.check_in_kind not null,
  source_conversation_id uuid references public.conversations (id) on delete set null,
  completed_at timestamptz not null default now()
);

create index check_ins_owner_idx on public.check_ins (owner_id, completed_at desc);
-- One baseline per person, ever. It is the "before" that every later score is compared with.
create unique index check_ins_one_baseline_per_owner on public.check_ins (owner_id) where kind = 'baseline';

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  check_in_id uuid not null references public.check_ins (id) on delete cascade,
  -- e.g. 'cfpb_score', 'cfpb_item_1', 'stress', 'satisfaction', 'self_efficacy', 'wedge_bond'.
  metric text not null check (metric ~ '^[a-z][a-z0-9_]{0,63}$'),
  value numeric not null,
  recorded_at timestamptz not null default now(),
  unique (check_in_id, metric)
);

create index measurements_owner_metric_idx on public.measurements (owner_id, metric, recorded_at);

alter table public.check_ins enable row level security;
alter table public.measurements enable row level security;

revoke all on table public.check_ins from anon;
revoke all on table public.measurements from anon;
-- Append-only for the person: no edits, no deletes. Rows go only when the account is deleted.
-- Timestamps and ownership always come from the server, so history can't be backdated.
revoke insert, update, delete on table public.check_ins from authenticated;
revoke insert, update, delete on table public.measurements from authenticated;
grant insert (kind, source_conversation_id) on table public.check_ins to authenticated;
grant insert (check_in_id, metric, value) on table public.measurements to authenticated;

create policy "check_ins: owner or sharing partner reads"
  on public.check_ins for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('scores'))
  );

create policy "check_ins: owner creates"
  on public.check_ins for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "measurements: owner or sharing partner reads"
  on public.measurements for select to authenticated
  using (
    owner_id = (select auth.uid())
    or owner_id = (select public.partner_sharing('scores'))
  );

-- A measurement can only be added to the person's own check-in.
create policy "measurements: owner creates"
  on public.measurements for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.check_ins c
      where c.id = check_in_id and c.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Money dates: a couple's logged money conversation. Belongs to the partnership.
-- ---------------------------------------------------------------------------

create table public.money_dates (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.partnerships (id) on delete cascade,
  logged_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  held_at timestamptz not null default now(),
  notes text check (notes is null or char_length(notes) <= 5000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index money_dates_partnership_idx on public.money_dates (partnership_id, held_at desc);
create index money_dates_logged_by_idx on public.money_dates (logged_by);

create trigger money_dates_set_updated_at
  before update on public.money_dates
  for each row execute function public.set_updated_at();

alter table public.money_dates enable row level security;
revoke all on table public.money_dates from anon;
revoke delete on table public.money_dates from authenticated;

-- Both partners while the link is active. After it ends, only the person who logged it.
create policy "money_dates: active members, or the person who logged it"
  on public.money_dates for select to authenticated
  using (
    logged_by = (select auth.uid())
    or partnership_id = (select public.active_partnership_id())
  );

create policy "money_dates: active member logs"
  on public.money_dates for insert to authenticated
  with check (
    logged_by = (select auth.uid())
    and partnership_id = (select public.active_partnership_id())
  );

create policy "money_dates: the person who logged it updates"
  on public.money_dates for update to authenticated
  using (logged_by = (select auth.uid()))
  with check (logged_by = (select auth.uid()) and public.is_partnership_member(partnership_id));

-- ============================================================
-- Migration 20261003000600_end_partnership.sql
-- ============================================================
-- Ending a partnership. Either partner can do it alone, at any time.
-- The app shows a warning and asks for confirmation before calling end_partnership().
--
-- What happens:
--   * the partnership is marked ended, with who ended it and when;
--   * everything each person shared is hidden from the other at once, because partner_sharing()
--     and active_partnership_id() only honor active partnerships;
--   * couple-level records (shared goals, shared Money Moves, money dates) are archived, not deleted.
--     Whoever created each record keeps it; the other partner loses access.
--     Archiving sets archived_at and leaves status alone, so a reached goal stays "reached".
--
-- The same thing happens when one partner deletes their account: the partnership row survives
-- (its link to the deleted person becomes null), it is ended, and the remaining person keeps
-- the couple records they created.
--
-- This lives in its own migration because it touches tables created after partnerships.

-- _removed_person: set when a member's account is being deleted. Their own rows are about to be
-- deleted by the cascade from auth.users, so they are left alone here.
create function public.archive_couple_records(_partnership_id uuid, _removed_person uuid default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.goals set archived_at = now()
  where partnership_id = _partnership_id and archived_at is null
    and owner_id is distinct from _removed_person;

  update public.money_moves set archived_at = now()
  where partnership_id = _partnership_id and archived_at is null
    and owner_id is distinct from _removed_person;

  update public.money_dates set archived_at = now()
  where partnership_id = _partnership_id and archived_at is null
    and logged_by is distinct from _removed_person;
$$;

revoke execute on function public.archive_couple_records(uuid, uuid) from public, anon, authenticated;

create function public.end_partnership()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _p public.partnerships%rowtype;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.lock_people(_uid);

  select * into _p
  from public.partnerships p
  where p.status in ('pending', 'active')
    and _uid in (p.inviter_id, p.invitee_id)
  for update;

  if not found then
    raise exception 'no_partnership';
  end if;

  update public.partnerships
  set status = 'ended', ended_at = now(), ended_by = _uid
  where id = _p.id;

  -- A pending invite that is withdrawn has no couple records to archive.
  if _p.status = 'active' then
    perform public.archive_couple_records(_p.id);
  end if;

  return _p.id;
end;
$$;

revoke execute on function public.end_partnership() from public, anon;
grant execute on function public.end_partnership() to authenticated;

-- Account deletion: auth.users → partnerships.inviter_id / invitee_id are set to null.
-- When that happens to an open partnership, end it and archive its couple records.
create function public.partnerships_end_on_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status in ('pending', 'active')
     and (
       (old.inviter_id is not null and new.inviter_id is null)
       or (old.invitee_id is not null and new.invitee_id is null)
     )
  then
    new.status := 'ended';
    new.ended_at := now();
    if old.status = 'active' then
      perform public.archive_couple_records(
        old.id,
        case when new.inviter_id is null then old.inviter_id else old.invitee_id end
      );
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.partnerships_end_on_member_removed() from public, anon, authenticated;

create trigger partnerships_end_on_member_removed
  before update on public.partnerships
  for each row execute function public.partnerships_end_on_member_removed();

-- ============================================================
-- Migration history
-- ============================================================
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
delete from supabase_migrations.schema_migrations where version in ('20260221202909', '20260221202919', '20260221202930', '20260228005042', '20260228005402', '20260228005655', '20260228010140', '20260310040520', '20260310040910', '20260310041425');
insert into supabase_migrations.schema_migrations (version, name) values
  ('20261003000100', 'profiles'),
  ('20261003000200', 'partnerships'),
  ('20261003000300', 'conversations'),
  ('20261003000400', 'captured_records'),
  ('20261003000500', 'check_ins'),
  ('20261003000600', 'end_partnership');

commit;
