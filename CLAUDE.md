# Stryvv

Next.js 16 App Router app that helps couples align on money. TypeScript, Tailwind v4, shadcn/ui, Supabase (auth + Postgres), Vercel AI SDK (OpenAI), Resend. Deployed on Vercel; merging to `main` deploys production.

## Commands

```bash
npm run dev        # dev server on localhost:3000 (needs .env.local, see .env.example)
npm run check      # lint + typecheck + unit tests — run before saying a task is done
npm run test       # vitest only ("Tests  N passed")
npm run build      # production build
```

## Verifying your work

- Run `npm run check` before reporting any task complete, and paste the summary lines.
- Lint warnings about `react-hooks/incompatible-library` (react-hook-form `watch()`) are known; errors are not OK.
- For UI changes, open the page in the browser pane and look at it (use the `verifier` agent for anything non-trivial).
- If a test fails, fix the code, not the test. Never delete or skip a failing test.
- For a bug fix, write the failing test first (see the `fix-bug` skill).

## How work flows

See `docs/SDLC.md`. In short: small fixes go straight to a branch + PR. Features get `docs/work/<date>-<slug>/intent.md` → (`spec.md` if risky) → `plan.md` from plan mode, committed with the code. When the implementation departs from `plan.md`, update it in the same commit.

## Architecture

- Flow: `/` → signup/login → `/survey/[step]` (6 steps) → `/onboarding` (create or join household) → `/dashboard` (chat coach, snapshot, money history, goals).
- Partner joins via `/invite/[code]`.
- `proxy.ts` is the Next.js middleware: refreshes Supabase session, protects routes. Public routes are listed there.
- Server actions in `lib/actions/`; API routes in `app/api/` (`chat`, `money-history`).
- Survey state: `lib/context/survey-context.tsx` (`useReducer` + localStorage `stryvv_survey`); Zod schemas in `lib/validations/survey.ts`.
- Components: `components/ui/` (shadcn, New York/stone), `landing/`, `survey/`, `onboarding/`, `dashboard/`, `snapshot/`.
- Tailwind v4 via `@tailwindcss/postcss` (no tailwind.config). `cn()` in `lib/utils.ts`. Brand dark blue `#0b2545`. Path alias `@/*` = repo root.

## Data

Two schemas exist while the app is rebuilt (see `docs/product-vision.md`):

- **New, individual-first schema: `supabase/migrations/`.** Every record belongs to a person (`owner_id`). Partners link through `partnerships`; what a partner can read is decided per category by `can_view()` in RLS. Tables: `profiles`, `partnerships`, `sharing_settings`, `conversations`, `messages`, `money_history_entries`, `goals`, `money_moves`, `money_move_logs`, `check_ins`, `measurements`, `money_dates`. Types are generated into `lib/types/database.ts`. Build all new features on this.
- **Old production schema, used by the current pages, not in the repo:** `profiles` (→ `household_id`), `households`, `survey_responses`, `money_histories`, `snapshots`, `chat_messages`, scoped by household. Don't guess at its columns: check the code that already queries a table, or ask. Don't extend it.

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
| `lib/supabase/admin.ts` | Service role, bypasses RLS. Server-only, last resort — see `data-security` skill |

## Things Claude gets wrong

- `supabase db push` and `supabase db reset` are blocked by a hook, even for the local database. To re-apply migrations locally, run `npx supabase stop --no-backup` then `npm run db:start`. Pushing to a hosted project is the user's step.
- An RLS check can't see a row inserted earlier in the *same statement*. Insert the parent (e.g. a check-in) first, then its children (measurements) in a second statement.
- The Supabase MCP connector may point at a *different* project. Confirm the project URL matches `.env.local` before reading or changing the database.
- Don't read or print `.env*` values. Check whether a var is set, never its value.
- Don't push to `main` or deploy with `vercel --prod`; open a PR (hooks enforce this).
