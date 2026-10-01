---
name: fix-bug
description: Fix a bug test-first. Use whenever the task is fixing a bug, regression or incorrect behavior, before touching the code that's wrong.
---

# Fix a bug, test first

1. **Reproduce as a test.** Write a Vitest test next to the code (`foo.ts` → `foo.test.ts`) that shows the bug. Prefer testing pure logic (`lib/`). If the bug lives in a component or server action, extract the logic into a function you can test.
2. **Run it and watch it fail** for the reason you expect: `npx vitest run <file>`. If it fails for a different reason, fix the test first.
3. **Commit the failing test on its own** (`test: reproduce <bug>`). This proves the bug existed before the fix.
4. **Fix the code. Do not edit the test** from step 3. If you think the test is wrong, stop and ask.
5. Run `npm run check` and paste the summary.
6. If Claude introduced the bug and it's the kind of mistake that could recur, add one line to `CLAUDE.md → Things Claude gets wrong`.

If the bug can't reasonably be unit tested (for example, pure layout), say so and verify it visually in the browser pane instead.
