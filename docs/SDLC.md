# How we build Stryvv

A lightweight version of the AI-native SDLC: every stage leaves a file in git that the next stage reads. Built for one person moving fast, with the structure already in place for a team.

```
idea ──► intent.md ──► spec.md ──► plan.md ──► code + tests ──► PR (review) ──► main (deploy)
          (Plan)       (Design,     (Build,     (Build/Test)     (Deploy)          │
                        risky only)  plan mode)                                     ▼
                         ▲                                                 lessons / new intent
                         └──────────────────────── (Maintain) ◄────────────────────┘
```

## Pick a lane

Use the lightest lane that fits. When in doubt, go one lane heavier.

| Lane | When | Artifacts | Example |
|---|---|---|---|
| **Quick** | Copy, styling, small bug, dependency bump; < ~1 hour | Branch + PR. Bug fixes still get a failing test first. | Fix a typo on the landing page |
| **Feature** | New behavior a user can see | `intent.md` → `plan.md` → PR | Add a goals page |
| **Careful** | Touches auth, household data access, DB schema, money figures, AI prompts that see user data, payments | `intent.md` → `spec.md` → `plan.md` → PR, plus `data-security` skill | Let partners see each other's survey answers |

Artifacts live together, one folder per change:

```
docs/work/2026-10-01-goals-page/
  intent.md   what and why          (/intent)
  spec.md     requirements + design (/spec, careful lane)
  plan.md     files, order, risks, proof (plan mode)
```

Templates are in `docs/templates/`.

## The stages

**1. Plan: capture intent.** Run `/intent` and describe the idea in plain words. Claude asks the questions an analyst would, then writes `intent.md`. You correct it and commit it. Ideas that aren't ready can sit as `Status: draft`, which makes the folder your backlog.

**2. Design: spec (careful lane).** Run `/spec docs/work/<folder>`. Claude writes `spec.md` from the intent, applying the project skills (`data-security` today; add brand/UX skills as they emerge) and **flagging concerns**. Resolve the flags before building.

**3. Build: plan mode, then implement.**
- Start Claude Code in plan mode (Shift+Tab) and point it at the folder. Push back on the plan: what could break, the riskiest step, the alternatives it rejected.
- When it's good enough that someone else could build from it, save it as `plan.md` and let Claude implement, in auto mode for routine work.
- Run independent tasks in parallel with `claude --worktree <name>`. Start with 2–3 sessions; add more only while you can keep up with review.

**4. Test: Claude checks its own work.** `npm run check` must pass before anything is "done". UI changes get a visual check in the browser pane or via the `verifier` agent. For bugs, commit the failing test before the fix.

**5. Deploy: review, then merge.** Run `/ship`. It runs the checks, commits, opens a PR with the template filled in, and waits for CI. Review it with `/code-review`, or `@claude` on the PR once the GitHub app is set up. Reviews follow `REVIEW.md`. Merging to `main` deploys to production through Vercel. Merging is the human gate.

**6. Maintain: close the loop.** When something breaks in production, fix it through the Quick lane with a regression test, and add a line to `CLAUDE.md → Things Claude gets wrong` if Claude caused it. If the same mistake shows up twice, write it down.

## Guardrails (in `.claude/`)

| Control | Type | What it does |
|---|---|---|
| `settings.json` permissions | Allow/deny | Pre-approves the safe inner loop (`npm run check`, git read commands); denies reading `.env*` |
| `hooks/guard-bash.mjs` | Hook (blocks) | No pushing to `main`, no force push, no `vercel --prod`, no `supabase db reset/push` |
| `hooks/protect-files.mjs` | Hook (blocks) | No edits to `.env*` or `package-lock.json` by hand |
| `hooks/lint-on-edit.mjs` | Hook (reports) | ESLint on each edited TS file, so problems surface immediately |
| `skills/data-security` | Skill (advisory) | Household isolation, RLS, service-role rules, PII in logs and prompts |
| `agents/verifier.md` | Subagent | Fresh-context check that the change works in the running app |
| `REVIEW.md` | Review policy | What PR review looks for and what counts as Important |
| `.github/workflows/ci.yml` | CI gate | lint, typecheck, test, build on every PR |

Skills are advisory and hooks are deterministic. If a rule must never be broken, back it with a hook or a CI check.

## When the team grows

These are deliberately **not** set up yet. Add them when there's a reason to:

- **Branch protection on `main`**: require the CI check to pass. Add "require 1 approval" once there's a second person; GitHub won't let you approve your own PR.
- **CODEOWNERS** (already present) starts mattering once approvals are required.
- **Claude GitHub app** (`/install-github-app`) for automatic PR review and `@claude` fixes in PR threads.
- **Agent evals** in CI (`evals/`): once `CLAUDE.md` and skills change often enough that regressions are a risk. Collect 20–50 real past tasks first.
- **Production monitoring loop**: once there's real traffic, alert on error-rate spikes and have Claude write the diagnosis as an `intent.md`.
- **Issue tracker**: if you adopt Linear or GitHub Issues, keep the repo as the source of truth and link the issue ID in `intent.md`.
