# Spec: Shrink the database's public API surface

From: intent.md (2026-10-16). Status: accepted.

## Requirements
1. `is_partnership_member`, `active_partnership_id`, `partner_sharing` and `can_view` no longer exist in `public` (or any schema PostgREST serves), so `/rest/v1/rpc/<name>` can't reach them.
2. They exist in a new `private` schema with the same signatures and behavior. `authenticated` can use the schema and execute them (policies run as the caller); `anon` and `public` can't.
3. Every RLS policy that called a helper now calls the `private` one, and no policy refers to a `public` helper.
4. The definer functions `authenticated` can execute in `public` are exactly the six intended RPCs: `accept_terms`, `create_invite`, `preview_invite`, `accept_invite`, `end_partnership`, `get_partner`.
5. Partner sharing behaves as before: a linked partner reads shared categories, loses them when a category is turned off or the partnership ends, and a stranger reads nothing. The existing tests in `supabase/tests/` pass unchanged.
6. `pg_graphql` is not installed, so `/graphql/v1` exposes no tables.

## User experience
None. No screen changes.

## Data and API changes
**Schema change.** One new migration, `supabase/migrations/20261016000100_api_surface_hardening.sql`:

- `create schema private`; revoke everything on it from `public`; grant `usage` to `authenticated` only. New functions created there don't get the default EXECUTE-to-PUBLIC grant.
- `alter function … set schema private` for the four helpers. Policies store a reference to the function itself, not its name, so they follow the move with no `drop policy`/`create policy`. Grants and `search_path = ''` move with the function too.
- `can_view`'s body calls `public.partner_sharing` by name (SQL function bodies are stored as text), so it's replaced in the same migration to call `private.partner_sharing`. Nothing else calls a helper by name: the other definer functions (`create_invite`, `accept_invite`, `end_partnership`, …) read the tables directly.
- `drop extension if exists pg_graphql`.

`private` is not in the API's exposed schemas: locally `supabase/config.toml` lists `public` and `graphql_public`, and production uses the same defaults. Nothing needs changing there.

`lib/types/database.ts` is regenerated. The helpers disappear from `public.Functions`. Supabase leaves a `graphql_public.graphql` placeholder function after the extension is dropped, so that entry may stay.

## Security and privacy
- No access rule changes; the same functions with the same bodies decide the same things. The change only removes direct-call endpoints.
- `can_view` was described as "for app code" in the data-model spec, but no app code calls it. Moving it means app code can't call it through `supabase.rpc()`. That's the intended rule anyway (data-security rule 2: read a partner's rows through RLS-filtered queries, never re-check sharing in app code), so it goes with the others.
- New helpers belong in `private`. `CLAUDE.md` and the `data-security` skill say so.

## Concerns flagged
- **Revoking EXECUTE instead would break RLS**: policies call the helpers as the signed-in user → move them, keep the grant. Resolved.
- **Disable `pg_graphql` or revoke from it?** Supabase's guidance for 0026/0027 is to drop the extension when GraphQL isn't used. The alternatives are worse here: revoking `SELECT` on tables from `authenticated` breaks REST, and revoking `graphql.resolve` closes the endpoint but leaves the lint firing. The app has no GraphQL client (the `graphql` npm package in the lockfile is a transitive dependency). → Drop it. It's an extension, not data, and `create extension pg_graphql` (or the dashboard toggle) restores it.
- **Production migration history must match the repo.** → Apply through the connector only after merge, with Jordan's go-ahead, then re-run the advisors (read-only) to confirm 0027 is gone and 0029 lists only the six RPCs.

## Answers to intent's open questions
- Disable `pg_graphql`, or revoke? → Disable it (drop the extension), see above.
