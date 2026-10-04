-- Requirements 3, 4, 11: a linked partner reads shared categories, never writes another
-- person's records, and never sees a transcript.
begin;
select plan(19);

select tests.seed_linked_couple();
-- The partner can't see the owner's conversation, so remember its id for the write test below.
select set_config('tests.conversation_id', (select id::text from public.conversations), true);
select tests.act_as('partner@test.dev');

-- Reads: everything is shared by default.
select is((select count(*) from public.money_history_entries), 1::bigint, 'partner reads shared money history');
select is((select count(*) from public.goals), 2::bigint, 'partner reads the personal and the shared goal');
select is((select count(*) from public.money_moves), 2::bigint, 'partner reads both Money Moves');
select is((select count(*) from public.money_move_logs), 1::bigint, 'partner reads Money Move logs');
select is((select count(*) from public.measurements), 1::bigint, 'partner reads shared scores');
select is((select count(*) from public.money_dates), 1::bigint, 'partner reads the couple''s money dates');
select is((select first_name from public.get_partner()), 'Olive', 'partner gets the owner''s first name');
select is((select count(*) from public.profiles), 1::bigint, 'partner cannot read the owner''s profile row');

-- Transcripts are always private.
select is((select count(*) from public.conversations), 0::bigint, 'partner never sees conversations');
select is((select count(*) from public.messages), 0::bigint, 'partner never sees messages');

-- Writes to the owner's personal records do nothing or fail.
update public.money_history_entries set title = 'changed';
update public.goals set title = 'changed' where title = 'Personal goal';
delete from public.goals where title = 'Personal goal';
delete from public.money_history_entries;
select tests.act_as_admin();
select is((select title from public.money_history_entries), 'Spending on fun is risky', 'partner cannot edit or delete the owner''s money history');
select is((select count(*) from public.goals where title = 'Personal goal'), 1::bigint, 'partner cannot edit or delete the owner''s personal goal');

select tests.act_as('partner@test.dev');
select throws_ok(
  format('insert into public.goals (owner_id, title) values (%L, ''planted'')', tests.uid('owner@test.dev')),
  '42501', null, 'partner cannot create a goal as the owner');
select throws_ok(
  format('insert into public.messages (conversation_id, role, content) values (%L, ''user'', ''planted'')', current_setting('tests.conversation_id')),
  '42501', null, 'partner cannot write into the owner''s conversation');
select throws_ok('update public.measurements set value = 99', '42501', null, 'nobody can edit measurements');

-- Shared records: both may edit, but ownership cannot be taken.
update public.goals set current_amount = 250 where title = 'Shared goal';
select is((select current_amount from public.goals where title = 'Shared goal'), 250::numeric, 'partner can update a shared goal');
select throws_ok(
  format('update public.goals set owner_id = %L where title = ''Shared goal''', tests.uid('partner@test.dev')),
  null, null, 'partner cannot take ownership of a shared goal');
select lives_ok(
  $$insert into public.money_move_logs (money_move_id, week_start, done_count)
    select id, date '2026-09-28', 1 from public.money_moves where title = 'Shared move'$$,
  'partner can log their own count on a shared Money Move');
select throws_ok(
  $$insert into public.money_move_logs (money_move_id, week_start, done_count)
    select id, date '2026-09-28', 1 from public.money_moves where title = 'Personal move'$$,
  '42501', null, 'partner cannot log on the owner''s personal Money Move');

select * from finish();
rollback;
