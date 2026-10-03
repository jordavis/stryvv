# Plan: Individual-first data model

From: intent.md / spec.md (2026-10-03). Approved: Jordan Davis, 2026-10-03.

## Context

Stryvv is being rebuilt as an individual-first, chat-led app. Today's database assumes a couple (everything hangs off a household), has no place for what the new product captures, and isn't in the repo at all. The accepted spec defines 12 tables owned by the individual, a partner link with per-category sharing enforced by the database, and tests that prove nobody sees what they shouldn't.

This plan builds that schema as migrations in the repo, with tests, against a **local** Supabase. It builds no screens and does not touch production or the existing app code, which keeps running on the old schema until later work replaces it.

## Before I start (your steps)

1. **Install OrbStack** (chosen for running the local database): https://orbstack.dev, then open it once so Docker is running.
2. **Create the dev Supabase project** (`stryvv-dev`) in the Supabase dashboard and send me the project ref. This doesn't block the build, which runs locally; it's needed for step 8.

## Files that change

**New: database**
- `supabase/config.toml` (new): local stack config from `supabase init`; `project_id = "stryvv"`. No keys.
- `supabase/migrations/<ts>_profiles.sql` (new): enums (`sharing_category`, `partnership_status`, and the status/kind enums), `profiles`, the trigger that creates a profile when an auth user is created, RLS.
- `supabase/migrations/<ts>_partnerships.sql` (new): `partnerships`, `sharing_settings`, RLS, and the functions `can_view`, `is_partnership_member`, `is_active_partnership_member`, `create_invite`, `preview_invite`, `accept_invite`, `get_partner` (returns the active partner's id and first name only).
- `supabase/migrations/<ts>_conversations.sql` (new): `conversations`, `messages`, owner-only RLS.
- `supabase/migrations/<ts>_captured_records.sql` (new): `money_history_entries`, `goals`, `money_moves`, `money_move_logs`, RLS using `can_view`.
- `supabase/migrations/<ts>_check_ins.sql` (new): `check_ins`, `measurements` (insert-only), `money_dates`, RLS.
- `supabase/migrations/<ts>_end_partnership.sql` (new): the `end_partnership` function. It's in its own file, last, because it archives rows in tables created after `partnerships`. (Changed from the approved plan, which had it in the partnerships file.)

Every table gets RLS enabled and its policies in the same file that creates it. All person-owned rows cascade on delete from `auth.users`. Definer functions set `search_path = ''` and check `auth.uid()` themselves.

**New: tests** (pgTAP, run by `supabase test db`; each file runs in a transaction that rolls back)
- `supabase/tests/00_helpers.sql`: create three users (owner, partner, stranger) and a helper to act as each.
- `supabase/tests/01_isolation.sql`: signed-out and stranger read zero rows from every table (requirement 2).
- `supabase/tests/02_partner_sharing.sql`: a partner reads shared categories, cannot write, never sees transcripts (requirements 3, 4, 11).
- `supabase/tests/03_sharing_toggle.sql`: turning a category off hides it on the next query (requirement 7).
- `supabase/tests/04_invites.sql`: single-use, expiry, one partnership at a time, code not readable through the table (requirements 5, 6).
- `supabase/tests/05_unlink.sql`: either partner can end it; shared data is hidden; couple records are archived and stay with their creator (requirement 8).
- `supabase/tests/06_append_only.sql`: measurements can't be updated or deleted; baseline stays retrievable (requirement 10).

**New / edited: app and tooling**
- `package.json` (edit, via `npm install -D supabase`): add the Supabase CLI and scripts `db:start`, `db:stop`, `test:db` (`supabase test db`), `db:types` (`supabase gen types typescript --local > lib/types/database.ts`).
- `lib/types/database.ts` (new, generated): committed. Not wired into the existing clients yet, because the old pages still query the old tables and would fail typecheck.
- `eslint.config.mjs` (edit): ignore the generated types file.
- `.github/workflows/ci.yml` (edit): add a `db` job that starts the local database, runs `supabase test db`, and fails if `lib/types/database.ts` is out of date.
- `README.md` (edit): replace the "schema isn't in the repo" note with local database setup and how to apply migrations to a hosted project.
- `CLAUDE.md` (edit): update the Data section (new tables, individual ownership, where migrations live, `npm run test:db`).
- `.claude/skills/data-security/SKILL.md` (edit): rules 2 and the core promise change from "scope by household" to "scope by owner; partner access only through `can_view`".
- `docs/work/2026-10-03-individual-first-data-model/plan.md` (new): this plan, saved once approved.

**Not changed:** `app/`, `components/`, `lib/actions/`, `app/api/`, `lib/supabase/*`, `proxy.ts`. Production's database is not touched.

## Order of work

1. Save this plan as `plan.md` in the work folder and commit it.
2. `npm install -D supabase`; `npx supabase init`; commit the scaffold.
3. Write the test helpers and `01_isolation.sql` first, so they fail before the tables exist.
4. Write the migrations one at a time, in the order listed above. After each one, restart the local database to apply it and run `npm run test:db`, adding that area's test file as I go.
5. Generate `lib/types/database.ts`; add the lint ignore.
6. Add the CI job.
7. Update README, CLAUDE.md and the data-security skill.
8. **You** link and push the migrations to the dev project (`npx supabase link`, then `npx supabase db push`). The repo's guard hook blocks me from running `db push`, by design. I then point the Supabase connector at dev and confirm the tables and policies match with a read-only check.
9. `npm run check`, then `/ship` to open the PR.

To re-apply migrations locally I'll use `supabase stop --no-backup` then `supabase start`, since the guard hook also blocks `supabase db reset`.

## Risks

- **A policy mistake leaks data.** This is the main risk. Guard: the tests are written to fail first, cover every table for the stranger case, and run in CI on every PR. I'll also run Supabase's security advisor against dev after step 8.
- **RLS recursion or slow policies.** `can_view` reads `partnerships` and `sharing_settings`, which have their own policies. Guard: it's a definer function, so it bypasses those policies, and it's marked `stable` with indexes on `(inviter_id)`, `(invitee_id)` and `(partnership_id, owner_id, category)`.
- **Existing app breaks.** Guard: no existing file under `app/`, `lib/actions/` or `lib/supabase/` changes, and the generated types aren't wired into the current clients. `npm run check` must stay green.
- **Production touched by accident.** Guard: nothing is linked to production; `db push` is run only by you, only against dev.
- **CI can't start the database.** GitHub's runners have Docker, and I'll start only the database service to keep the job fast. If it proves flaky, the fallback is to keep the job but mark it required only after it's stable.

## Proof

- `npm run test:db`: all seven pgTAP files pass locally, with the output pasted in the PR.
- Each of spec requirements 2, 3, 4, 5–8 and 10 maps to at least one named test.
- From an empty local database, `supabase start` alone produces the full schema (requirement 12).
- `npm run db:types` produces no diff after the last migration (requirement 13).
- CI: both the existing `check` job and the new `db` job are green on the PR.
- `npm run check` green.
- After step 8: the dev project lists the 12 tables with RLS enabled on each, and the security advisor reports no RLS warnings.
