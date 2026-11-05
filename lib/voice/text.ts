import { MESSAGE_MAX } from "@/lib/onboarding/schemas"

/**
 * Adds a transcript to whatever is already in the message box (spec requirements 8 and 11): one
 * space between, nothing sent. If the result is longer than a message can hold, it keeps the first
 * `max` characters and says so.
 */
export function appendTranscript(
  existing: string,
  transcript: string,
  max: number = MESSAGE_MAX
): { text: string; truncated: boolean } {
  const before = existing.trimEnd()
  const added = transcript.trim()
  const joined = before && added ? `${before} ${added}` : before || added
  if (joined.length <= max) return { text: joined, truncated: false }
  return { text: joined.slice(0, max), truncated: true }
}

export const TOO_LONG_MESSAGE = "That's more than one message can hold. Send this part, then record the rest."
