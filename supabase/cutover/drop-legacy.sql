-- ONE-OFF production cutover script. Not a migration: never move it into supabase/migrations/.
--
-- Removes the legacy household schema (and every login) from the Stryvv production project so the
-- individual-first migrations can be applied. See docs/work/2026-10-03-early-cutover/ and README.md
-- beside this file for the full runbook. Take the backup first.
--
-- Safety:
--   * Runs in one transaction: it either removes everything listed or nothing.
--   * Refuses to run unless the legacy `households` table exists, so it can never run against
--     the new schema (which has no households table).
--   * Names every object explicitly and uses no CASCADE. If anything unexpected depends on a
--     legacy object, Postgres stops with an error and nothing is changed.

begin;

do $$
begin
  if to_regclass('public.households') is null then
    raise exception 'Not the legacy schema: public.households does not exist. Nothing was changed.';
  end if;
  if to_regclass('public.partnerships') is not null then
    raise exception 'The new schema is already present (public.partnerships exists). Nothing was changed.';
  end if;
end;
$$;

-- Tables, in one statement so their foreign keys to each other don't matter.
-- Their triggers, policies and indexes go with them.
drop table
  public.chat_messages,
  public.snapshots,
  public.money_histories,
  public.survey_responses,
  public.profiles,
  public.households;

drop function public.get_my_household_id();
drop function public.set_updated_at();

drop type
  public.conversation_feeling,
  public.discussion_frequency,
  public.finance_manager,
  public.finance_structure,
  public.financial_priority,
  public.goal_alignment,
  public.learning_style,
  public.money_style,
  public.partner_type,
  public.reflection_feeling,
  public.relationship_duration;

-- Every login. All are test accounts (decided 2026-10-03). Sessions, identities and
-- one-time tokens are removed with them by Supabase Auth's own foreign keys.
delete from auth.users;

-- What's left in public should be nothing but extension-owned objects.
do $$
declare
  _left text;
begin
  select string_agg(c.relname, ', ') into _left
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind in ('r', 'v', 'm', 'p');
  if _left is not null then
    raise exception 'Unexpected tables remain in public: %. Rolled back.', _left;
  end if;
end;
$$;

commit;
