-- Requirements 5, 6: invite codes are single-use, expire, and a person has one partnership at a time.
begin;
select plan(16);

select tests.create_user('a@test.dev', 'Ada');
select tests.create_user('b@test.dev', 'Ben');
select tests.create_user('c@test.dev', 'Cy');

select tests.act_as('a@test.dev');
select set_config('tests.code', (select code from public.create_invite()), true);
select matches(current_setting('tests.code'), '^[A-HJKMNP-Z2-9]{10}$', 'code is 10 unambiguous characters');
select is((select code from public.create_invite()), current_setting('tests.code'), 'asking again returns the same pending invite');
select is((select count(*) from public.partnerships where status = 'pending'), 1::bigint, 'inviter sees their pending invite');
select throws_ok(format('select public.accept_invite(%L)', current_setting('tests.code')), 'cannot_accept_own_invite');
select throws_ok(
  $$insert into public.partnerships (inviter_id, invite_code, invite_expires_at) values (auth.uid(), 'HANDMADE22', now() + interval '1 day')$$,
  '42501', null, 'partnerships cannot be created directly');

-- Someone else cannot find the code by reading the table.
select tests.act_as('b@test.dev');
select is((select count(*) from public.partnerships), 0::bigint, 'the invite is not readable through the table');
select is((select inviter_first_name from public.preview_invite(current_setting('tests.code'))), 'Ada', 'preview shows the inviter''s first name');
select is((select valid from public.preview_invite(lower(current_setting('tests.code')))), true, 'preview accepts the code in lowercase');
select is((select count(*) from public.preview_invite('NOPE234567')), 0::bigint, 'an unknown code previews nothing');
select throws_ok($$select public.accept_invite('NOPE234567')$$, 'invite_not_found');

-- Accept: links both, with every category shared for both people.
select lives_ok(format('select public.accept_invite(%L)', current_setting('tests.code')), 'invitee accepts');
select is((select count(*) from public.sharing_settings where shared), 12::bigint, 'six categories for each of two people, all shared');

-- Single use.
select tests.act_as('c@test.dev');
select throws_ok(format('select public.accept_invite(%L)', current_setting('tests.code')), 'invite_used');

-- One partnership at a time.
select tests.act_as('b@test.dev');
select throws_ok('select * from public.create_invite()', 'already_partnered');

-- Expiry.
select tests.act_as('c@test.dev');
select set_config('tests.code2', (select code from public.create_invite()), true);
select tests.act_as_admin();
update public.partnerships set invite_expires_at = now() - interval '1 minute' where invite_code = current_setting('tests.code2');
select tests.create_user('d@test.dev', 'Dee');
select tests.act_as('d@test.dev');
select throws_ok(format('select public.accept_invite(%L)', current_setting('tests.code2')), 'invite_expired');
select is((select valid from public.preview_invite(current_setting('tests.code2'))), false, 'an expired code previews as not valid');

select * from finish();
rollback;
