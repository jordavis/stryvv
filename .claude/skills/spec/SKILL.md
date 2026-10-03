---
name: spec
description: Produce spec.md (requirements + design) from an accepted intent.md (Stage 2 Design). Use when the user runs /spec or asks to spec out an intent.
argument-hint: <docs/work/folder>
disable-model-invocation: true
---

# Write a spec from an intent

1. Read `$ARGUMENTS/intent.md`. If it's not `accepted`, say so and stop.
2. Explore the code it touches (read-only) so the spec fits what exists: pages, server actions, tables, components.
3. Apply the project skills as constraints, always `data-security`. Check `CLAUDE.md` for conventions.
4. Write `$ARGUMENTS/spec.md` from `docs/templates/spec.md`. Requirements must be testable. Cover empty, loading and error states, and the "partner hasn't joined yet" state.
5. **Flag concerns** instead of quietly deciding them: contradictions between requirements and policy, data exposure across households, cost (OpenAI tokens), anything irreversible (schema, emails sent). Each flag says why it matters and gives a proposed resolution.
6. Answer the intent's open questions, or carry them forward explicitly.
7. Show the user the flagged concerns first. After they resolve them, commit: `git commit -m "spec: <name>"`.
8. Next step: plan mode, then save the approved plan as `$ARGUMENTS/plan.md`.
