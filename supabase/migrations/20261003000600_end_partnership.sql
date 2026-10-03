-- Ending a partnership. Either partner can do it alone, at any time.
-- The app shows a warning and asks for confirmation before calling this.
--
-- What happens:
--   * the partnership is marked ended, with who ended it and when;
--   * everything each person shared is hidden from the other at once, because can_view()
--     and is_active_partnership_member() only honor active partnerships;
--   * couple-level records (shared goals, shared Money Moves, money dates) are archived, not deleted.
--     Whoever created each record keeps it; the other partner loses access.
--
-- This lives in its own migration because it touches tables created after partnerships.

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
    update public.goals set status = 'archived'
    where partnership_id = _p.id and status <> 'archived';

    update public.money_moves set status = 'archived'
    where partnership_id = _p.id and status <> 'archived';

    update public.money_dates set archived_at = now()
    where partnership_id = _p.id and archived_at is null;
  end if;

  return _p.id;
end;
$$;

revoke execute on function public.end_partnership() from public, anon;
grant execute on function public.end_partnership() to authenticated;
