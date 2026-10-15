# Spec: Cut production over to the new schema early

From: intent.md (2026-10-03). Status: accepted.

## Requirements

**Live site**
1. `/` shows the existing landing page. It no longer reads the signed-in user, and its header has no Login, Dashboard or Log out links.
2. Every call-to-action on the landing page that pointed at `/survey` or `/login` points at `/coming-soon`.
3. `/coming-soon` is a public page that says Stryvv is being rebuilt and will be back soon. It collects nothing and links back to `/`.
4. Any other path, including old ones (`/survey`, `/login`, `/signup`, `/dashboard`, `/onboarding`, `/invite/<code>`, `/forgot-password`, `/reset-password`, `/logout`), redirects to `/coming-soon`. Old `/api/chat` and `/api/money-history` return 404.
5. No code path in the deployed app calls OpenAI, Resend or the Supabase service-role client.

**Repo**
6. The old app is deleted: the survey, onboarding, dashboard, invite and auth pages; `app/api/*`; `lib/actions/*`; the survey context, constants, types and validations; the survey, onboarding, dashboard and snapshot components; `lib/dashboard/chat-context.ts`; `lib/supabase/admin.ts`.
7. `lib/dashboard/markdown.ts` and its test are kept (moved to `lib/markdown.ts`). The new coach chat will need safe rendering of model output.
8. `npm run check` and `npm run build` pass. `CLAUDE.md`, the README and the `data-security` skill describe one schema.

**Production database**
9. A one-off script, `supabase/cutover/drop-legacy.sql`, removes exactly the legacy objects (listed below) and all rows in `auth.users`. It refuses to run if the legacy `households` table isn't there, runs in one transaction, and is never part of `supabase/migrations/`.
10. After the script, the repo's migrations are applied to production and the remote migration history contains only the repo's six versions.
11. After cutover, production has the 12 new tables with RLS enabled on each, none of the legacy tables, zero rows in `auth.users`, and no security-advisor warnings about missing RLS.

## User experience

| Where | What the person sees |
|---|---|
| `/` | The landing page as today, with "Start stryvving" style buttons leading to coming soon |
| `/coming-soon` | Logo, a heading ("We're rebuilding Stryvv"), two sentences on what's coming, and a link back to the home page. Works at phone width. No form |
| Any old link or bookmark | Redirect to `/coming-soon` |

There is no signed-in state, loading state or partner state in this release, because there are no accounts.

## Data and API changes

**Schema change: production's legacy schema is dropped. This cannot be undone.**

Legacy objects in production today (read from the project on 2026-10-03):
- Tables: `households` (28 rows), `profiles` (13), `survey_responses` (16), `chat_messages` (4), `snapshots` (1), `money_histories` (0). (Corrected 2026-10-14: the first read on 2026-10-03 used stale table statistics and showed 3 households and no other rows. Exact counts came from `count(*)` before the backup.)
- Functions: `get_my_household_id()`, `set_updated_at()`.
- Enum types: `conversation_feeling`, `discussion_frequency`, `finance_manager`, `finance_structure`, `financial_priority`, `goal_alignment`, `learning_style`, `money_style`, `partner_type`, `reflection_feeling`, `relationship_duration`.
- `auth.users`: 28 rows.
- Remote migration history: 10 versions from February and March 2026 that aren't in the repo.

Two of these collide with the new schema by name (`profiles`, `set_updated_at`), so the new migrations can't be applied until the legacy objects are gone.

**App changes**
- `lib/supabase/proxy.ts`: public routes become `/` and `/coming-soon`; everything else redirects to `/coming-soon` instead of `/login`. Session refresh stays, ready for the new signup.
- `app/page.tsx`, `components/landing/header.tsx`: drop the user lookup and the signed-in menu.
- New `app/coming-soon/page.tsx`.

## Cutover runbook (the order matters)

1. **Merge the app PR.** Vercel deploys the reduced site. From this point nothing live reads the old tables.
2. **Check the live site**: `/` loads, `/survey` and `/dashboard` land on coming soon.
3. **Back up** (Jordan): `npx supabase login`, `npx supabase link --project-ref osxoklzwfotyacqbhcwb`, then `npx supabase db dump --linked -f legacy-backup.sql` and `npx supabase db dump --linked --data-only -f legacy-data.sql`. Keep the files outside the repo.
4. **Drop legacy** (Jordan): paste `supabase/cutover/drop-legacy.sql` into the Supabase SQL editor and run it.
5. **Reset migration history** (Jordan): `npx supabase migration repair --status reverted` with the 10 legacy versions.
6. **Apply the new schema** (Jordan): `npx supabase db push`, reviewing the list of six migrations it prints before confirming.
7. **Verify** (Claude, read-only through the connector): requirement 11.

Steps 3 to 6 are run by Jordan. The repo's guard hook blocks the agent from pushing migrations, and the agent doesn't run destructive SQL on production.

## Security and privacy
- After cutover no personal data remains in production: all accounts and the three household rows are gone.
- The backup files contain test users' email addresses. They stay on Jordan's machine, never in the repo.
- The reduced site has no authenticated surface. The service-role client is removed from the codebase.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `RESEND_API_KEY` stay set in Vercel but are unused.

## Concerns flagged

- **Irreversible data loss.** Tables and 28 logins are deleted. → Accepted in the intent (test data). The backup in step 3 is still required before step 4.
- **Deleting accounts in a script is dangerous if it's ever re-run.** → The script is one-off, lives outside `supabase/migrations/`, and aborts unless the legacy `households` table exists, so it can't run against the new schema.
- **Gap between step 1 and step 6.** After the site is reduced but before the new schema is applied, production still has the old tables. → Harmless: nothing reads them. If the cutover is interrupted, the site still works.
- **Old invite emails and bookmarks.** People who got an invite link will land on coming soon. → Acceptable; they were test invites.
- **A test is deleted with the code it tests.** `lib/validations/survey.test.ts` goes when the survey goes. `CLAUDE.md` says never to delete a failing test; this one is passing and its subject no longer exists. → Delete it, and say so in the PR.
- **The landing page still describes the old product** (survey, snapshot). → Out of scope here; worth its own quick intent before the new signup ships.
- **Supabase auth settings** (email templates, the 6-digit code) are configured in the dashboard, not in the repo. → Out of scope; handled in the signup intent.
- **Unused packages stay installed.** → Deliberate, to avoid removing and re-adding `ai`, `zod` and others within weeks.

## Answers to intent's open questions
- None were open.
