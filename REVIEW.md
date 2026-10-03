# Review instructions

Used by `/code-review` and by Claude on GitHub PRs. The human reviewer focuses on intent and risk. This pass catches the rest.

## Passes

Run three passes and tag each finding with its pass:

- **Bugs**: logic errors, unhandled empty/loading/error states, broken edge cases (partner not joined, survey partly done), race conditions in server actions, stale UI.
- **Security**: apply the `data-security` skill rules 1–9. Anything that could expose one household's data to another, or put secrets or PII where they don't belong, is always Important.
- **Compliance**: if the PR links a `docs/work/` folder, does the diff do what `plan.md` says (and `spec.md`, if present)? Flag drift. Also flag a bug fix PR that edits an existing test, and a change that makes `CLAUDE.md` outdated.

## What Important means here

Important = would break user-visible behavior, leak data across households, expose a secret, corrupt or lose data, or burn money (unbounded OpenAI calls, email loops). Everything else is a nit.

## Cap the nits

Report at most 5 nits; summarize the rest as a count. Don't report style that ESLint already enforces.

## Do not report

- `components/ui/*` (shadcn-generated) unless the change breaks behavior
- `package-lock.json`, `next-env.d.ts`
- Known lint warnings: `react-hooks/incompatible-library` from react-hook-form `watch()`

## Feedback loop

If the same kind of finding appears in two PRs, propose a one-line addition to `CLAUDE.md → Things Claude gets wrong` as part of the review.
