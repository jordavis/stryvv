---
name: ship
description: Verify, commit, push a branch and open a PR, then get it green (Stage 5 Deploy). Use when the user runs /ship or says the work is ready for a PR.
argument-hint: [optional PR title]
disable-model-invocation: true
---

# Ship the current work as a PR

1. **Branch.** If on `main`, create a branch: `feat/…`, `fix/…` or `chore/…`. Never push to `main`.
2. **Verify.** Run `npm run check`. If anything fails, fix the code (not the tests) and rerun. For UI changes, confirm the page in the browser pane, or run the `verifier` agent if the change spans several flows.
3. **Plan sync.** If a `docs/work/*/plan.md` covers this change and the implementation departed from it, update `plan.md` now.
4. **Commit** with a clear message: what changed and why. Never stage `.env*` files.
5. **Push** and open the PR with `gh pr create`, filling in `.github/pull_request_template.md`: link the work folder, paste the `npm run check` summary, and tick the risk boxes honestly.
6. **Get it green.** Watch CI (`gh pr checks --watch`). If a check fails, read the log, fix, push. Repeat until green or you're stuck, then report.
7. **Review.** Suggest `/code-review` for feature lane, and `/code-review high` for careful lane. Address Important findings before merge.
8. Report the PR link. **Do not merge**: merging deploys production, so the user decides.
