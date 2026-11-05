# Spec: Onboarding chat

From: intent.md (2026-10-16). Status: draft.

## Requirements

**Getting there**
1. After verifying their email or signing in, a person lands on `/home`. `/welcome` redirects to `/home`, so old links still work. `/home` is a signed-in page: someone who isn't signed in goes to `/login`.
2. If the person's onboarding isn't finished, `/home` opens the onboarding sheet over the home screen straight away. Once it's finished, the sheet doesn't open again.

**Shape of the chat**
3. Onboarding has three steps, in this order, shown as "Step n of 3" with a progress bar:
   1. **Your money story** (chat), covering four topics in order: growing up with money; how money felt and the rules you picked up; what you carry today (patterns and beliefs now); a money win you're proud of.
   2. **Where you are today** (the baseline: tap to answer, no typing).
   3. **Your rich life** (chat): what a rich life looks like for you, and a first goal.
4. The header shows the step, the current topic with its count (for example "Money history · 1/4"), and "Skip for now".
5. The first coach message of each topic includes a short example answer, so people know how much to say.
6. Under the message box, a one-tap shortcut ("Nothing comes to mind" in step 1, "Not right now" in step 3) sends that answer and moves on. A topic answered "nothing" is recorded as answered, not as skipped.
7. Where the coach offers answer chips (such as how money felt), the person can tap any number of them, type instead, or both.
8. The coach asks one short question at a time, follows up at most twice per topic, and never gives financial advice: it doesn't recommend products, investments or specific money decisions. If asked, it says that's not what this chat is for, and carries on.

**Review before saving**
9. At the end of step 1, the coach shows a "Check these before we save them" card for each thing it heard (a memory, belief, pattern or win), with a title, a one-line description and attribute chips. Each card can be edited, have a note added, or be removed.
10. The sticky button names what it will save ("Save 3 entries & continue"). Only then are the entries written. Under it, a message box takes corrections in plain words ("the car was paid off in 2023, not 2024"), and the coach updates the cards.
11. Step 3 ends the same way, with a card for the rich-life vision and one for each goal (title, why, and an amount and date only if the person gave them). Saving writes the goals.
12. Nothing from steps 1 and 3 is written to `money_history_entries` or `goals` before the person presses save.

**Baseline (step 2)**
13. The baseline is the Stryvv Score, Stryvv's own measure, defined in [measurement-framework.md → The Stryvv Score](../../measurement-framework.md#the-stryvv-score). It first asks "Are you married or in a relationship?" (Yes / No), then items 1–6 (Security, Satisfaction, Alignment) in the order and wording listed there, and for a yes the two Unity items too. They're about how the person sees their partner, so they work before the partner joins.
14. Each item is a coach-style bubble with five labelled tap answers. There's no typing, and the coach model isn't involved: the wording is fixed in code.
15. The answers are saved together, all or nothing, when the last item is answered. The result is exactly one baseline check-in with eleven measurements, or fourteen for someone in a relationship: the six (or eight) answers (metric names as in the framework, each 0–4), the part scores (`score_security`, `score_satisfaction`, `score_alignment`, and `score_unity` for a yes, each 0–100), `stryvv_score` (0–100) and `stryvv_score_version` (`1`). The scores are computed on the server, which also records the answer in `profiles.in_relationship`.
16. If saving fails, nothing is written and the person can try again. A second baseline can never be created.
17. "Skip for now" on step 2 saves nothing. Home then shows "Take your baseline" in the scores card, which reopens step 2.

**Leaving and coming back**
18. Each person has one onboarding conversation. Every message, theirs and the coach's, is saved as it's sent.
19. Closing the app at any point and signing back in reopens the sheet at the same step and topic, with the conversation so far, and any unsaved review cards proposed again.
20. "Skip for now" on step 1 or 3 moves to the next step. Skipping the last step, or saving it, finishes onboarding.

