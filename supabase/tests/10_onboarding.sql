-- Onboarding (docs/work/2026-10-16-onboarding-chat/): the Stryvv Score baseline is saved all or
-- nothing and only once, onboarding stages and conversations are kept valid, and chat history
-- can't be backdated or relabelled.
--
-- The score cases below are the same as lib/onboarding/score-cases.ts (a unit test checks that
-- each case's answers and expected scores appear in this file).
begin;
select plan(50);

select has_function('public', 'record_baseline', array['jsonb'], 'record_baseline exists');

select tests.seed_linked_couple();
reset role;
select tests.create_user('worst@test.dev', 'Wren');
select tests.create_user('couple@test.dev', 'Casey');

-- ---------------------------------------------------------------------------
-- Bad answers are refused, and leave nothing behind.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('stranger@test.dev');

select throws_ok(
  $$select public.record_baseline('{"security_shock": 1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0}')$$,
  'P0001', 'invalid_answers', 'a missing answer is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": 1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1, "stress": 3}')$$,
  'P0001', 'invalid_answers', 'an extra answer is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": 5, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1}')$$,
  'P0001', 'invalid_answers', 'an answer above 4 is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": -1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1}')$$,
  'P0001', 'invalid_answers', 'an answer below 0 is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": 1.5, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1}')$$,
  'P0001', 'invalid_answers', 'a fractional answer is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": "1", "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1}')$$,
  'P0001', 'invalid_answers', 'a text answer is refused');
select throws_ok(
  $$select public.record_baseline('{"security_shock": 1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1, "unity_same_page": 0}')$$,
  'P0001', 'invalid_answers', 'one Unity answer without the other is refused');
select throws_ok(
  $$select public.record_baseline('[1, 2, 3, 2, 0, 1]')$$,
  'P0001', 'invalid_answers', 'answers that are not an object are refused');
select throws_ok(
  $$select public.record_baseline(null)$$,
  'P0001', 'invalid_answers', 'no answers is refused');

select is((select count(*) from public.check_ins), 0::bigint, 'refused answers leave no check-in');
select is((select count(*) from public.measurements), 0::bigint, 'refused answers leave no measurements');

-- ---------------------------------------------------------------------------
-- Case "mixed": Very well, Somewhat | Very little, Somewhat | Completely, Very well.
-- Parts 62.5, 37.5, 87.5 are stored as 63, 38, 88; the total 62.5 is stored as 63.
-- ---------------------------------------------------------------------------
select lives_ok(
  $$select public.record_baseline('{"security_shock": 1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1}')$$,
  'a complete set of answers is saved');

select is((select count(*) from public.check_ins where kind = 'baseline'), 1::bigint, 'exactly one baseline check-in');
select is((select count(*) from public.measurements), 11::bigint, 'six answers, three parts, the total and the version');
select is(
  (select count(*) from public.measurements where owner_id = current_setting('tests.stranger_id')::uuid),
  11::bigint, 'every measurement belongs to the caller');
select is(
  (select count(*) from public.check_ins where owner_id = current_setting('tests.stranger_id')::uuid),
  1::bigint, 'the check-in belongs to the caller');

select is((select value from public.measurements where metric = 'security_shock'), 1::numeric, 'answers are stored as given');
select is((select value from public.measurements where metric = 'alignment_tracking'), 1::numeric, 'every answer is stored');
select is((select value from public.measurements where metric = 'score_security'), 63::numeric, 'mixed: security 63');
select is((select value from public.measurements where metric = 'score_satisfaction'), 38::numeric, 'mixed: satisfaction 38');
select is((select value from public.measurements where metric = 'score_alignment'), 88::numeric, 'mixed: alignment 88');
select is((select value from public.measurements where metric = 'stryvv_score'), 63::numeric, 'mixed: stryvv score 63');
select is((select value from public.measurements where metric = 'stryvv_score_version'), 1::numeric, 'the formula version is stored');
select is(
  (select in_relationship from public.profiles where id = current_setting('tests.stranger_id')::uuid),
  false, 'six answers record that the person is on their own');

select throws_ok(
  $$select public.record_baseline('{"security_shock": 0, "security_future": 0, "satisfaction_enough": 0, "satisfaction_sleep": 0, "alignment_values": 0, "alignment_tracking": 0}')$$,
  'P0001', 'baseline_exists', 'a second baseline is refused');
select is((select count(*) from public.measurements), 11::bigint, 'the refused second baseline adds nothing');

