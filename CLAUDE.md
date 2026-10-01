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

Supabase tables: `profiles` (→ `household_id`), `households` (`invite_code`, 6-char uppercase), `survey_responses`, `money_histories`, `snapshots`, `chat_messages`. Everything a user sees is scoped to their household.

| Client | Use |
|---|---|
| `lib/supabase/server.ts` | Server components, actions, route handlers (user's session, RLS applies) |
| `lib/supabase/client.ts` | `"use client"` components |
| `lib/supabase/admin.ts` | Service role, bypasses RLS. Server-only, last resort — see `data-security` skill |

The schema is **not yet in the repo** (no migrations). Don't guess at columns — check the code that already queries a table, or ask.

## Things Claude gets wrong

- The Supabase MCP connector may point at a *different* project. Confirm the project URL matches `.env.local` before reading or changing the database.
- Don't read or print `.env*` values. Check whether a var is set, never its value.
- Don't push to `main` or deploy with `vercel --prod`; open a PR (hooks enforce this).
