-- Requirement 7: turning a category off hides it from the partner on the very next query,
-- and each person controls only their own switches.
begin;
select plan(10);

select tests.seed_linked_couple();

select tests.act_as('owner@test.dev');
update public.sharing_settings set shared = false
where owner_id = tests.uid('owner@test.dev') and category = 'money_history';
update public.sharing_settings set shared = false
where owner_id = tests.uid('owner@test.dev') and category = 'goals';
update public.sharing_settings set shared = false
where owner_id = tests.uid('owner@test.dev') and category = 'scores';

select tests.act_as('partner@test.dev');
select is((select count(*) from public.money_history_entries), 0::bigint, 'money history is hidden once unshared');
select is((select count(*) from public.measurements), 0::bigint, 'scores are hidden once unshared');
select is((select count(*) from public.check_ins), 0::bigint, 'check-ins are hidden once unshared');
select is((select count(*) from public.goals where title = 'Personal goal'), 0::bigint, 'personal goals are hidden once unshared');
select is((select count(*) from public.goals where title = 'Shared goal'), 1::bigint, 'a goal both adopted stays visible');
select is((select count(*) from public.money_moves), 2::bigint, 'a category left on stays visible');

-- The partner cannot flip the owner's switch back.
update public.sharing_settings set shared = true where owner_id = tests.uid('owner@test.dev');
select is((select count(*) from public.money_history_entries), 0::bigint, 'partner cannot re-share the owner''s category');
select throws_ok(
  $$update public.sharing_settings set category = 'goals' where category = 'documents'$$,
  '42501', null, 'only the shared switch can be changed');

-- The owner turns it back on: visible again at once.
select tests.act_as('owner@test.dev');
update public.sharing_settings set shared = true
where owner_id = tests.uid('owner@test.dev') and category = 'money_history';
select is((select count(*) from public.money_history_entries), 1::bigint, 'owner always sees their own records');
select tests.act_as('partner@test.dev');
select is((select count(*) from public.money_history_entries), 1::bigint, 'money history is visible again once re-shared');

select * from finish();
rollback;
