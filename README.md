# Stryvv

Helps couples align on money: a values survey for each partner, a shared household, and an AI coach that knows both of you.

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · Supabase · OpenAI (Vercel AI SDK) · Resend · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values; see comments in the file
npm run dev                  # http://localhost:3000
```

The database schema isn't in the repo yet (see `docs/work/2026-10-01-db-schema-in-repo/`), so local dev needs to point at a Supabase project that already has the Stryvv tables.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Lint + typecheck + tests, the bar for "done" |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Production build |

## How we work

Read **[docs/SDLC.md](docs/SDLC.md)**. It's one page. The short version:

1. `/intent`: capture the idea as `docs/work/<date>-<slug>/intent.md`
2. `/spec`: requirements and design, for risky changes only
3. Plan mode → `plan.md` → implement
4. `npm run check` plus a visual check
5. `/ship` → PR → CI + review (`REVIEW.md`) → merge to `main` = production

Agent instructions live in `CLAUDE.md`; skills, hooks and the verifier agent live in `.claude/`.
