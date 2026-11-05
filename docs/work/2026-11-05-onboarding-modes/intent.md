# Intent: Choose how to do onboarding (voice, chat or form)

Author: Jordan Davis. Date: 2026-11-05. Status: draft (backlog). Lane: careful (a voice coach sends people's voice and personal details to a model provider).
Links: [onboarding chat](../2026-10-16-onboarding-chat/intent.md), [voice input](../2026-11-04-voice-input/intent.md)

## Problem
Onboarding has one way through: a chat with the coach (about 8 minutes), with typed or dictated answers. Some people would rather talk the whole way through. Others want a quick form and no conversation. One mode for everyone means some drop off or give thin answers.

G2's review flow is the reference: before starting, it offers Voice, Chat and Form side by side, each with an honest time estimate ("3–5 minutes"), and lets the person pick.

## Proposed outcome
- **A picker before step 1:** three options with a short description and a time estimate each. Chat is preselected (it's what's built).
  - **Voice:** talk with the coach, and it talks back.
  - **Chat:** today's onboarding (typing or dictating).
  - **Form:** the same questions as simple fields and taps, with no conversation.
- **All three produce the same records:** money-history entries, the baseline check-in, the vision and goals, and the same review cards before anything is saved. Home doesn't care which mode was used.
- **The baseline taps stay taps in every mode,** so the Stryvv Score is asked the same way for everyone.
- **People can switch mode** partway through without losing what they've saved.
- **We record which mode each person chose,** to see which ones people pick and finish.

We'll know it worked when more people finish onboarding, and the time estimates shown match what people actually take.

## Initial scoping (2026-11-05)

Estimates assume one developer working with Claude Code. Costs are model costs per completed onboarding, from OpenAI's and Anthropic's published prices on 2026-11-05. Audio token counts per minute are approximations, so treat the voice figures as ranges to measure, not quotes.

| Piece | What it takes | Time | Model cost per onboarding |
|---|---|---|---|
| **Mode picker** | One screen before step 1, a `profiles` column for the chosen mode, and a way to switch | 0.5–1 day | none |
| **Form mode** | Fields for each story topic that fill the same review cards, plus vision and goal fields; reuses the baseline and save actions | 2–3 days | $0 (optionally one short Claude call to tidy answers into cards: about $0.01) |
| **Voice, turn-based** (recommended first) | The coach stays on Claude. The person speaks; we transcribe (already built), Claude replies as today, and the reply is read aloud with text-to-speech; the microphone opens again for the next answer. Needs audio playback, auto-listen, and iPhone audio quirks handled | 3–5 days | about $0.12–0.15 |
| **Voice, real-time** (later, if wanted) | A live speech-to-speech conversation you can interrupt, over WebRTC. The coach would run on OpenAI's realtime model rather than Claude, with its own prompt, tools and safety review | 1.5–3 weeks | about $0.10–0.20 (`gpt-realtime-mini`) or $0.30–0.60 (`gpt-realtime`) |

How the voice costs break down, for an 8-minute onboarding with about 4 minutes of the person talking and 3 of the coach:
- **Turn-based:** transcription 4 min × $0.0045 = about $0.02; Claude as today, about $0.06 (measured); speech for the coach's replies with `gpt-4o-mini-tts` ($12 per 1M audio tokens) or `tts-1` ($15 per 1M characters), about $0.04–0.05.
- **Real-time:** `gpt-realtime-mini` is $10 / $20 per 1M audio input / output tokens; `gpt-realtime` is $32 / $64. Each turn also re-reads the conversation so far (cached audio input is $0.30–0.40 per 1M), so cost grows with length.

Time estimates to show people (to check against real sessions): Voice 5–7 minutes, Chat about 8, Form 5–7.

## Affected users and systems
- **Pages:** the onboarding sheet gains the picker and a form view per step; voice mode adds audio playback to the chat.
- **Data:** a mode column on `profiles` (or on the onboarding conversation); everything else reuses existing tables.
- **Providers:** turn-based voice adds OpenAI text-to-speech (the coach's words, not the person's) to OpenAI's existing role (transcription). Real-time voice would make OpenAI a second coach provider.

## Constraints
- Same review-before-saving rule in every mode: nothing is saved until the person confirms it.
- The Stryvv Score's wording is fixed; the baseline stays taps everywhere.
- The Privacy Policy must name every processor and say what each receives.
- Mobile-first: voice must work in iPhone Safari, which only plays audio after a tap and needs the microphone allowed each session.
- Cost stays within the onboarding budget ($0.10 per person today); a voice coach likely needs that budget raised to about $0.15–0.20.

## Out of scope (for now)
- Languages other than English (G2 offers a language choice; worth considering later).
- Voice for the "Ask Stryvv" chat on home.
- Real-time voice, until turn-based voice shows people want it.

## Open questions
- Which voice for the coach (OpenAI's built-in voices, or a custom one), and does it need to match a brand?
- Should Form mode still offer the coach's reflections at the end, or stay entirely conversation-free?
- Raise the onboarding cost budget for voice to about $0.15–0.20?
- Build order: picker + Form first (cheap, no new provider), or picker + turn-based Voice first?
