# Spec: Voice answers in the onboarding chat

From: intent.md (2026-11-04). Status: accepted (Jordan Davis, 2026-11-04).

## Requirements

**Recording**
1. The message box in both onboarding chat steps, and the "Anything to change or add…" box under the review cards, has a microphone button next to Send.
2. Tapping it asks for microphone access the first time (the browser's own prompt), then starts recording. Tapping again (Stop) ends the recording and starts transcription. A Cancel control ends the recording and throws it away.
3. While recording, the box shows a moving recording indicator, the elapsed time against the limit ("0:42 / 5:00"), Stop and Cancel. The text box and Send are hidden until recording ends.
4. A recording stops itself, and is transcribed, at 5 minutes, or earlier if it reaches 4 MB (a browser that ignores the requested bitrate). The person sees "That's the 5-minute limit. Here's what I heard." when that happens.
5. A recording under 1 second is discarded without a request.
6. Audio is recorded as `audio/webm` (Opus) where the browser supports it, otherwise `audio/mp4`, at about 32 kbps. A browser that can record neither shows the button as unavailable with "Voice isn't supported in this browser. You can type instead."

**Transcription**
7. When recording ends, the audio is sent to `POST /api/transcribe`. The box shows "Transcribing…" with progress; Send and the microphone are off until it finishes.
8. The transcript is added to the end of whatever is already in the message box (with a space between), the box is focused, and the cursor goes to the end. **It never sends itself.** If chips are selected, they stay selected.
9. If the transcript is empty: "I didn't catch anything. Try again, or type your answer."
10. If transcription fails: "Couldn't transcribe that. Try again" with a Retry button that resends the same recording, which is kept in memory until it succeeds or the person records again, cancels, or leaves.
11. A message box that would go over 2,000 characters after adding the transcript keeps the first 2,000 and shows "That's more than one message can hold. Send this part, then record the rest."

**Limits**
12. The server refuses audio over 4 MB, with a type other than `audio/webm` or `audio/mp4`, or from someone not signed in.
13. Each person can transcribe at most **5 recordings a minute** and **60 a day**. Over either: "Let's pause voice for a moment. You can keep typing." (Worst case about 60 × 5 min × $0.0045 = $1.35 a person a day.)
14. If the microphone is blocked or missing, the button stays visible and explains: "Allow microphone access for this site to answer by voice" (or "No microphone found"), and typing works as before.

## User experience

Mockups: none yet; follow the ChatComposer in the Stryvv Core Screens canvas. New pieces go in `components/app/onboarding/` with the `.stryvv-app` tokens, light and dark.

| State | What the box shows |
|---|---|
| Idle | Text box · microphone · Send (as today, plus the microphone) |
| Asking permission | The browser's prompt; the microphone shows as pressed |
| Recording | Red recording dot (also labelled "Recording", not colour alone) · "0:42 / 5:00" · Cancel · Stop |
| Transcribing | "Transcribing…" with a progress indicator; microphone and Send off |
| Done | Text box with the transcript added, focused |
| Empty / failed / limit | The message above the box, as in requirements 9–13, with Retry where it applies |
| Blocked / no mic / unsupported | Microphone shown dimmed; tapping it shows the explanation (requirements 6, 14) |

- **Tap targets** at least 44 px. Stop is the most prominent control while recording.
- **Screen readers:** the microphone is "Answer by voice"; recording and transcribing states are announced through a polite live region; the timer is announced every 30 seconds, not every second.
- **Keyboard:** the microphone is a normal button; Escape cancels a recording.
- **On a phone** the recording bar replaces the text box in place, so the layout doesn't jump and the bar stays above the keyboard area.

## Data and API changes

**Schema change: one new migration** (merged after the onboarding migration).
- `public.transcription_requests`: `id`, `owner_id` (default `auth.uid()`, cascade on delete), `bytes` (integer, 1–4,194,304), `created_at` (default now). No audio and no text: it exists only so limits can be counted across serverless instances.
- RLS: the owner reads and inserts their own rows; no update or delete. Insert grant on `bytes` only, so rows can't be backdated or assigned to someone else. Not shared with partners (no sharing category).
- Index on `(owner_id, created_at desc)`.
- pgTAP: a stranger reads nothing; `created_at` and `owner_id` can't be set; rows can't be updated or deleted; `bytes` out of range is refused.

**App**
- `POST /api/transcribe` (route handler, `runtime = "nodejs"`, `maxDuration = 60`):
  1. Checks the user (401 otherwise).
  2. Reads `multipart/form-data` with one `audio` file; checks type and size (requirement 12).
  3. Counts the person's `transcription_requests` in the last minute and day (requirement 13), then inserts a row **before** calling OpenAI, so failed calls still count.
  4. Calls OpenAI `gpt-transcribe` with `keywords: ["Stryvv"]` and a short, fixed `prompt` describing the setting (a person describing their money history and goals; may mention dollar amounts). No personal details in the prompt.
  5. Returns `{ text }` (trimmed, capped at 2,000 characters). Logs ids, bytes, duration and error codes only.
- `lib/voice/`: pure, tested helpers: picking the recording type (`pickRecordingType`), the size and length limits, the limit check (`checkTranscriptionLimits`), and joining the transcript to existing text (`appendTranscript`, requirement 8 and 11).
- `components/app/onboarding/voice-recorder.tsx` (client): MediaRecorder, timer, auto-stop, Cancel/Stop, Retry; used by `chat-composer.tsx`.
- **Package:** `@ai-sdk/openai` upgraded within the v6 line (the `ai-v6` tag, 3.0.137 today) and `experimental_transcribe` from `ai`, if that version passes `keywords` through to `gpt-transcribe`; otherwise the route calls the installed `openai` package directly. The plan confirms which.
- **Env:** `OPENAI_API_KEY` (already in `.env.example`, CI and Vercel), server-only.

## Security and privacy

- **What reaches OpenAI:** the audio of one recording, the fixed prompt and the keyword list. No name, email, ids, conversation history or anything else. Under OpenAI's API data policy, API data isn't used for training by default; check its retention terms for the Privacy Policy.
- **Nothing about the recording is stored by us:** the audio lives only in the browser's memory and in the request; the server doesn't write it anywhere. The transcript is only kept if the person sends it, as an ordinary chat message.
- **Who can read what:** `transcription_requests` rows are owner-only and contain only a size and a time.
- **Logs:** ids, byte counts, durations and error codes. Never audio or transcript text (data-security rule 6).
- **Docs:** the `data-security` skill's rules 7 and 8 add OpenAI (voice) as a processor and `OPENAI_API_KEY` as a server-only secret; `CLAUDE.md` gets a line on voice input.

## Concerns flagged

- **A second processor of personal data.** OpenAI hears people describing their finances and family. → Fine for testers who know they're testing. The Privacy Policy (before signup opens) must name OpenAI, say what's sent, and state its retention.
- **Vercel's ~4.5 MB request limit.** → Record at about 32 kbps (5 minutes ≈ 1.2 MB) and stop at 4 MB whatever the bitrate (requirement 4). The server refuses anything larger.
- **Firefox records Ogg by default,** which `gpt-transcribe` doesn't accept. → Ask MediaRecorder for `audio/webm;codecs=opus` first, which Firefox supports (requirement 6).
- **iPhone home-screen apps can ask for the microphone again each session.** → Expected browser behaviour; the explanation in requirement 14 covers a refusal.
- **Long recordings take a while.** A 5-minute recording may take several seconds or more to transcribe. → Show progress (requirement 7); the plan measures real times and the server allows up to 60 seconds.
- **Bystanders' voices** (a partner in the room) can be recorded. → Nothing is kept, and the person reviews the text before sending. No change.
- **Older OpenAI transcription models shut down on February 26, 2027.** → Use `gpt-transcribe`, the current recommended model.
- **Cost.** About $0.0045 a minute; a typical onboarding with a few voice answers adds a cent or two. The daily cap bounds abuse (requirement 13), plus an OpenAI spend limit (Jordan).

## Production setup (Jordan)

| Where | Setting |
|---|---|
| OpenAI Platform | Confirm `OPENAI_API_KEY` in Vercel is a Stryvv production key; set a monthly spend limit (suggested $20 while testers only) |
| Supabase | Apply the new migration after merge, after the onboarding migration; then I verify read-only |

## Answers to intent's open questions

- **Which model?** → `gpt-transcribe`, OpenAI's recommended model for recorded speech; the older models shut down on February 26, 2027 ([OpenAI deprecations](https://developers.openai.com/api/docs/deprecations)). $0.0045 a minute ([OpenAI pricing](https://developers.openai.com/api/docs/pricing)).
- **Per-person limits?** → 5 a minute and 60 a day, counted in `transcription_requests` (requirement 13).
- **Error states?** → Requirements 9–14 and the table above.
