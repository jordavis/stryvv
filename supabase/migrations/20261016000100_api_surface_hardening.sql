-- Shrink the API surface (docs/work/2026-10-16-api-surface-hardening/).
--
--   * The helpers the access rules use move out of `public`, so PostgREST no longer serves them
--     at /rest/v1/rpc. They stay executable by `authenticated`, because policies run as the caller.
--   * pg_graphql is dropped: the app doesn't use GraphQL, and it exposed every table's shape to
--     any signed-in person.

-- ---------------------------------------------------------------------------
-- private: functions for access rules, never served by the API
-- ---------------------------------------------------------------------------

create schema private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Functions created here later get no EXECUTE for everyone; grant it per function.
alter default privileges in schema private revoke execute on functions from public;

-- Policies point at the function itself, not its name, so they follow the move unchanged.
-- Grants (authenticated only) and `search_path = ''` move with each function.
alter function public.is_partnership_member(uuid) set schema private;
alter function public.active_partnership_id() set schema private;
alter function public.partner_sharing(public.sharing_category) set schema private;
alter function public.can_view(uuid, public.sharing_category) set schema private;

-- can_view's body names partner_sharing by schema, so it is rewritten to the new location.
create or replace function private.can_view(_owner_id uuid, _category public.sharing_category)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    _owner_id = (select auth.uid()) or _owner_id = private.partner_sharing(_category),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- GraphQL
-- ---------------------------------------------------------------------------

drop extension if exists pg_graphql;
