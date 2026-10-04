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
