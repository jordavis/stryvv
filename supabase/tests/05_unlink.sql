-- Requirement 8: either partner can unlink alone. Shared data is hidden at once.
-- Couple records are archived and stay with whoever created them.
begin;
select plan(17);

select tests.seed_linked_couple();

-- The partner (not the inviter) ends it, alone.
select tests.act_as('partner@test.dev');
insert into public.goals (title, partnership_id)
  select 'Partner-made shared goal', id from public.partnerships;
select lives_ok('select public.end_partnership()', 'either partner can end the partnership');
select throws_ok('select public.end_partnership()', 'no_partnership');

-- Stored state.
select tests.act_as_admin();
select is((select status from public.partnerships), 'ended'::public.partnership_status, 'partnership is marked ended');
select is((select ended_by from public.partnerships), tests.uid('partner@test.dev'), 'who ended it is recorded');
select isnt((select ended_at from public.partnerships), null, 'when it ended is recorded');
select is((select count(*) from public.goals where partnership_id is not null and status = 'archived'), 2::bigint, 'shared goals are archived, not deleted');
select is((select count(*) from public.money_moves where partnership_id is not null and status = 'archived'), 1::bigint, 'shared Money Moves are archived');
select is((select count(*) from public.money_dates where archived_at is not null), 1::bigint, 'money dates are archived');
select is((select status from public.goals where title = 'Personal goal'), 'active'::public.goal_status, 'personal records are untouched');

-- The former partner sees nothing of the owner's, and keeps only what they created.
select tests.act_as('partner@test.dev');
select is((select count(*) from public.money_history_entries), 0::bigint, 'former partner no longer sees money history');
select is((select count(*) from public.measurements), 0::bigint, 'former partner no longer sees scores');
select is((select count(*) from public.money_moves) + (select count(*) from public.money_move_logs), 0::bigint, 'former partner no longer sees Money Moves or logs');
select is((select array_agg(title) from public.goals), array['Partner-made shared goal'], 'former partner keeps only the shared goal they created');
select is((select count(*) from public.money_dates), 0::bigint, 'former partner loses money dates the owner logged');
select is((select count(*) from public.get_partner()), 0::bigint, 'no partner any more');

-- The owner keeps everything of their own, including what they created for the couple.
select tests.act_as('owner@test.dev');
select is((select count(*) from public.goals), 2::bigint, 'owner keeps their personal goal and the shared goal they created');
select is((select count(*) from public.money_dates), 1::bigint, 'owner keeps the money date they logged');

select * from finish();
rollback;
