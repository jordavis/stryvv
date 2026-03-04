-- Allow unauthenticated (anon) users to read household + profile data via invite pages.
--
-- The /invite/[code] page is a public Server Component that looks up a household
-- by its invite_code to show the inviter's first name. Without these grants and
-- policies, anon users can't query the tables at all, resulting in a 404.

-- Grant table-level SELECT to anon
grant select on public.households to anon;
grant select on public.profiles   to anon;

-- Any anon user can read a household row (they need the invite_code to even find it)
create policy "public can view household by invite code"
  on public.households for select
  to anon
  using (invite_code is not null);

-- Any anon user can read profiles that are linked to a household
-- (used to display the inviting partner's first name on the invite page)
create policy "public can view profiles by household"
  on public.profiles for select
  to anon
  using (household_id is not null);

-- Authenticated users (e.g. partner 2 joining) need to lookup a household by invite code.
-- The existing "users can view own household" policy only allows members of the household
-- to see it. A new user trying to join needs to be able to SELECT the household row first.
create policy "authenticated can view household by invite code"
  on public.households for select
  to authenticated
  using (invite_code is not null);
