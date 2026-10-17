# Plan: Shrink the database's public API surface

From: intent.md / spec.md (2026-10-16). Approved: Jordan Davis, 2026-10-16 (task brief).

## Files that change
- `supabase/migrations/20261016000100_api_surface_hardening.sql` (new): `private` schema, move the four helpers, repoint `can_view`'s body, drop `pg_graphql`.
- `supabase/tests/09_api_surface.sql` (new): the helpers are gone from `public` and present in `private`; `anon` can't use `private`; no policy names a `public` helper; the `public` definer functions `authenticated` can run are exactly the six RPCs; `pg_graphql` is not installed; partner sharing still works through the moved helpers (including `can_view` and a sharing toggle).
- `lib/types/database.ts` (regenerated).
- `CLAUDE.md`, `.claude/skills/data-security/SKILL.md` (edit): helpers live in `private`; new helpers go there.

## Order of work
1. Write the migration and the test.
2. Re-apply migrations locally: `npx supabase stop --no-backup`, then `npm run db:start`.
3. `npm run test:db`: every file passes, including the untouched 01–08.
4. `npm run db:types`, then `npm run check`.
5. Commit, open a PR. After merge, with Jordan's go-ahead, apply to production through the connector and re-run the advisors.

## Risks
- **A policy stops resolving its helper.** Guard: `alter function … set schema` keeps the function's identity, so policies follow it; tests 01–08 exercise every policy, and 09 asserts no policy text names a `public` helper.
- **`can_view` keeps calling a name that no longer exists.** Guard: replaced in the same migration; 09 calls it as the partner.
- **Dropping `pg_graphql` fails because something depends on it.** Guard: nothing in our migrations uses it; the local stack applies the migration before CI or production see it.
- **A future helper lands in `public` again.** Guard: 09 pins the list of `public` definer functions `authenticated` can execute; adding one fails the test until it's added to the list on purpose.

## Proof
- `npm run test:db` green (all files).
- `npm run db:types` produces no diff after commit.
- `npm run check` green.
- After production apply: advisors show no 0027 and only the six intended RPCs under 0029.