-- ---------------------------------------------------------------------------
-- Case "best": Completely on every item gives 100 everywhere.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('partner@test.dev');
select lives_ok(
  $$select public.record_baseline('{"security_shock": 0, "security_future": 0, "satisfaction_enough": 0, "satisfaction_sleep": 0, "alignment_values": 0, "alignment_tracking": 0}')$$,
  'best: saved');
select is(
  (select value from public.measurements where metric = 'stryvv_score' and owner_id = current_setting('tests.partner_id')::uuid),
  100::numeric, 'best: stryvv score 100');
select is(
  (select value from public.measurements where metric = 'score_alignment' and owner_id = current_setting('tests.partner_id')::uuid),
  100::numeric, 'best: alignment 100');

-- ---------------------------------------------------------------------------
-- Case "worst": Not at all on every item gives 0 everywhere.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('worst@test.dev');
select lives_ok(
  $$select public.record_baseline('{"security_shock": 4, "security_future": 4, "satisfaction_enough": 4, "satisfaction_sleep": 4, "alignment_values": 4, "alignment_tracking": 4}')$$,
  'worst: saved');
select is((select value from public.measurements where metric = 'stryvv_score'), 0::numeric, 'worst: stryvv score 0');
select is((select value from public.measurements where metric = 'score_security'), 0::numeric, 'worst: security 0');

-- ---------------------------------------------------------------------------
-- Case "partnered": the mixed answers plus Completely on both Unity items. Unity 100 joins the other
-- three parts: (62.5 + 37.5 + 87.5 + 100) / 4 = 71.875, stored as 72.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('couple@test.dev');
select lives_ok(
  $$select public.record_baseline('{"security_shock": 1, "security_future": 2, "satisfaction_enough": 3, "satisfaction_sleep": 2, "alignment_values": 0, "alignment_tracking": 1, "unity_same_page": 0, "unity_shared_vision": 0}')$$,
  'partnered: saved');
select is((select count(*) from public.measurements), 14::bigint, 'partnered: eight answers, four parts, the total and the version');
select is((select value from public.measurements where metric = 'score_unity'), 100::numeric, 'partnered: unity 100');
select is((select value from public.measurements where metric = 'stryvv_score'), 72::numeric, 'partnered: stryvv score 72');
select is((select in_relationship from public.profiles), true, 'partnered: the profile records the relationship');

-- Visitors can't call it.
reset role; select tests.act_as_anon();
select throws_ok(
  $$select public.record_baseline('{"security_shock": 0, "security_future": 0, "satisfaction_enough": 0, "satisfaction_sleep": 0, "alignment_values": 0, "alignment_tracking": 0}')$$,
  '42501', null, 'visitors cannot record a baseline');

-- ---------------------------------------------------------------------------
-- Onboarding stages.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('stranger@test.dev');
select lives_ok($$update public.profiles set onboarding_stage = 'baseline'$$, 'a known stage can be set');
select throws_ok($$update public.profiles set onboarding_stage = 'finished'$$, '23514', null, 'an unknown stage is refused');
select lives_ok(
  $$update public.profiles set rich_life_vision = 'Weekends free with the kids.'$$,
  'the person can save their rich-life vision');
select throws_ok(
  $$update public.profiles set rich_life_vision = repeat('a', 2001)$$,
  '23514', null, 'a vision over 2,000 characters is refused');

-- ---------------------------------------------------------------------------
-- Conversations: one onboarding conversation each, kind fixed, history not backdated.
-- ---------------------------------------------------------------------------
reset role; select tests.act_as('owner@test.dev');
select throws_ok(
  $$insert into public.conversations (kind) values ('onboarding')$$,
  '23505', null, 'a second onboarding conversation is refused');
select lives_ok($$insert into public.conversations (kind) values ('coach')$$, 'other kinds of conversation are allowed');
select throws_ok(
  $$update public.conversations set kind = 'coach' where kind = 'onboarding'$$,
  '42501', null, 'a conversation''s kind cannot be changed');
select lives_ok(
  $$update public.conversations set topic = 'story:1:0' where kind = 'onboarding'$$,
  'the topic can be updated');
select throws_ok(
  $$insert into public.conversations (kind, created_at) values ('check_in', now() - interval '1 year')$$,
  '42501', null, 'a conversation cannot be backdated');
select throws_ok(
  $$insert into public.messages (conversation_id, role, content, created_at)
    select id, 'user', 'hello', now() - interval '1 year' from public.conversations where kind = 'onboarding'$$,
  '42501', null, 'a message cannot be backdated');
select lives_ok(
  $$insert into public.messages (conversation_id, role, content)
    select id, 'user', 'hello' from public.conversations where kind = 'onboarding'$$,
  'a message can be added');

select * from finish();
rollback;
