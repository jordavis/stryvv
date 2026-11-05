// Per-person transcription limits (spec requirement 13). Worst case about 60 × 5 min × $0.0045 =
// $1.35 a person a day.

export const MAX_TRANSCRIPTIONS_PER_MINUTE = 5
export const MAX_TRANSCRIPTIONS_PER_DAY = 60

export const VOICE_PAUSE_MESSAGE = "Let's pause voice for a moment. You can keep typing."

export type TranscriptionLimitCheck = { ok: true } | { ok: false; message: string }

/** Counts are the person's requests before this one. */
export function checkTranscriptionLimits(counts: { lastMinute: number; lastDay: number }): TranscriptionLimitCheck {
  if (counts.lastMinute >= MAX_TRANSCRIPTIONS_PER_MINUTE || counts.lastDay >= MAX_TRANSCRIPTIONS_PER_DAY) {
    return { ok: false, message: VOICE_PAUSE_MESSAGE }
  }
  return { ok: true }
}
