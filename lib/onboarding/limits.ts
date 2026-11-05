// Limits that bound model spend per person (spec requirement 25).

export const MAX_USER_MESSAGES_PER_CONVERSATION = 60
export const MAX_USER_MESSAGES_PER_MINUTE = 20

export const PAUSE_MESSAGE = "Let's pause for a moment. You can pick this up again in a little while."
export const CONVERSATION_FULL_MESSAGE =
  "We've covered a lot here. Save what you have, or skip for now, and you can come back to this later."

export type LimitCheck = { ok: true } | { ok: false; message: string }

/** Counts are the person's messages before the new one. */
export function checkLimits(counts: { inConversation: number; lastMinute: number }): LimitCheck {
  if (counts.inConversation >= MAX_USER_MESSAGES_PER_CONVERSATION) return { ok: false, message: CONVERSATION_FULL_MESSAGE }
  if (counts.lastMinute >= MAX_USER_MESSAGES_PER_MINUTE) return { ok: false, message: PAUSE_MESSAGE }
  return { ok: true }
}
