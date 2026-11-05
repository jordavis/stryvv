# Intent: Voice answers in the onboarding chat

Author: Jordan Davis. Date: 2026-11-04. Status: accepted. Lane: careful (sends people's voice, which carries personal and financial details, to a new processor).
Links: [onboarding chat](../2026-10-16-onboarding-chat/intent.md) (PR jordavis/stryvv#10, which this builds on)

## Problem
The onboarding chat only takes typed answers. Its questions ask for stories ("What was money like in the home you grew up in?"), and on a phone people type less than they would say. Short typed answers give the coach less to reflect back and fewer, thinner review cards. Some people would rather talk than type at all.

## Proposed outcome
- **A microphone button in the chat's message box,** in both chat steps (money story and rich life) and in the "Anything to change or add…" box under the review cards.
- **Tap to start, tap to stop.** While recording, the box shows a timer and a way to cancel. A recording stops on its own at 5 minutes.
- **The words land in the message box, not straight in the chat.** After a short wait the transcript appears in the box, added to anything already typed, so the person can fix a misheard word or number before they tap send. Nothing reaches the coach until they send it.
- **The recording isn't kept.** It goes to the server, is transcribed, and is thrown away. It's never stored in Supabase or logged. Only the text the person chooses to send is saved, as today.
- **Server transcription** (decided 2026-11-04): the browser records the audio, and our server sends it to a speech-to-text service. It works the same on every browser, including iPhone home-screen apps.
- **If the microphone isn't allowed or isn't available,** the button explains how to turn it on, and typing still works.

We'll know it worked when:
- testers answer at least some questions by voice on a phone, and say it felt easier than typing;
- transcripts are accurate enough that people rarely edit them, including names, places and amounts ("six thousand dollars" or "$6,000");
- voice adds under $0.03 to a typical onboarding.

## Affected users and systems
- **Users:** testers going through onboarding (signup is still hidden).
- **UI:** `components/app/onboarding/chat-composer.tsx` gains the microphone button and recording state; `chat-step.tsx` wires it up.
- **New route:** `POST /api/onboarding/transcribe` (or a shared `/api/transcribe` the later "Ask Stryvv" chat can reuse): checks the user, takes the audio, returns text.
- **New processor:** a speech-to-text provider (see Open questions). Each person's voice is sent to it. The Privacy Policy, needed before signup opens, must name it and say what's sent and how long they keep it.
- **Env:** the provider's API key, server-only, in `.env.example`, the CI build placeholders and Vercel. (`OPENAI_API_KEY` already exists in all three, if we use OpenAI.)
- **Docs:** the `data-security` skill (rules 7 and 8 name the processors and keys), `CLAUDE.md`.

## Constraints
- **Treat voice as personal data.** Same rules as chat text: check who is signed in first, never log the audio or the transcript (IDs, durations, sizes and error codes only), and send the provider nothing but the audio itself.
- **Bound size and cost.** Cap the length and size of each recording, and how many transcriptions a person can make (per conversation and per minute), like the chat's message limits. Vercel limits request bodies to about 4.5 MB. Recording at a speech-quality bitrate (about 32 kbps) keeps 5 minutes near 1.2 MB; as a backstop, recording also stops early if a browser ignores the bitrate and the file nears the limit.
- **Speed.** The transcript should appear within a few seconds of stopping; show progress while it's working.
- **Mobile-first and accessible.** Large enough tap targets, a clear recording state that doesn't rely on colour alone, screen-reader labels, and light and dark themes.
- **Don't change the chat's contract.** The chat route still receives text only; voice is just another way to fill the message box.

## Out of scope
- The coach speaking its replies (text to speech).
- Live transcription, where words appear while you're still talking.
- Voice for the baseline taps.
- Keeping recordings, or playing them back.
- The "Ask Stryvv" chat on home (not built yet), though the route should be easy to reuse there.
- The real Privacy Policy itself (its own piece of work before launch); this only adds what it must say.

## Decisions (2026-11-04)
- Server transcription, not the browser's built-in speech recognition.
- **Provider: OpenAI,** through the AI SDK's `transcribe()` and `@ai-sdk/openai` (already installed, key already in place). Anthropic and OpenAI stay the only AI processors. The spec picks the model from OpenAI's own pricing and deprecation pages (some sources say the current transcription models retire in February 2027).
- **Up to 5 minutes per recording.**
- **Tap to start, tap to stop,** with a timer and a cancel button while recording.
- **The transcript always lands in the message box** for a check; it never sends itself.
- Its own branch and PR, built on the onboarding chat (PR jordavis/stryvv#10).

## Open questions
- None blocking. The spec settles the exact model, the per-person transcription limits, and the error states.
