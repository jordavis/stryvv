-- Onboarding chat (docs/work/2026-10-16-onboarding-chat/).
-- Keeps onboarding stages valid, gives each person one onboarding conversation, stops chat history
-- being relabelled or backdated, and saves the Stryvv Score baseline all or nothing.

-- ---------------------------------------------------------------------------
-- Onboarding stages. The person can still set their own stage (it only controls their own flow),
-- but only to a known value.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add constraint profiles_onboarding_stage_known
  check (onboarding_stage in ('not_started', 'money_story', 'baseline', 'rich_life', 'done'));

-- The person's rich-life vision, in their words, from the end of the rich-life chat. Private to them
-- (profiles are owner-only), and they can edit it.
alter table public.profiles
  add column rich_life_vision text check (rich_life_vision is null or char_length(rich_life_vision) <= 2000);
grant update (rich_life_vision) on table public.profiles to authenticated;

-- Whether the person is married or in a relationship (null until asked). Asked at the start of the
-- baseline: if yes, the Stryvv Score includes its Unity part even before the partner joins.
alter table public.profiles add column in_relationship boolean;
grant update (in_relationship) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Conversations and messages.
-- ---------------------------------------------------------------------------
-- One onboarding conversation per person: leaving and coming back resumes the same one.
create unique index conversations_one_onboarding_per_owner
  on public.conversations (owner_id) where kind = 'onboarding';

-- Only the topic (the app's place in the conversation) can change after creation. Ids, kind and
-- timestamps come from the server, so history can't be relabelled or backdated.
revoke insert, update on table public.conversations from authenticated;
grant insert (kind, topic) on table public.conversations to authenticated;
grant update (topic) on table public.conversations to authenticated;

revoke insert on table public.messages from authenticated;
grant insert (conversation_id, role, content) on table public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- The Stryvv Score baseline (docs/measurement-framework.md → The Stryvv Score, version 1).
-- One transaction: the check-in and all its measurements are saved together or not at all, so a
-- failure can never leave an empty baseline that blocks the real one.
-- Answers are stored 0–4 in the order shown (0 = Completely); each becomes (4 − answer) × 25.
-- Six answers for someone on their own; eight (adding the two Unity answers) for someone married or
-- in a relationship. Which set was given also records `profiles.in_relationship`.
-- ---------------------------------------------------------------------------
create function public.record_baseline(answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := auth.uid();
  _base constant text[] := array[
    'security_shock', 'security_future',
    'satisfaction_enough', 'satisfaction_sleep',
    'alignment_values', 'alignment_tracking'
  ];
  _unity constant text[] := array['unity_same_page', 'unity_shared_vision'];
  _keys text[];
  _partnered boolean;
  _key text;
  _value jsonb;
  _a jsonb := '{}'::jsonb;
  _security numeric;
  _satisfaction numeric;
  _alignment numeric;
  _unity_score numeric;
  _total numeric;
  _check_in uuid;
begin
  if _uid is null then
    raise exception 'not_authenticated';
  end if;

  if answers is null or jsonb_typeof(answers) <> 'object' then
    raise exception 'invalid_answers';
  end if;
  -- Both Unity answers or neither; nothing else besides the six.
  _partnered := answers ? 'unity_same_page' or answers ? 'unity_shared_vision';
  _keys := case when _partnered then _base || _unity else _base end;
  if (select count(*) from jsonb_object_keys(answers)) <> array_length(_keys, 1) then
    raise exception 'invalid_answers';
  end if;
  foreach _key in array _keys loop
    _value := answers -> _key;
    if _value is null or jsonb_typeof(_value) <> 'number'
       or (_value #>> '{}')::numeric not in (0, 1, 2, 3, 4) then
      raise exception 'invalid_answers';
    end if;
    _a := _a || jsonb_build_object(_key, (_value #>> '{}')::numeric);
  end loop;

  _security := ((4 - (_a ->> 'security_shock')::numeric) * 25 + (4 - (_a ->> 'security_future')::numeric) * 25) / 2;
  _satisfaction := ((4 - (_a ->> 'satisfaction_enough')::numeric) * 25 + (4 - (_a ->> 'satisfaction_sleep')::numeric) * 25) / 2;
  _alignment := ((4 - (_a ->> 'alignment_values')::numeric) * 25 + (4 - (_a ->> 'alignment_tracking')::numeric) * 25) / 2;
  -- The total comes from the unrounded parts; rounding happens only when storing (halves round up).
  if _partnered then
    _unity_score := ((4 - (_a ->> 'unity_same_page')::numeric) * 25 + (4 - (_a ->> 'unity_shared_vision')::numeric) * 25) / 2;
    _total := (_security + _satisfaction + _alignment + _unity_score) / 4;
  else
    _total := (_security + _satisfaction + _alignment) / 3;
  end if;

  begin
    insert into public.check_ins (owner_id, kind) values (_uid, 'baseline') returning id into _check_in;
  exception when unique_violation then
    raise exception 'baseline_exists';
  end;

  insert into public.measurements (owner_id, check_in_id, metric, value)
  select _uid, _check_in, m.metric, m.value
  from (
    select key as metric, value::numeric as value from jsonb_each_text(_a)
    union all values
      ('score_security', round(_security)),
      ('score_satisfaction', round(_satisfaction)),
      ('score_alignment', round(_alignment)),
      ('stryvv_score', round(_total)),
      ('stryvv_score_version', 1)
    union all
    select 'score_unity', round(_unity_score) where _partnered
  ) as m;

  update public.profiles set in_relationship = _partnered where id = _uid;

  return _check_in;
end;
$$;

revoke execute on function public.record_baseline(jsonb) from public, anon;
grant execute on function public.record_baseline(jsonb) to authenticated;
