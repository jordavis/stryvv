# Intent: Shrink the database's public API surface

Author: Jordan Davis. Date: 2026-10-16. Status: accepted. Lane: careful.
Links: Supabase security advisors for production (`osxoklzwfotyacqbhcwb`), checked 2026-10-16 after signup went live (jordavis/stryvv#7).

## Problem
Production's security advisors report no missing RLS, but two warnings point at more API surface than the app needs:

- **Lint 0029 (SECURITY DEFINER functions callable by `authenticated`).** Ten definer functions in `public` can be called by any signed-in person at `/rest/v1/rpc/<name>`. Six are meant to be called by the app (`accept_terms`, `create_invite`, `preview_invite`, `accept_invite`, `end_partnership`, `get_partner`). Four are internal helpers the access rules use (`is_partnership_member`, `active_partnership_id`, `partner_sharing`, `can_view`). They only reveal things about the caller's own partnership today, but they're endpoints nobody should be calling directly, and every new helper added to `public` would be exposed the same way.
- **Lint 0027 (tables visible in GraphQL to signed-in users).** All 12 tables show up in `/graphql/v1` introspection to any account. The app doesn't use GraphQL.

Signup is open on `app.stryvv.com`, so "any signed-in person" means anyone with an email address.

## Proposed outcome
- The four helpers live in a schema the API doesn't expose, and the access rules keep working exactly as before.
- GraphQL is turned off.
- After it's applied to production, the advisors show no 0027 findings and 0029 lists only the six intended RPCs.

## Affected users and systems
- **Database:** a new migration; the RLS policies on `sharing_settings`, `goals`, `money_moves`, `money_move_logs`, `money_history_entries`, `check_ins`, `measurements` and `money_dates` (they call the helpers); the `pg_graphql` extension.
- **App code:** none. Nothing in the app calls the helpers or GraphQL.
- **Users:** none should notice anything.

## Constraints
- Partner sharing must behave exactly as before; the existing pgTAP tests must keep passing unchanged.
- Never edit a merged migration. Production gets the migration only after merge, with Jordan's go-ahead.
- Revoking EXECUTE from `authenticated` is not an option: policies run as the caller, so they would start failing.

## Out of scope
- Leaked-password protection (a dashboard toggle Jordan handles).
- The six intended RPCs stay definer functions in `public`; 0029 will keep listing them, by design.

## Open questions
- Disable `pg_graphql`, or revoke table visibility from it? → see spec.
