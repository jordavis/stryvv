# Stryvv

Next.js 16 App Router app that helps couples align on money. TypeScript, Tailwind v4, shadcn/ui, Supabase (auth + Postgres), Vercel AI SDK (OpenAI), Resend. Deployed on Vercel; merging to `main` deploys production.

## Commands

```bash
npm run dev        # dev server on localhost:3000 (needs .env.local, see .env.example)
npm run dev:local  # dev server on :3001 against the LOCAL Supabase (npm run db:start); use this to test auth
npm run check      # lint + typecheck + unit tests — run before saying a task is done
npm run test       # vitest only ("Tests  N passed")
npm run build      # production build
```

## Verifying your work

- Run `npm run check` before reporting any task complete, and paste the summary lines.
- Lint should be clean: no errors and no warnings.
- For UI changes, open the page in the browser pane and look at it (use the `verifier` agent for anything non-trivial).
- If a test fails, fix the code, not the test. Never delete or skip a failing test.
- For a bug fix, write the failing test first (see the `fix-bug` skill).

## How work flows

See `docs/SDLC.md`. In short: small fixes go straight to a branch + PR. Features get `docs/work/<date>-<slug>/intent.md` → (`spec.md` if risky) → `plan.md` from plan mode, committed with the code. When the implementation departs from `plan.md`, update it in the same commit.

## Architecture

Stryvv is being rebuilt as an individual-first, chat-led, mobile-first app (`docs/product-vision.md`; design system and mockups linked from `docs/design-references.md`). The old survey/household app was removed on 2026-10-14.

- **Live site:** the landing page (`app/page.tsx`, `components/landing/`) and a holding page (`app/coming-soon/`), linked from the landing page. Signup works but is hidden: reachable only at `/signup` until onboarding ships.
- **Auth** (`docs/work/2026-10-14-signup-email-code/`): `app/(auth)/` holds `/signup`, `/verify`, `/login`, `/forgot-password`; `app/(app)/` holds signed-in pages (`/welcome`, and `/set-password` where a reset ends if the new password couldn't be saved) and checks the user in its layout. Server actions in `lib/actions/auth.ts` (export only actions from it: everything a `"use server"` file exports is publicly callable; helpers go in `lib/auth/`); field rules in `lib/validation/auth.ts`; error wording in `lib/actions/auth-errors.ts` (keeps sign-up, sign-in and reset from revealing whether an account exists). Email is confirmed with a 6-digit code (`{{ .Token }}` templates in `supabase/templates/`). The address moves from sign-up to the code screen in an httpOnly cookie, never in a URL.
- `proxy.ts` (logic in `lib/supabase/proxy.ts`) refreshes the Supabase session and routes requests: public pages, auth pages (signed-in people go to `/welcome`), signed-in pages (others go to `/login`), and everything else to `/coming-soon`. `/api/*` passes through. Add each new page to one of those lists.
- `lib/markdown.ts` renders model output safely (escapes HTML first). Use it for any AI text shown in the UI.
- Components: `components/app/` for app screens (design-system Button, TextField, CodeInput, AuthCard, AppShell), `components/ui/` (shadcn) and `landing/`. App screens use the Stryvv Design System tokens in `app/globals.css` under `.stryvv-app` (Tailwind names `bg-sv-teal`, `text-sv-ink-muted`, `rounded-sv-md`, `font-sv-display`…), with Manrope and Figtree from `lib/fonts.ts`. Copy new token values from the design system's `tokens.json`; don't invent them.
- Tailwind v4 via `@tailwindcss/postcss` (no tailwind.config). `cn()` in `lib/utils.ts`. Path alias `@/*` = repo root.

## Data

- **Schema: `supabase/migrations/`, individual-first.** Every record belongs to a person (`owner_id`). Partners link through `partnerships`; what a partner can read is decided per category in RLS by `private.partner_sharing(category)` (`private.can_view()` is the same rule for one record). Helpers that policies call live in the `private` schema, which the API doesn't serve; only functions the app calls with `rpc()` go in `public`. Archiving is a timestamp (`archived_at`), never a status. Tables: `profiles`, `partnerships`, `sharing_settings`, `conversations`, `messages`, `money_history_entries`, `goals`, `money_moves`, `money_move_logs`, `check_ins`, `measurements`, `money_dates`. Types are generated into `lib/types/database.ts`.
- **Production** (project `osxoklzwfotyacqbhcwb`) is moved onto this schema by the one-off runbook in `supabase/cutover/`. The cutover was completed on 2026-10-14.

```bash
npm run db:start   # local Supabase in Docker; applies every migration
npm run test:db    # pgTAP access-rule tests in supabase/tests/ — run after any schema or RLS change
npm run db:types   # regenerate lib/types/database.ts; CI fails if it's stale
```

Schema changes are new migration files with RLS in the same file, plus a test. Never edit a merged migration.

| Client | Use |
|---|---|
| `lib/supabase/server.ts` | Server components, actions, route handlers (user's session, RLS applies) |
| `lib/supabase/client.ts` | `"use client"` components |

There is no service-role client in the codebase. If one is ever needed, it's server-only and a last resort; see the `data-security` skill.

## Things Claude gets wrong

- `supabase db push` and `supabase db reset` are blocked by a hook, even for the local database. To re-apply migrations locally, run `npx supabase stop --no-backup` then `npm run db:start`. Production schema changes go through the Supabase connector instead (see below). The CLI reaches production over the IPv4 pooler once `npx supabase link --project-ref osxoklzwfotyacqbhcwb` has run while the project is healthy.
- An RLS check can't see a row inserted earlier in the *same statement*. Insert the parent (e.g. a check-in) first, then its children (measurements) in a second statement.
- The Supabase MCP connector may point at a *different* project. In this repo it's configured (local scope) for Stryvv production, `osxoklzwfotyacqbhcwb`; the user-level one points at another app (BarberCRM). Check `get_project_url` returns the `osxoklzwfotyacqbhcwb` URL before reading or changing anything.
- Since 2026-10-14 the connector has **write** access to production, so Claude can apply schema changes. Rules: only apply migrations that are merged to `main`, exactly as written in `supabase/migrations/` and in order; get Jordan's go-ahead in chat for each production change; never delete data or drop tables on production (that stays Jordan's step); verify read-only afterwards. Production's migration history must keep matching `supabase/migrations/`.
- Don't read or print `.env*` values. Check whether a var is set, never its value.
- Don't push to `main` or deploy with `vercel --prod`; open a PR (hooks enforce this).
