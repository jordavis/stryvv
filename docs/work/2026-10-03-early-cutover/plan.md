# Plan: Cut production over to the new schema early

From: intent.md / spec.md (2026-10-03). Approved: Jordan Davis, 2026-10-14.

## Files that change

**Removed (the old app)**
- `app/survey/`, `app/onboarding/`, `app/dashboard/`, `app/invite/`, `app/signup/`, `app/login/`, `app/logout/`, `app/forgot-password/`, `app/reset-password/`, `app/auth/`, `app/api/`
- `components/survey/`, `components/onboarding/`, `components/dashboard/`, `components/snapshot/`
- `lib/actions/`, `lib/context/`, `lib/constants/`, `lib/validations/` (with `survey.test.ts`), `lib/types/survey.ts`, `lib/dashboard/chat-context.ts`, `lib/supabase/admin.ts`

**Kept and moved**
- `lib/dashboard/markdown.ts` and `markdown.test.ts` → `lib/markdown.ts`, `lib/markdown.test.ts`

**Edited**
- `lib/supabase/proxy.ts`: public routes are `/` and `/coming-soon`. `/api/*` passes through (so removed routes return 404). Everything else redirects to `/coming-soon`.
- `app/page.tsx`: no user lookup.
- `components/landing/header.tsx`: no signed-in menu or Login link. The one button goes to `/coming-soon`.
- `components/landing/hero.tsx`, `cta2.tsx`, `footer.tsx`: `/survey` links go to `/coming-soon`.
- `CLAUDE.md`, `README.md`, `.claude/skills/data-security/SKILL.md`: one schema; the current site is landing + coming soon.

**New**
- `app/coming-soon/page.tsx`: the holding page.
- `supabase/cutover/drop-legacy.sql`: the one-off production script (spec requirement 9).
- `supabase/cutover/README.md`: the runbook steps 3 to 6, with the exact commands and the 10 legacy migration versions.

## Order of work
1. Commit this plan.
2. Remove the old app; move the markdown helper.
3. Edit the proxy, landing page and links; add the coming-soon page.
4. Write the cutover script, and test it against a local database that has a copy of the legacy objects (see Proof).
5. Update the docs.
6. `npm run check`, `npm run build`, look at `/`, `/coming-soon` and an old URL in the browser at desktop and phone widths.
7. Open the PR. After merge, Jordan runs the runbook; Claude verifies read-only.

## Risks
- **Something still imports deleted code.** Guard: typecheck and build.
- **The proxy redirects in a loop or blocks Next's own assets.** Guard: the matcher already excludes static files; `/coming-soon` is public; checked in the browser.
- **The cutover script drops something it shouldn't, or misses something.** Guard: it names every object explicitly (no `drop schema public`), aborts unless `households` exists, and runs in one transaction. Tested locally against a recreated legacy schema, then the new migrations are applied on top to prove the names no longer collide.

## Proof
- `npm run check` green; `npm run build` green.
- Browser: `/` renders; its buttons go to `/coming-soon`; `/survey`, `/dashboard` and `/invite/ABC123` redirect to `/coming-soon`; `/api/chat` is a 404. Desktop and phone width.
- Local script test: legacy objects created → script runs → none remain and `auth.users` is empty → second run aborts with the "not the legacy schema" error.
- After the production runbook: production has the 12 new tables with RLS on, none of the legacy ones, zero users.