**Home shell**
21. Home shows a greeting with the person's first name ("Welcome to Stryvv, Johnny"), the "Ask Stryvv about your finances" bar, and these cards:
    - **What you're working toward:** the saved goals. If there are none, an empty state with "Set a goal with Stryvv", which reopens step 3.
    - **Your money story:** the saved money-history entries (titles and kinds). If there are none, an empty state that reopens step 1.
    - **Your scores:** the Stryvv Score as a ring, labelled "Your starting point", with a smaller ring for each part (Security, Satisfaction, Alignment, and Unity for someone in a relationship). If there's no baseline, "Take your baseline".
    - **Money Moves:** an empty state only ("You'll pick your first one after setting a goal").
22. The ask bar is visible but not wired up yet. Tapping it shows "Ask Stryvv is coming soon".
23. Home has a sign-out control.
24. The coach-mark tour, the tab bar, Connect your accounts, Learning and Upload documents are not built in this release.

**Limits**
25. A message is 1–5,000 characters (raised from 2,000 by the voice-input work, so a full 5-minute spoken answer fits). The server refuses more than 60 user messages in one onboarding conversation and more than 20 messages a minute from one person, with a friendly "Let's pause for a moment" message.
26. Each coach reply is capped at 400 output tokens. The whole onboarding must cost under $0.10 in model usage per person on the measured test runs (see Proof in plan.md).

## User experience

