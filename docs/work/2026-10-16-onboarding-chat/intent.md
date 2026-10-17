# Intent: Onboarding chat

Author: Jordan Davis. Date: 2026-10-16. Status: accepted. Lane: careful.
Links: [product-vision.md](../../product-vision.md), [measurement-framework.md](../../measurement-framework.md), [design-references.md](../../design-references.md), [signup](../2026-10-14-signup-email-code/intent.md)

## Problem
People can now create an account at `app.stryvv.com/signup`, but after they verify their email they land on a placeholder ("Your money story starts here soon") and there is nothing to do. The product starts with the onboarding chat: it's where someone tells Stryvv their money story and what they want from life, and where we take the "before" measurement that every later score is compared with. Until it exists:
- signup can't be opened to the public, because there is no product behind it;
- we have no baseline, so we could never show anyone that Stryvv helped;
- the home screen has nothing to show, because nothing about the person is known yet.

## Proposed outcome
- **After verifying their email, a person goes straight into one short, friendly chat** with Stryvv's coach. It sits in a sheet over their home screen, as in the Stryvv Core Screens mockups, so they can see where they'll end up.
- **The chat covers three things, in about 8 minutes in total:**
  1. **Money history:** how they grew up with money and the story they tell themselves about it.
  2. **Rich-life vision:** what they want from life, focused on what money can affect.
  3. **Baseline:** the onboarding measures from the measurement framework: the CFPB 5-item well-being scale, money stress, money satisfaction and vision clarity. Simple scale answers use quick tap-to-answer replies, not typing ("chat over forms", but no typing numbers).
- **What they share is saved as their own records**, not just as a transcript: money-history entries, goals, and one baseline check-in with its measurements. Partners only ever see what sharing settings allow; the transcript itself is never shared.
- **They can leave and come back.** Closing the app mid-chat resumes where they left off.
- **When the chat ends, they land on a minimal home screen:** the "Ask Stryvv about your finances" bar at the top and the module cards from the vision, mostly empty for now, with what the chat captured shown where it fits (for example their goals under "What you're working toward"). Filling the modules properly is later work.
- **The coach runs on Claude** (Anthropic) through the Vercel AI SDK the repo already uses.
- **Signup stays hidden.** Testers use `/signup` directly; the landing page keeps pointing to coming soon.

We'll know it worked when:
- a tester can go from signup to home in one sitting, on a phone, in roughly 8 minutes, without being confused about what to do next;
- after the chat, the database holds their money-history entries, at least one goal, and exactly one baseline check-in with the four measures, all owned by them;
- closing the tab halfway and signing back in picks up the chat where it stopped;
- testers say it felt like a conversation, not a form.

## Affected users and systems
- **Users:** signed-up testers only (signup isn't linked from the landing page).
- **Pages:** `/welcome` is replaced by the home shell with the onboarding sheet. The signed-in routes in `lib/supabase/proxy.ts` change to match.
- **Tables (all exist already):** `conversations` and `messages` (kind `onboarding`), `money_history_entries`, `goals`, `check_ins` (kind `baseline`) and `measurements`, and `profiles.onboarding_stage`. A schema change is possible if the spec finds a gap.
- **New:** a chat API route or server action that streams the coach's replies.
- **Anthropic:** new. Each user's answers are sent to the model. Needs an `ANTHROPIC_API_KEY` in Vercel and locally.
- **OpenAI:** no longer planned. The installed `openai` packages can be removed in a later cleanup.

## Constraints
- **The prompts see personal data** (money history, feelings, finances). Apply the `data-security` skill: send the model only what this conversation needs, never another person's data, and log no message content.
- **Model output is shown safely:** render it with `lib/markdown.ts`, which escapes HTML first.
- **The baseline is taken once.** The schema allows one baseline per person, ever, and measurements are append-only. The chat must not write a half-finished baseline that blocks a proper one later.
- **The questionnaire wording is fixed.** The CFPB items must be asked as published, or the 0–100 score and its benchmarks don't apply. The coach can introduce them conversationally but mustn't reword them.
- **Mobile-first, light and dark,** using the Stryvv Design System tokens in `components/app/`.
- **Cost:** the whole onboarding should stay a few cents per person. The spec sets a token budget and caps the chat's length.
- **Not financial advice.** The coach listens, reflects and asks; it doesn't recommend investments or products.

## Out of scope
- The full home screen modules (money data, behaviors, learning, scores) beyond empty cards and what the chat captured.
- The ongoing "Ask Stryvv" coach chat on the home screen (the bar can be there, but not wired up yet).
- Partner invites and the couple layer.
- The self-efficacy and literacy measures, which the framework spreads over the first week.
- Opening signup from the landing page, real Terms and Privacy pages, rewriting the landing copy, and fixing Gmail spam for `support@stryvv.com`. These come before a public launch, each as its own small piece of work.
- Removing the unused OpenAI packages.

## Decisions (2026-10-16)
- V1 covers all three: money history, rich-life vision and the baseline (about 8 minutes).
- The coach runs on Claude via the Vercel AI SDK, not OpenAI.
- The chat ends on a minimal home shell built as part of this work.
- Signup stays hidden when this ships; testers first.

## Open questions
- How much structure should the chat have? A fixed sequence of topics the coach moves through, or an open conversation the coach steers until it has what it needs? (Leaning: fixed sequence, conversational within each topic; the spec decides.)
- Should the person see and edit what Stryvv "heard" (for example a summary card of their money story) before it's saved?
- Which Claude model for the coach, against cost and speed? (The spec picks, with a measured cost per onboarding.)
