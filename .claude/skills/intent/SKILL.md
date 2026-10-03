---
name: intent
description: Turn a raw idea, bug report or incident into a committed intent.md (Stage 1 Plan). Use when the user runs /intent or wants to capture, write up or log an idea for later.
argument-hint: <the idea, in plain words>
disable-model-invocation: true
---

# Capture an intent

1. Read the idea in `$ARGUMENTS`. If it's thin, ask the questions an analyst would, **at most 4, in one message**: who it's for, what they can't do today, what "better" looks like, what's out of scope, and any constraints (privacy, cost, household data). Skip anything the user already answered.
2. Pick the lane using the table in `docs/SDLC.md` (quick / feature / careful). Anything that touches auth, household data access, DB schema, money figures or AI prompts that see user data is **careful**.
3. Create `docs/work/<YYYY-MM-DD>-<kebab-slug>/intent.md` from `docs/templates/intent.md`. Write it in the user's terms, not implementation terms. Status: `draft`.
4. Show the user the file and ask them to correct anything you misunderstood.
5. Once they're happy, set Status to `accepted` (or leave it as `draft` if they're parking it) and commit it on its own: `git add <folder> && git commit -m "intent: <name>"`.
6. Tell them the next step: `/spec <folder>` for careful lane, or plan mode for feature lane.