Mockups: the "Money history chat", "Review before saving" and "Home, first visit" boards on the [Stryvv Core Screens](https://claude.ai/artifact/59SH5WnEdcQxGio7RjQ7ME) canvas, built with the [Stryvv Design System](https://claude.ai/artifact/3YN9n22vGGKBZ3q1eZxVHj) components (StepHeader, ChatBubble, ChipGroup, ChatComposer, ReviewCard, Button, AskBar, ModuleCard, ScoreRing). New components go in `components/app/` and use the `.stryvv-app` tokens, in light and dark.

| Screen | Empty | Working | Error | Done |
|---|---|---|---|---|
| Onboarding sheet, chat steps | The coach's first message for the topic, with an example answer; message box focused | The person's bubble appears at once; the coach's reply streams in word by word; send is disabled while it streams | "Something went wrong. Your message is saved; tap to try again." The message box keeps the text | Review cards appear |
| Review cards | n/a (if nothing was heard, the coach says so and the step moves on without cards) | "Saving…" on the button | "Couldn't save. Try again." The cards stay as edited | The next step starts |
| Baseline | First item shown | The chosen answer highlights, then the next item slides in; "Saving…" after the last | "Couldn't save your answers. Try again." The answers are kept on screen | Step 3 starts |
| Home | Cards in their empty states | Skeleton cards while loading | "Couldn't load this. Pull to refresh." on the card that failed | Cards with the person's goals, entries and score |

- **Phone first.** The sheet fills the screen below a 40px gap that shows home behind it. The message box stays above the keyboard. On desktop, the sheet is a centred panel up to 560px wide.
- **Partner not joined:** nobody can be partnered yet (invites aren't built), so there's no partner state. Everything saved here follows the person's sharing settings when a partner joins later.

## Data and API changes

**Schema change: one new migration.**
- `public.record_baseline(answers jsonb)`, a security definer function that checks `auth.uid()`, validates the answers (the six, or the six plus both Unity answers; each 0–4, none missing, no others), computes the part scores and the Stryvv Score with the version 1 formula, and inserts the check-in and its measurements in one transaction. It raises a clear error if a baseline already exists. `EXECUTE` goes to `authenticated` only. Lookup helpers, if any, live in `private`.
- A check constraint on `profiles.onboarding_stage`, allowing `not_started`, `money_story`, `baseline`, `rich_life` and `done`. Existing rows are `not_started`.
- One onboarding conversation per person: a unique partial index on `conversations (owner_id) where kind = 'onboarding'`.
- Narrow the `conversations` update grant to `topic`, so `kind` can't be changed after creation.
- pgTAP tests for each: the baseline is all-or-nothing and can't be repeated; out-of-range or missing answers are rejected; known answers give the expected part scores and total (best, worst and a mixed case); a stranger can't call the function for someone else (it only ever writes the caller's own rows); the stage values are enforced; a second onboarding conversation is refused.

**Uses existing tables:** `conversations` (kind `onboarding`), `messages`, `money_history_entries`, `goals`, `check_ins`, `measurements` and `profiles`. One new column: `profiles.rich_life_vision` (see Changes while building).

**App**
- `POST /api/onboarding/chat`: a route handler that streams the coach's reply with the Vercel AI SDK (`streamText`, `@ai-sdk/anthropic`, model `claude-sonnet-5-5`). The request carries only the new message text and the conversation id. The server checks the user, loads the history from the database, saves the user's message before calling the model, and saves the reply when it finishes.
- The coach proposes review cards through tool calls (`propose_money_history`, `propose_goals`). The server validates their output with Zod (sizes, kinds) before the client shows it. The proposals are not saved to the database; they're re-proposed on resume.
- Server actions in `lib/actions/onboarding.ts`: `saveMoneyHistory`, `saveGoals`, `saveBaseline` (calls `record_baseline`), `skipStep` and `startOnboarding`. Each one advances `onboarding_stage`.
- `lib/onboarding/`: the step and topic definitions, the coach's system prompt, the baseline item wording and the Stryvv Score formula (as a tested TypeScript copy, so the UI can show the score straight away; the database value is the one that counts). The Vitest and pgTAP tests use the same cases (answers in, expected scores out), so the two copies can't drift apart unnoticed.
- `lib/supabase/proxy.ts`: add `/home` to the signed-in pages and change the signed-in home from `/welcome` to `/home`. `lib/actions/auth.ts` redirects to `/home`.
- Packages: add `@ai-sdk/anthropic` and `@ai-sdk/react`.
- Environment: `ANTHROPIC_API_KEY`, server-only, added to `.env.example`, the CI build placeholders, Vercel (Production and Preview) and `.env.local`.

## Security and privacy

- **What reaches Anthropic:** the coach's system prompt, the person's first name, and this onboarding conversation's messages. No last name, email, phone, ids, or anyone else's data. The baseline answers are never sent to the model.
- **Who can read what:** messages are owner-only and never shared (unchanged). Saved entries, goals and scores follow `partner_sharing` per category, which is what the person agreed to when sharing is set up. Nothing in onboarding reads a partner's data.
- **Writes go through the person's session** (RLS applies). No service-role client. `record_baseline` writes only rows for `auth.uid()`.
- **Model output is untrusted:** chat text is rendered with `lib/markdown.ts`. Tool output is validated with Zod and shown as plain text on the cards. The person confirms before anything is saved.
- **Prompt injection:** the coach has no tools that write data or read other data. The worst a manipulated coach can do is say something odd or propose odd cards, which the person sees before saving.
- **Logging:** ids, error codes and token counts only. Never message content, entries, goals or answers (data-security rule 6).
- **Limits** (requirement 25) bound cost per person, and only signed-in people can reach the route.
- **Docs:** rules 7 and 8 of the data-security skill, `CLAUDE.md` and `REVIEW.md` change from OpenAI to Anthropic.

## Production setup (Jordan, in dashboards)

| Where | Setting |
|---|---|
| Anthropic Console | Create an API key for Stryvv production. Set a monthly spend limit (suggested $50 while testers only) |
| Vercel | Add `ANTHROPIC_API_KEY` to Production and Preview |
| Supabase | Apply the new migration after merge (SQL editor, as for the hardening migration), then I verify read-only |

## Concerns flagged

- **Our own score instead of the CFPB score** (decided 2026-11-04). The CFPB score needed age, which we don't collect, and only measures well-being. The Stryvv Score measures what Stryvv works on: Security, Satisfaction, Alignment and, for couples, Unity, each counting equally. It borrows two CFPB items word for word. → The trade-off: no national benchmarks, and the score isn't validated. We keep every raw answer and store `stryvv_score_version`, so the formula can be revised later and old scores recomputed. Before making claims from it ("Stryvv users improve 12 points"), check it against real answers (see the framework's open questions).
- **The baseline can't be written in two statements safely.** A check-in followed by a failed measurements insert would leave an empty baseline that blocks the real one forever, because check-ins can't be deleted. → A single database function (`record_baseline`) does it in one transaction. This is a schema change, with tests.
- **Order of steps.** The mockup shows the money story as step 1 of 3. Taking the baseline *before* the rich-life chat measures where the person started (for example, whether their spending reflects what matters to them), not where five minutes of coaching got them. → Proposed order: money story, baseline, rich life (requirement 3).
- **Anthropic is a new processor of sensitive personal data.** → Fine for testers who know they're testing. The real Privacy Policy, needed before signup opens (out of scope here), must name Anthropic and say what's sent. Anthropic's API doesn't train on this data by default; the policy should say so.
- **Transcripts can't be deleted by the person** (decided 2026-10-03), and onboarding transcripts are personal. → Unchanged for now; deleting the account removes them. Worth revisiting before public launch.
- **The coach may mis-summarise.** → Review cards (requirements 9–12) are the guard: nothing is saved without the person seeing it.
- **Unbounded model spend** (REVIEW.md treats this as Important). → Per-conversation and per-minute caps, a 400-token reply cap, prompt caching for the system prompt, and the Anthropic spend limit.
- **A visible but unwired ask bar** could feel broken. → It says "Ask Stryvv is coming soon" when tapped (requirement 22). Decided 2026-11-04: show it, since it shows where the product is going.
- **`onboarding_stage` stays writable by the person.** → Acceptable: it only controls their own flow, and the new check constraint keeps the values valid.

## Answers to intent's open questions

- **How much structure should the chat have?** → A fixed sequence of steps and topics (requirement 3), conversational within each topic, with at most two follow-ups (requirement 8). The server, not the model, decides which step comes next.
- **Should the person see and edit what Stryvv heard before it's saved?** → Yes. Review cards before saving, as in the "Review before saving" mockup (requirements 9–12).
- **Which Claude model?** → `claude-sonnet-5-5` for the coach: strong at warm, careful conversation and reliable tool calls, at a moderate cost. The plan measures the cost per onboarding against the $0.10 budget (requirement 26) and falls back to `claude-haiku-5-5` if it runs over.

## Changes while building (2026-11-04)

- **The rich-life vision has a home.** Requirement 11 shows a vision card, but no table held it. It's saved in a new column, `profiles.rich_life_vision` (up to 2,000 characters, private to the person, editable by them), and shown at the top of "What you're working toward".
- **Draft cards travel with corrections.** A typed correction at the review sends the person's edited cards with it, so the coach updates their edits instead of starting over. The request still never carries history or ids beyond the conversation.
- **Answer chips are fixed per topic in code** (`lib/onboarding/steps.ts`), not generated by the model: cheaper, and the same every time.
- **The server moves topics on.** After three answers or the shortcut, the server advances and tells the coach the next question; before that the coach may move on early with a `next_topic` tool. The pointer is saved only by the server. (The model doesn't accept forced tool calls.)
- **Review cards come back as structured output** (a closed JSON schema) and reach the screen as data, not as tool calls.
- **Requirement 26's 400-token cap** applies to what the person reads. The model always thinks and its thinking counts toward the API's cap, so the API cap is 1,200 per reply and 4,000 for review cards, at low effort.
- **History can't be backdated.** Insert grants on `conversations` (`kind`, `topic`) and `messages` (`conversation_id`, `role`, `content`) are narrowed too, as `check_ins` already were.
- **No prompt caching.** The system prompt changes per topic and is under Anthropic's minimum cacheable size, so caching wouldn't apply. Cost is kept down instead by sending only the current step's messages.
- **Unity before a partner joins** (decided 2026-11-04, after testing showed no Unity ring). The baseline asks "Are you married or in a relationship?" first; a yes adds the two Unity items, a fourth ring, and `profiles.in_relationship`. Singles keep three parts.
