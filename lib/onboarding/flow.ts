// Where a person is in the onboarding chat. Stored in `conversations.topic` as text, so a person who
// closes the app comes back to the same step and topic.
//
// Format: "<step>:<topic>:<topicStart>:<stepStart>"
//   step        story | rich
//   topic       0-based topic index; topic === topics.length means the step's review cards
//   topicStart  how many of the person's messages came before this topic started
//   stepStart   how many messages (theirs and the coach's) came before this step's opening message.
//               All messages, not just theirs: a skipped step may have none of theirs, and the
//               next step must still start after it.

import { CHAT_STEPS, type ChatStepId, type StepId } from "./steps"

export type Pointer = { step: ChatStepId; topic: number; topicStart: number; stepStart: number }

/** One answer plus at most two follow-ups per topic (spec requirement 8). */
export const MAX_TURNS_PER_TOPIC = 3

export const ONBOARDING_STAGES = ["not_started", "money_story", "baseline", "rich_life", "done"] as const
export type OnboardingStage = (typeof ONBOARDING_STAGES)[number]

export function isStage(value: unknown): value is OnboardingStage {
  return typeof value === "string" && (ONBOARDING_STAGES as readonly string[]).includes(value)
}

export function formatPointer(p: Pointer): string {
  return `${p.step}:${p.topic}:${p.topicStart}:${p.stepStart}`
}

/** Reads a stored pointer. Anything malformed or out of range reads as null. */
export function parsePointer(raw: string | null | undefined): Pointer | null {
  if (!raw) return null
  const match = /^(story|rich):(\d{1,2}):(\d{1,4}):(\d{1,4})$/.exec(raw)
  if (!match) return null
  const step = match[1] as ChatStepId
  const topic = Number(match[2])
  const topicStart = Number(match[3])
  const stepStart = Number(match[4])
  if (topic > CHAT_STEPS[step].topics.length) return null
  return { step, topic, topicStart, stepStart }
}

/**
 * The pointer at the start of a chat step. `userMessages` = the person's messages so far;
 * `allMessages` = every message so far, before the step's opening message is added.
 */
export function startOfStep(step: ChatStepId, userMessages: number, allMessages: number): Pointer {
  return { step, topic: 0, topicStart: userMessages, stepStart: allMessages }
}

export function isReview(p: Pointer): boolean {
  return p.topic >= CHAT_STEPS[p.step].topics.length
}

/** How many of the person's messages belong to the current topic. */
export function turnsInTopic(p: Pointer, userMessages: number): number {
  return Math.max(0, userMessages - p.topicStart)
}

export function followUpsLeft(p: Pointer, userMessages: number): number {
  return Math.max(0, MAX_TURNS_PER_TOPIC - turnsInTopic(p, userMessages))
}

/** The server moves on when the person used the shortcut, or the topic has had its three answers. */
export function mustAdvance(p: Pointer, userMessages: number, shortcut: boolean): boolean {
  if (isReview(p)) return false
  return shortcut || turnsInTopic(p, userMessages) >= MAX_TURNS_PER_TOPIC
}

/** The next topic, or the step's review once the last topic is done. */
export function nextPointer(p: Pointer, userMessages: number): Pointer {
  if (isReview(p)) return p
  return { ...p, topic: p.topic + 1, topicStart: userMessages }
}

/** Which step the sheet shows for a stage. `null` once onboarding is done. */
export function stepForStage(stage: OnboardingStage): StepId | null {
  switch (stage) {
    case "not_started":
    case "money_story":
      return "story"
    case "baseline":
      return "baseline"
    case "rich_life":
      return "rich"
    case "done":
      return null
  }
}

/**
 * The stage after finishing (or skipping) a step. A step reopened from home after onboarding is
 * done leaves the stage alone.
 */
export function stageAfter(stage: OnboardingStage, finished: StepId): OnboardingStage {
  if (stepForStage(stage) !== finished) return stage
  switch (finished) {
    case "story":
      return "baseline"
    case "baseline":
      return "rich_life"
    case "rich":
      return "done"
  }
}

type StoredMessage = { role: "user" | "assistant"; content: string }

/**
 * The messages of the current step only (oldest first), so the model sees what it needs and each
 * call stays cheap. The step starts at its opening message, after `stepStart` earlier messages.
 */
export function messagesForStep<T extends StoredMessage>(rows: T[], stepStart: number): T[] {
  return rows.slice(Math.max(0, stepStart))
}
