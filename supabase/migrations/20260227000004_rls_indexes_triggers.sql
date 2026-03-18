-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: look up the calling user's household_id without touching RLS
--
-- Using a security definer function avoids recursive RLS evaluation.
-- All household-scoped policies call this instead of subquerying profiles
-- directly, which would cause "stack depth limit exceeded" errors because
-- the profiles SELECT policy would re-evaluate itself infinitely.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_my_household_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select household_id from public.profiles where id = auth.uid();
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Shared trigger function: keep updated_at current
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_survey_responses_updated_at
  before update on public.survey_responses
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- Fast lookup of all members in a household (createHousehold, joinHousehold, sendSurveyAnalysis)
create index idx_profiles_household_id on public.profiles (household_id);

-- Fast lookup of both partners' survey rows by household (sendSurveyAnalysis)
create index idx_survey_responses_household_id on public.survey_responses (household_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- Table-level permissions must be granted explicitly when tables are created
-- via migrations (the dashboard auto-grants do not apply).
-- RLS is enforced on top of these grants.
-- ─────────────────────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.households       to authenticated;
grant select, insert, update, delete on public.profiles         to authenticated;
grant select, insert, update, delete on public.survey_responses to authenticated;
grant execute on function public.get_my_household_id()          to authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: households
-- ─────────────────────────────────────────────────────────────────────────────

-- Prevent a user from creating a second household if they already belong to one.
-- The app layer also checks this, but defense-in-depth matters.
create policy "authenticated users can create households"
  on public.households for insert
  to authenticated
  with check (
    not exists (
      select 1 from public.profiles
      where id = auth.uid() and household_id is not null
    )
  );

-- A user may only read the household they belong to.
create policy "users can view own household"
  on public.households for select
  to authenticated
  using (id = public.get_my_household_id());


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- auth/callback/route.ts inserts the profile row on first login.
create policy "users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Users can always read their own profile.
create policy "users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Partner visibility: read the other partner's profile via shared household_id.
-- Uses get_my_household_id() to avoid recursive RLS on the profiles table.
create policy "users can view household member profiles"
  on public.profiles for select
  to authenticated
  using (
    household_id is not null
    and household_id = public.get_my_household_id()
  );

-- with check prevents a user from reassigning their own id to another user's value.
create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using    (id = auth.uid())
  with check (id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: survey_responses
-- ─────────────────────────────────────────────────────────────────────────────

-- saveSurveyResponse() upserts on conflict (user_id).
create policy "users can insert own survey response"
  on public.survey_responses for insert
  to authenticated
  with check (user_id = auth.uid());

-- with check prevents a user from changing their user_id or household_id
-- to arbitrary values after the fact.
create policy "users can update own survey response"
  on public.survey_responses for update
  to authenticated
  using    (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can always read their own response.
create policy "users can view own survey response"
  on public.survey_responses for select
  to authenticated
  using (user_id = auth.uid());

-- Partner visibility: read the other partner's response via shared household_id.
-- This is what makes sendSurveyAnalysis work — both rows share the same
-- household_id after createHousehold / joinHousehold backfills it.
-- Uses get_my_household_id() to avoid recursive RLS on the profiles table.
create policy "users can view household survey responses"
  on public.survey_responses for select
  to authenticated
  using (
    household_id is not null
    and household_id = public.get_my_household_id()
  );
