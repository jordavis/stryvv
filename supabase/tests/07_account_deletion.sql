-- When one partner deletes their account, the other keeps everything they created,
-- including couple records, and the partnership is ended rather than erased.
begin;
select plan(9);

select tests.seed_linked_couple();

-- The partner also creates couple records of their own.
select tests.act_as('partner@test.dev');
insert into public.goals (title, partnership_id) select 'Partner-made shared goal', id from public.partnerships;
insert into public.money_dates (partnership_id, notes) select id, 'Partner logged this one.' from public.partnerships;

-- The owner (who sent the invite) deletes their account.
reset role;
delete from auth.users where id = current_setting('tests.owner_id')::uuid;

select is((select count(*) from public.partnerships), 1::bigint, 'the partnership row survives');
select is((select status from public.partnerships), 'ended'::public.partnership_status, 'and is ended');
select is((select inviter_id from public.partnerships), null, 'its link to the deleted person is cleared');
select is((select count(*) from public.goals where owner_id = current_setting('tests.owner_id')::uuid), 0::bigint, 'the deleted person''s own records are gone');
select is((select count(*) from public.profiles where id = current_setting('tests.owner_id')::uuid), 0::bigint, 'and so is their profile');

select tests.act_as('partner@test.dev');
select is((select array_agg(title) from public.goals), array['Partner-made shared goal'], 'the remaining person keeps the shared goal they created');
select isnt((select archived_at from public.goals), null, 'and it is archived');
select is((select notes from public.money_dates), 'Partner logged this one.', 'the remaining person keeps the money date they logged');
select lives_ok('select * from public.create_invite()', 'the remaining person is free to invite someone new');

select * from finish();
rollback;
