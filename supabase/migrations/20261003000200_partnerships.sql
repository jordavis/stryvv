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
