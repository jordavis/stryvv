-- Partnerships: the link between two people, and what each of them shares.
-- Nothing is ever copied between partners. Sharing is decided on every query by can_view().

create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  invitee_id uuid references auth.users (id) on delete cascade,
  status public.partnership_status not null default 'pending',
  -- A bearer token. Only ever looked up inside the functions below.
  invite_code text not null unique,
  invite_expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ended_at timestamptz,
  ended_by uuid references auth.users (id) on delete set null,
  check (invitee_id is null or invitee_id <> inviter_id),
  check (status <> 'active' or invitee_id is not null)
);

-- A person can have at most one open (pending or active) partnership they started,
-- and at most one active partnership they joined. The functions below also check across both sides.
create unique index partnerships_one_open_per_inviter
  on public.partnerships (inviter_id) where status in ('pending', 'active');
create unique index partnerships_one_active_per_invitee
  on public.partnerships (invitee_id) where status = 'active';
create index partnerships_invitee_idx on public.partnerships (invitee_id);

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

-- Is the caller one of the two people in this partnership, and is it active?
create function public.is_active_partnership_member(_partnership_id uuid)
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
      and p.status = 'active'
      and (select auth.uid()) in (p.inviter_id, p.invitee_id)
  );
$$;

-- The one rule every read policy uses: you can see a record if it is yours,
-- or if you have an active partnership with its owner and they share that category.
create function public.can_view(_owner_id uuid, _category public.sharing_category)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    _owner_id = (select auth.uid())
    or exists (
      select 1
      from public.partnerships p
      join public.sharing_settings s
        on s.partnership_id = p.id
       and s.owner_id = _owner_id
       and s.category = _category
      where p.status = 'active'
        and s.shared
        and (
          (p.inviter_id = _owner_id and p.invitee_id = (select auth.uid()))
          or (p.invitee_id = _owner_id and p.inviter_id = (select auth.uid()))
        )
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
  using (owner_id = (select auth.uid()) and public.is_active_partnership_member(partnership_id))
  with check (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Invite and link functions
-- ---------------------------------------------------------------------------

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

  perform pg_advisory_xact_lock(hashtextextended(_uid::text, 0));

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

-- What an invited person may know before accepting: the inviter's first name, and whether the code still works.
create function public.preview_invite(_code text)
returns table (inviter_first_name text, valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select pr.first_name, (p.status = 'pending' and p.invite_expires_at > now())
  from public.partnerships p
  join public.profiles pr on pr.id = p.inviter_id
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
  _p public.partnerships%rowtype;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into _p
  from public.partnerships p
  where p.invite_code = upper(trim(_code))
  for update;

  if not found then
    raise exception 'invite_not_found';
  end if;
  if _p.status <> 'pending' then
    raise exception 'invite_used';
  end if;
  if _p.invite_expires_at <= now() then
    raise exception 'invite_expired';
  end if;
  if _p.inviter_id = _uid then
    raise exception 'cannot_accept_own_invite';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(_uid::text, 0));

  if exists (
    select 1 from public.partnerships p
    where p.status = 'active' and _uid in (p.inviter_id, p.invitee_id)
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
revoke execute on function public.is_active_partnership_member(uuid) from public, anon;
revoke execute on function public.can_view(uuid, public.sharing_category) from public, anon;
revoke execute on function public.create_invite() from public, anon;
revoke execute on function public.preview_invite(text) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
revoke execute on function public.get_partner() from public, anon;

grant execute on function public.is_partnership_member(uuid) to authenticated;
grant execute on function public.is_active_partnership_member(uuid) to authenticated;
grant execute on function public.can_view(uuid, public.sharing_category) to authenticated;
grant execute on function public.create_invite() to authenticated;
grant execute on function public.preview_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.get_partner() to authenticated;
