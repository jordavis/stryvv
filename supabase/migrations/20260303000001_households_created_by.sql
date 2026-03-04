-- Add created_by to households.
--
-- Motivation: after a user INSERTs a household, the existing SELECT policy
-- (id = get_my_household_id()) evaluates to FALSE because the profile's
-- household_id hasn't been updated yet. PostgREST treats the empty RETURNING
-- result as an RLS violation and raises a 42501 error, aborting createHousehold().
--
-- Storing created_by lets us add an OR branch to the SELECT policy so the
-- creator can read their own row immediately after inserting it.
-- It also gives us a reliable way to identify partner1 vs partner2 in
-- sendSurveyAnalysis() instead of relying on profiles.created_at ordering.

alter table public.households
  add column created_by uuid references auth.users (id) on delete set null;

-- Drop and replace the SELECT policy to include the creator branch.
drop policy "users can view own household" on public.households;

create policy "users can view own household"
  on public.households for select
  to authenticated
  using (
    id = public.get_my_household_id()
    or created_by = auth.uid()
  );
