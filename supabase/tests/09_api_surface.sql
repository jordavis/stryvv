-- API surface (docs/work/2026-10-16-api-surface-hardening/): the access-rule helpers can't be
-- reached through /rest/v1/rpc, only the intended RPCs are definer functions in `public`, GraphQL is
-- off, and partner sharing still works through the moved helpers.
begin;
select plan(23);

-- The helpers left `public`, the schema the API serves...
select hasnt_function('public', 'is_partnership_member', array['uuid'], 'is_partnership_member is not in public');
select hasnt_function('public', 'active_partnership_id', array[]::text[], 'active_partnership_id is not in public');
select hasnt_function('public', 'partner_sharing', array['sharing_category'], 'partner_sharing is not in public');
select hasnt_function('public', 'can_view', array['uuid', 'sharing_category'], 'can_view is not in public');

-- ...and live in `private`, which it doesn't.
select has_function('private', 'is_partnership_member', array['uuid'], 'is_partnership_member is in private');
select has_function('private', 'active_partnership_id', array[]::text[], 'active_partnership_id is in private');
select has_function('private', 'partner_sharing', array['sharing_category'], 'partner_sharing is in private');
select has_function('private', 'can_view', array['uuid', 'sharing_category'], 'can_view is in private');

select ok(has_schema_privilege('authenticated', 'private', 'usage'), 'signed-in people can use private (policies run as them)');
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'visitors cannot use private');

-- Every policy now calls the private helpers.
select is(
  (select count(*) from pg_policies
   where schemaname = 'public'
     and coalesce(qual, '') || coalesce(with_check, '')
       ~ 'public\.(is_partnership_member|active_partnership_id|partner_sharing|can_view)\('),
  0::bigint, 'no policy calls a helper in public');
select ok(
  (select count(*) from pg_policies
   where schemaname = 'public' and coalesce(qual, '') || coalesce(with_check, '') ~ 'private\.') >= 10,
  'policies call the helpers in private');

-- The only definer functions a signed-in person can call in public are the intended RPCs.
-- Adding one to this list should be a deliberate choice.
select is(
  (select array_agg(p.proname::text order by p.proname)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute')),
  array['accept_invite', 'accept_terms', 'create_invite', 'end_partnership', 'get_partner', 'preview_invite'],
  'only the intended RPCs are callable definer functions in public');

select hasnt_extension('pg_graphql', 'GraphQL is off');

-- Visitors can't call the helpers at all.
select tests.act_as_anon();
select throws_ok($$select private.partner_sharing('goals')$$, '42501', null, 'visitors cannot call private helpers');
reset role;

-- Partner sharing still works through the moved helpers.
select tests.seed_linked_couple();

reset role; select tests.act_as('partner@test.dev');
select is((select count(*) from public.goals), 2::bigint, 'partner reads the owner''s goals while shared');
select ok(private.can_view(current_setting('tests.owner_id')::uuid, 'goals'), 'can_view: partner may view shared goals');
select ok(private.can_view(current_setting('tests.partner_id')::uuid, 'goals'), 'can_view: anyone may view their own records');

reset role; select tests.act_as('stranger@test.dev');
select is((select count(*) from public.goals), 0::bigint, 'a stranger reads no goals');
select ok(not private.can_view(current_setting('tests.owner_id')::uuid, 'goals'), 'can_view: a stranger may not view');

reset role; select tests.act_as('owner@test.dev');
update public.sharing_settings set shared = false
where owner_id = current_setting('tests.owner_id')::uuid and category = 'goals';

reset role; select tests.act_as('partner@test.dev');
select is((select count(*) from public.goals), 1::bigint, 'once unshared, only the goal both adopted stays visible');
select ok(not private.can_view(current_setting('tests.owner_id')::uuid, 'goals'), 'can_view: unshared goals are hidden');
select is((select count(*) from public.money_moves), 2::bigint, 'a category left on stays visible');

select * from finish();
rollback;
