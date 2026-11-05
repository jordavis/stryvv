# Plan: Voice answers in the onboarding chat

From: intent.md and spec.md (2026-11-04). Approved: Jordan Davis, 2026-11-04.

## Context

The onboarding chat (PR jordavis/stryvv#10) only takes typed answers, and its story questions get thin answers on a phone. This adds a microphone to the chat's message box: the browser records (tap to start, Stop or Cancel, up to 5 minutes), our server transcribes with OpenAI `gpt-transcribe`, and the text lands in the message box for the person to check before sending. No audio is kept. Limits (4 MB, 5 a minute, 60 a day) are counted in a small new table. This file is saved as `docs/work/2026-11-04-voice-input/plan.md` as the first step of the build.

## Files that change

**Database (one migration)**
- `supabase/migrations/20261105000100_transcription_requests.sql` (new):
  - `public.transcription_requests` with `id`, `owner_id` (default `auth.uid()`, cascade), `bytes` (integer, 1–4,194,304) and `created_at` (default now). Index on `(owner_id, created_at desc)`.
  - RLS: the owner can read and insert. Grants: `revoke all` from anon; revoke insert/update/delete from authenticated; `grant insert (bytes)`, `grant select`. No update or delete.
- `supabase/tests/11_transcription_requests.sql` (new, written first):
  - a stranger reads nothing
  - `owner_id` and `created_at` can't be set
  - no update or delete
  - `bytes` of 0 or more than 4,194,304 is refused
  - the owner can insert and read their own row
- `lib/types/database.ts` (regenerated).

**Logic (`lib/voice/`, pure and tested)**
- `recording.ts` + test:
  - `pickRecordingType(isSupported)` prefers `audio/webm;codecs=opus`, then `audio/mp4`, else null.
  - Constants: `MAX_SECONDS = 300`, `MAX_BYTES = 4 * 1024 * 1024`, `MIN_SECONDS = 1`, `BITRATE = 32_000`.
  - `formatClock(seconds)` gives "0:42 / 5:00".
- `limits.ts` + test: `checkTranscriptionLimits({ lastMinute, lastDay })` allows up to 5 a minute and 60 a day, using the spec's wording.
- `text.ts` + test: `appendTranscript(existing, transcript, max = MESSAGE_MAX)` joins with a single space, trims, and reports when the result was cut (requirement 11).
- `schemas.ts` + test: the allowed upload types (base type before any `;`) and the size checks.

**Server**
- `app/api/transcribe/route.ts` (new; `runtime = "nodejs"`, `maxDuration = 60`). It follows the auth/limits/logging pattern of `app/api/onboarding/chat/route.ts`:
  1. Reject anyone not signed in (401).
  2. Read `request.formData()` and check the `audio` file's type and size (413 / 415).
  3. Count the person's last-minute and last-day rows (429 with the pause message).
  4. Insert a row before the call, so failed calls count too.
  5. Call `experimental_transcribe({ model: openai.transcription("gpt-transcribe"), audio: Uint8Array, providerOptions: { openai: { keywords: ["Stryvv"], prompt: FIXED_PROMPT } }, abortSignal })`.
  6. Return `{ text }`, trimmed and capped at 2,000 characters.
  7. Log ids, bytes, `durationInSeconds` and error names only.
- `package.json`: `npm install @ai-sdk/openai@ai-v6` (3.0.137, which passes `keywords` and `languages`).

**UI**
- `components/app/onboarding/use-voice-recorder.ts` (new, client hook). It's a state machine: idle → requesting → recording → transcribing → idle, plus error states (blocked, no microphone, unsupported, failed, empty, limit).
  - Records with `MediaRecorder` (type from `pickRecordingType`, `audioBitsPerSecond: BITRATE`, 1-second timeslices so bytes can be counted).
  - Auto-stops at `MAX_SECONDS` or `MAX_BYTES`, and discards anything under a second.
  - Keeps the last blob for Retry.
  - Stops the microphone tracks whenever recording ends and on unmount.
- `components/app/onboarding/voice-controls.tsx` (new): the microphone button, the recording bar (dot plus "Recording", the timer, Cancel and Stop), "Transcribing…", and inline messages with Retry. It uses a polite live region and announces the time every 30 seconds; Escape cancels.
- `components/app/onboarding/chat-composer.tsx` (edit): a microphone next to Send. While recording or transcribing, the recording bar replaces the text box; when the transcript arrives, `appendTranscript` adds it to the box and focuses it. Chips are untouched.
- `chat-step.tsx`: no change in behaviour. Both composers (chat and review correction) get voice through `ChatComposer`.

**Docs and setup**
- `CLAUDE.md`: a line on voice input (route, model, no audio kept, limits table).
- `.claude/skills/data-security/SKILL.md`: rule 7 names OpenAI (voice transcription) as a processor that gets the audio only; rule 8 names `OPENAI_API_KEY`.
- `.env.example`: change the stale OpenAI comment to "voice transcription (server-only)". CI already has a placeholder.
- `docs/work/2026-11-04-voice-input/plan.md`: kept in step with what's built.

## Order of work

1. Save this plan as `plan.md`. Run `npm install @ai-sdk/openai@ai-v6`.
2. Write `11_transcription_requests.sql`, then the migration. Re-apply locally (`npx supabase stop --no-backup`, then `npm run db:start`). Run `npm run test:db` until green, then `npm run db:types`.
3. Write the `lib/voice/` tests, then the modules, until `npm run test` is green.
4. Write the transcribe route, then try it once with the dev key and a short recorded clip. This also confirms the restricted key's permissions.
5. Build the hook, the controls and the composer changes.
6. Update the docs and env comments.
7. Run `npm run check`, `npm run test:db` and `npm run build`. Then the browser checks below, and the `verifier` agent.
8. Open the PR, based on `feat/onboarding-chat` until #10 merges. After merge, Jordan sets the key and spend limit, and with his go-ahead I apply the migration to production after the onboarding one.

## Risks

- **A browser records a format `gpt-transcribe` rejects** (Firefox's Ogg default).
  - Guard: `pickRecordingType` asks for webm first, and the server checks the type.
  - Checked in Chrome and Safari, with Firefox's recorder settings tested by unit test.
- **A recording goes over Vercel's ~4.5 MB limit.**
  - Guard: a 32 kbps bitrate, a byte count every second, and auto-stop at 4 MB; the server refuses anything over 4 MB.
- **The microphone stays on** (the browser's red indicator) after recording or leaving the step.
  - Guard: the hook stops every track on stop, cancel, error and unmount. Checked in the browser.
- **Long recordings are slow to transcribe.**
  - Guard: progress UI and a 60-second server limit. A real 5-minute clip is timed, and the time goes in the PR.
- **Restricted-key permissions.**
  - Guard: step 4 does a real call with Jordan's dev key; a "Missing scopes" error means widening Model capabilities.
- **Personal data in logs.**
  - Guard: the route logs ids, bytes, duration and error names only. Review checks it against data-security rule 6.

## Proof

- `npm run check` green: the recording, limits, text and schema tests. Paste the summary lines.
- `npm run test:db` green, including `11_transcription_requests.sql`. `npm run build` green.
- Browser pane, local stack (`npm run dev:local`), phone and desktop width, light and dark:
  1. Tap the microphone and allow access; the timer runs. Speak a sentence with an amount, then Stop. "Transcribing…" appears, then the text lands in the box and nothing sends.
  2. Cancel mid-recording: nothing is sent, and the microphone indicator goes off.
  3. Deny the microphone: the explanation shows, and typing still works.
  4. Retry after a failure (simulated by blocking the request): the same audio is resent.
  5. Hit the per-minute limit: the pause message shows.
  6. Use voice in the review-correction box.
- The browser pane may not have a microphone. Recording is checked there if it does; otherwise the route is tested with recorded test clips (short, 1-minute, near 5-minute), and Jordan does a final hands-on check on a real phone.
- The timings and cost of the test clips go in the PR.

## Changes while building (2026-11-04)

- **Chat messages hold 5,000 characters, not 2,000** (Jordan's decision). A 4½-minute test recording transcribed to more than 2,000 characters and lost its second half; speech runs about 800 characters a minute. `MESSAGE_MAX` in `lib/onboarding/schemas.ts` drives the chat's validation, the text box and the transcript cap. Both specs updated.
- **The test clips stand in for a microphone.** The browser pane blocks real microphone input, so recording was tested by giving `getUserMedia` a stream of the spoken clip played through Web Audio. The real `MediaRecorder` and hook code ran unchanged. A hands-on check on a real phone (Jordan) is still needed.

## Proof results (2026-11-04, local stack, `gpt-transcribe`)

- Route: an 8.6 s clip ("…save six thousand dollars for a trip to Japan… Stryvv…") came back as "…save $6,000 for a trip to Japan by next fall. Stryvv is helping me plan it." in about 2 s server time. An Ogg upload gets a 415 with the friendly message.
- **Long recording: a 4 min 23 s clip at 32 kbps was 1.1 MB and transcribed in 7.9 s** (about $0.02). With the 5,000 cap its transcript still ran a few words over: the text-to-speech voice talks at about 1,140 characters a minute, faster than people (roughly 800–1,000), so a real 5-minute answer should fit; a very fast talker near 5 minutes gets the first 5,000 characters and the "send this part" message.
- Through the real recorder (Chrome, `audio/webm`): recording bar with timer, Stop, "Transcribing…", the transcript lands in the box, focused, nothing sent, and the audio track released. Cancel sends nothing and releases the track. A failed call shows Retry, and Retry resends the same recording and appends it after a space. A blocked microphone shows the explanation, and typing still works.
- Limits: failed calls count; the 6th request in a minute gets 429 and "Let's pause voice for a moment. You can keep typing.", shown in the box.
- Logs hold user id, model, type, bytes, audio seconds and timing only.
