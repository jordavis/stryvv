-- Voice input (docs/work/2026-11-04-voice-input/): transcription_requests holds only a size and a
-- time per request, so limits can be counted. Owner-only, append-only, never backdated.
begin;
select plan(10);

select has_table('public', 'transcription_requests', 'transcription_requests exists');

select tests.seed_linked_couple();

reset role; select tests.act_as('owner@test.dev');
select lives_ok($$insert into public.transcription_requests (bytes) values (120000)$$, 'the owner records a request');
select is((select count(*) from public.transcription_requests), 1::bigint, 'the owner reads their own requests');
select throws_ok($$insert into public.transcription_requests (bytes) values (0)$$, '23514', null, 'an empty recording is refused');
select throws_ok($$insert into public.transcription_requests (bytes) values (4194305)$$, '23514', null, 'a recording over 4 MB is refused');
select throws_ok(
  $$insert into public.transcription_requests (bytes, created_at) values (1000, now() - interval '1 day')$$,
  '42501', null, 'a request cannot be backdated (which would dodge the limits)');
select throws_ok(
  format('insert into public.transcription_requests (owner_id, bytes) values (%L, 1000)', current_setting('tests.partner_id')::uuid),
  '42501', null, 'a request cannot be recorded for someone else');
select throws_ok($$delete from public.transcription_requests$$, '42501', null, 'requests cannot be deleted (which would reset the limits)');

-- Partners and strangers see nothing: these rows are never shared.
reset role; select tests.act_as('partner@test.dev');
select is((select count(*) from public.transcription_requests), 0::bigint, 'a partner reads none of the owner''s requests');
reset role; select tests.act_as('stranger@test.dev');
select is((select count(*) from public.transcription_requests), 0::bigint, 'a stranger reads none');

select * from finish();
rollback;
