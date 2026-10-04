# Stryvv

Helps couples align on money: a values survey for each partner, a shared household, and an AI coach that knows both of you.

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · OpenAI (Vercel AI SDK) · Resend · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values; see comments in the file
npm run dev                  # http://localhost:3000
```

**The current app still runs on the old production schema** (`households`, `survey_responses` and so on), which is not in the repo. Until the pages are rebuilt on the new schema, `npm run dev` needs `.env.local` to point at a Supabase project that has those tables.

## Database

The new, individual-first schema lives in `supabase/migrations/`, with its access rules (RLS) and functions. It runs locally in Docker, so no hosted dev project is needed.

```bash
npm run db:start    # local Supabase (needs Docker, e.g. OrbStack); applies every migration
npm run test:db     # access-rule tests: who can and can't see what
npm run db:types    # regenerate lib/types/database.ts after a schema change
npm run db:stop
```

To change the schema:

1. Add a new file in `supabase/migrations/`. Never edit a migration that has merged.
2. Add or update a test in `supabase/tests/`.
3. Regenerate the types with `npm run db:types`.

To re-apply every migration from scratch, run `npx supabase stop --no-backup`, then `npm run db:start`.

Applying migrations to a hosted Supabase project is done by a person after review, never by an agent. The repo's guard hook blocks it.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Lint + typecheck + tests, the bar for "done" |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:db` | Database access-rule tests (needs `npm run db:start`) |
| `npm run build` | Production build |

## How we work

Read **[docs/SDLC.md](docs/SDLC.md)**. It's one page. The short version:

1. `/intent`: capture the idea as `docs/work/<date>-<slug>/intent.md`
2. `/spec`: requirements and design, for risky changes only
3. Plan mode → `plan.md` → implement
4. `npm run check` plus a visual check
5. `/ship` → PR → CI + review (`REVIEW.md`) → merge to `main` = production

Agent instructions live in `CLAUDE.md`; skills, hooks and the verifier agent live in `.claude/`.
