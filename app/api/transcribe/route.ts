import { openai, type OpenAITranscriptionModelOptions } from "@ai-sdk/openai"
import { experimental_transcribe as transcribe } from "ai"
import { MESSAGE_MAX } from "@/lib/onboarding/schemas"
import { checkTranscriptionLimits } from "@/lib/voice/limits"
import { checkUpload } from "@/lib/voice/schemas"
import { createClient } from "@/lib/supabase/server"

// POST /api/transcribe: turns one voice recording into text for the message box
// (spec: docs/work/2026-11-04-voice-input/spec.md).
//
// The recording is checked, counted, sent to OpenAI and dropped: it's never stored or logged, and
// the text is only kept if the person sends it as a chat message. OpenAI gets the audio, a fixed
// description of the setting and a keyword list, nothing about the person.

export const runtime = "nodejs"
export const maxDuration = 60

/** OpenAI's recommended model for recorded speech; the older ones shut down on 2027-02-26. */
const MODEL = "gpt-transcribe"
const PROMPT = "A person answering a coach's questions about their money history, their goals and the life they want. They may mention dollar amounts, dates and family members."
const KEYWORDS = ["Stryvv"]

const MESSAGES: Record<number, string> = {
  400: "Couldn't transcribe that. Try again",
  401: "Please sign in again.",
  413: "That recording is too long. Try a shorter one.",
  415: "That recording format isn't supported. Try typing instead.",
  500: "Couldn't transcribe that. Try again",
}

function fail(status: number, message = MESSAGES[status] ?? MESSAGES[500]) {
  return Response.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail(401)

  const form = await request.formData().catch(() => null)
  const audio = form?.get("audio")
  const file = audio instanceof File ? audio : null
  const upload = checkUpload(file)
  if (!upload.ok) return fail(upload.status)

  // Limits are counted from stored rows (RLS: the person's own), so they hold across instances.
  const minuteAgo = new Date(Date.now() - 60_000).toISOString()
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  const [lastMinute, lastDay] = await Promise.all([
    supabase.from("transcription_requests").select("id", { count: "exact", head: true }).gte("created_at", minuteAgo),
    supabase.from("transcription_requests").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
  ])
  const limit = checkTranscriptionLimits({ lastMinute: lastMinute.count ?? 0, lastDay: lastDay.count ?? 0 })
  if (!limit.ok) return fail(429, limit.message)

  // Counted before the call, so failed calls count too.
  const { error: countError } = await supabase.from("transcription_requests").insert({ bytes: file!.size })
  if (countError) {
    console.error("transcribe_error", { stage: "count", code: countError.code })
    return fail(500)
  }

  const started = Date.now()
  try {
    const result = await transcribe({
      model: openai.transcription(MODEL),
      audio: new Uint8Array(await file!.arrayBuffer()),
      providerOptions: { openai: { prompt: PROMPT, keywords: KEYWORDS } satisfies OpenAITranscriptionModelOptions },
      abortSignal: AbortSignal.timeout(55_000),
    })
    // Sizes and timings only: never the audio or the text (data-security rule 6).
    console.info("transcribe_usage", {
      userId: user.id,
      model: MODEL,
      type: upload.type,
      bytes: file!.size,
      audioSeconds: result.durationInSeconds,
      ms: Date.now() - started,
    })
    return Response.json({ text: result.text.trim().slice(0, MESSAGE_MAX) })
  } catch (error) {
    console.error("transcribe_error", { stage: "model", name: error instanceof Error ? error.name : "unknown", ms: Date.now() - started })
    return fail(500)
  }
}
