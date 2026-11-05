// Voice recording rules (spec: docs/work/2026-11-04-voice-input/spec.md, requirements 4–6).

/** 5 minutes per recording. */
export const MAX_SECONDS = 300
/** Below Vercel's ~4.5 MB request limit, whatever bitrate a browser actually uses. */
export const MAX_BYTES = 4 * 1024 * 1024
/** Shorter recordings are taps by mistake: discarded without a request. */
export const MIN_SECONDS = 1
/** Speech quality: about 1.2 MB for 5 minutes. */
export const BITRATE = 32_000

/** Formats gpt-transcribe accepts, in order of preference. Firefox's default (Ogg) isn't one. */
const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"] as const

/** The recording type to ask MediaRecorder for, or null if the browser can't record one we accept. */
export function pickRecordingType(isSupported: (type: string) => boolean): string | null {
  return PREFERRED_TYPES.find((type) => isSupported(type)) ?? null
}

/** "0:42 / 5:00" */
export function formatClock(seconds: number, max = MAX_SECONDS): string {
  const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
  return `${clock(Math.max(0, seconds))} / ${clock(max)}`
}

/** Whether a recording in progress has to stop now. */
export function mustStop(seconds: number, bytes: number): "time" | "size" | null {
  if (seconds >= MAX_SECONDS) return "time"
  if (bytes >= MAX_BYTES) return "size"
  return null
}
