-- Requirement 10: measurements are a history. Nothing is overwritten, and the baseline stays retrievable.
begin;
select plan(11);

select tests.seed_linked_couple();
reset role; select tests.act_as('owner@test.dev');

select throws_ok('update public.measurements set value = 99', '42501', null, 'owner cannot edit a measurement');
select throws_ok('delete from public.measurements', '42501', null, 'owner cannot delete a measurement');
select throws_ok('delete from public.check_ins', '42501', null, 'owner cannot delete a check-in');
select throws_ok('delete from public.messages', '42501', null, 'chat messages cannot be deleted');

-- A later check-in adds a row; it does not replace the baseline.
-- (Two statements: a measurement must point at a check-in that already exists.)
insert into public.check_ins (kind) values ('monthly');
insert into public.measurements (check_in_id, metric, value)
  select id, 'cfpb_score', 62 from public.check_ins where kind = 'monthly';

select is((select count(*) from public.measurements where metric = 'cfpb_score'), 2::bigint, 'both measurements are kept');
select is(
  (select m.value from public.measurements m join public.check_ins c on c.id = m.check_in_id
   where c.kind = 'baseline' and m.metric = 'cfpb_score'),
  54::numeric, 'the baseline is still retrievable');

-- History can't be backdated, and there is one baseline per person.
select throws_ok(
  $$insert into public.check_ins (kind, completed_at) values ('weekly', now() - interval '1 year')$$,
  '42501', null, 'a check-in cannot be backdated');
select throws_ok(
  $$insert into public.measurements (check_in_id, metric, value, recorded_at)
    select id, 'stress', 3, now() - interval '1 year' from public.check_ins where kind = 'monthly'$$,
  '42501', null, 'a measurement cannot be backdated');
select throws_ok($$insert into public.check_ins (kind) values ('baseline')$$, '23505', null, 'a second baseline is refused');

-- A measurement can't be attached to someone else's check-in.
reset role; select tests.act_as('partner@test.dev');
select throws_ok(
  $$insert into public.measurements (check_in_id, metric, value) select id, 'stress', 1 from public.check_ins$$,
  '42501', null, 'partner cannot add a measurement to the owner''s check-in');
select throws_ok(
  format('insert into public.check_ins (owner_id, kind) values (%L, ''weekly'')', current_setting('tests.owner_id')::uuid),
  '42501', null, 'partner cannot create a check-in as the owner');

select * from finish();
rollback;
