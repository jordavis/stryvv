-- Requirement 2: a signed-out visitor and an unlinked signed-in person can read nothing.
begin;
select plan(26);

select tests.seed_linked_couple();

-- Signed out: no access to any table at all.
reset role; select tests.act_as_anon();
select throws_ok('select count(*) from public.profiles', '42501', null, 'anon cannot read profiles');
select throws_ok('select count(*) from public.partnerships', '42501', null, 'anon cannot read partnerships');
select throws_ok('select count(*) from public.sharing_settings', '42501', null, 'anon cannot read sharing_settings');
select throws_ok('select count(*) from public.conversations', '42501', null, 'anon cannot read conversations');
select throws_ok('select count(*) from public.messages', '42501', null, 'anon cannot read messages');
select throws_ok('select count(*) from public.money_history_entries', '42501', null, 'anon cannot read money_history_entries');
select throws_ok('select count(*) from public.goals', '42501', null, 'anon cannot read goals');
select throws_ok('select count(*) from public.money_moves', '42501', null, 'anon cannot read money_moves');
select throws_ok('select count(*) from public.money_move_logs', '42501', null, 'anon cannot read money_move_logs');
select throws_ok('select count(*) from public.check_ins', '42501', null, 'anon cannot read check_ins');
select throws_ok('select count(*) from public.measurements', '42501', null, 'anon cannot read measurements');
select throws_ok('select count(*) from public.money_dates', '42501', null, 'anon cannot read money_dates');
select throws_ok('select * from public.preview_invite(''ANYCODE123'')', '42501', null, 'anon cannot preview an invite');

-- A stranger: signed in, linked to nobody. Sees only their own profile.
reset role; select tests.act_as('stranger@test.dev');
select is((select count(*) from public.profiles), 1::bigint, 'stranger sees only their own profile');
select is((select id from public.profiles), current_setting('tests.stranger_id')::uuid, 'and it is theirs');
select is((select count(*) from public.partnerships), 0::bigint, 'stranger sees no partnerships');
select is((select count(*) from public.sharing_settings), 0::bigint, 'stranger sees no sharing settings');
select is((select count(*) from public.conversations), 0::bigint, 'stranger sees no conversations');
select is((select count(*) from public.messages), 0::bigint, 'stranger sees no messages');
select is((select count(*) from public.money_history_entries), 0::bigint, 'stranger sees no money history');
select is((select count(*) from public.goals), 0::bigint, 'stranger sees no goals');
select is((select count(*) from public.money_moves), 0::bigint, 'stranger sees no Money Moves');
select is((select count(*) from public.money_move_logs), 0::bigint, 'stranger sees no Money Move logs');
select is((select count(*) from public.check_ins) + (select count(*) from public.measurements), 0::bigint, 'stranger sees no check-ins or measurements');
select is((select count(*) from public.money_dates), 0::bigint, 'stranger sees no money dates');
select is((select count(*) from public.get_partner()), 0::bigint, 'stranger has no partner');

select * from finish();
rollback;
