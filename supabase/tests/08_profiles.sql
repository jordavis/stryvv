-- Profiles: a person edits their own details, but the record of accepting the terms
-- is written only by accept_terms(), with the server's clock.
begin;
select plan(8);

select tests.seed_linked_couple();
select tests.act_as('owner@test.dev');

select lives_ok($$update public.profiles set first_name = 'Olivia', phone = '+1 555 0100'$$, 'a person can edit their name and phone');
select is((select first_name from public.profiles), 'Olivia', 'the edit is saved');
select throws_ok($$update public.profiles set terms_accepted_at = now() - interval '1 year'$$, '42501', null, 'terms acceptance cannot be written directly');
select throws_ok($$update public.profiles set terms_version = 'made-up'$$, '42501', null, 'terms version cannot be written directly');
select throws_ok(format('update public.profiles set id = %L', gen_random_uuid()), '42501', null, 'a profile cannot be re-pointed at another person');

select lives_ok($$select public.accept_terms('2026-10')$$, 'accept_terms records acceptance');
select is((select terms_version from public.profiles), '2026-10', 'the version is stored');
select isnt((select terms_accepted_at from public.profiles), null, 'with a server timestamp');

select * from finish();
rollback;
