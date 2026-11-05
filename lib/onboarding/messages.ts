import type { UIMessage } from "ai"
import type { Drafts } from "./schemas"

/** Sent with the end of each streamed reply, so the screen knows the current step and topic. */
export type OnboardingMetadata = { pointer?: string }
/** The coach's proposed review cards travel as a `data-proposal` part; they're never saved until confirmed. */
export type OnboardingDataParts = { proposal: Drafts }
export type OnboardingUIMessage = UIMessage<OnboardingMetadata, OnboardingDataParts>

export type StoredMessage = { id: string; role: "user" | "assistant"; content: string }

/** Saved messages, as the chat screen shows them when the sheet opens. */
export function toUIMessages(rows: StoredMessage[]): OnboardingUIMessage[] {
  return rows.map((row) => ({ id: row.id, role: row.role, parts: [{ type: "text", text: row.content }] }))
}
