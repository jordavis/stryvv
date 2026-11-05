// Zod schemas for everything that crosses a boundary in onboarding: the chat request from the
// browser, the review cards the model proposes (tool input), and the save actions.
// Field limits match the table checks in supabase/migrations/.

import { z } from "zod"
import { BASELINE_ITEMS, UNITY_ITEMS } from "./baseline"

export const MESSAGE_MAX = 2000

const chip = z.string().trim().min(1).max(40)

// Strict (closed) objects with every field required: the model returns these as structured output,
// which needs a closed schema.
export const moneyHistoryCardSchema = z.strictObject({
  kind: z.enum(["memory", "belief", "pattern", "win"]).describe("memory, belief, pattern or win"),
  title: z.string().trim().min(1).max(120).describe("A short title in the person's own words, at most 8 words"),
  description: z.string().trim().max(500).describe("One plain sentence describing it"),
  attributes: z.array(chip).max(4).describe("1 to 4 short chips, e.g. 'Childhood', 'Guilt', 'Saving'"),
})
export type MoneyHistoryCard = z.infer<typeof moneyHistoryCardSchema>

export const proposeMoneyHistorySchema = z.strictObject({
  entries: z.array(moneyHistoryCardSchema).max(12),
})

const isoDate = z.iso.date()

export const goalCardSchema = z.strictObject({
  title: z.string().trim().min(1).max(120).describe("The goal, in the person's words"),
  why: z.string().trim().max(500).describe("Why it matters to them, in one sentence"),
  targetAmount: z
    .number()
    .min(0)
    .max(999_999_999_999)
    .nullable()
    .describe("The target amount in dollars, only if the person gave one; otherwise null"),
  targetDate: isoDate
    .nullable()
    .describe("The target date as YYYY-MM-DD, only if the person gave one; otherwise null"),
})
export type GoalCard = z.infer<typeof goalCardSchema>

export const proposeGoalsSchema = z.strictObject({
  vision: z.string().trim().max(1000).describe("Their rich-life vision in two or three sentences, in their words"),
  goals: z.array(goalCardSchema).max(5),
})
export type GoalsProposal = z.infer<typeof proposeGoalsSchema>

/**
 * Review cards: what the coach proposes (sent to the screen as a `data-proposal` part), and the
 * person's cards as edited on screen (sent with a typed correction so their edits are kept).
 */
export const draftsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("money_history"), entries: proposeMoneyHistorySchema.shape.entries }),
  z.object({ kind: z.literal("goals"), vision: proposeGoalsSchema.shape.vision, goals: proposeGoalsSchema.shape.goals }),
])
export type Drafts = z.infer<typeof draftsSchema>

/**
 * The chat request. It carries only the new message (or none, to continue), the conversation id
 * and the person's draft cards: the server loads the history itself.
 */
export const chatRequestSchema = z
  .object({
    conversationId: z.uuid(),
    intent: z.enum(["message", "continue"]),
    text: z.string().trim().min(1).max(MESSAGE_MAX).optional(),
    shortcut: z.boolean().optional(),
    drafts: draftsSchema.optional(),
  })
  .refine((r) => r.intent === "continue" || r.text !== undefined, { message: "text is required", path: ["text"] })
export type ChatRequest = z.infer<typeof chatRequestSchema>

const answer = z.number().int().min(0).max(4)
const baseAnswers = Object.fromEntries(BASELINE_ITEMS.map((item) => [item.metric, answer]))
const unityAnswers = Object.fromEntries(UNITY_ITEMS.map((item) => [item.metric, answer]))

/** Six answers on your own, or eight (with both Unity answers) for someone in a relationship. */
export const baselineAnswersSchema = z.union([
  z.strictObject(baseAnswers as Record<(typeof BASELINE_ITEMS)[number]["metric"], typeof answer>),
  z.strictObject({ ...baseAnswers, ...unityAnswers } as Record<
    (typeof BASELINE_ITEMS)[number]["metric"] | (typeof UNITY_ITEMS)[number]["metric"],
    typeof answer
  >),
])

export const saveMoneyHistorySchema = z.object({
  conversationId: z.uuid(),
  entries: proposeMoneyHistorySchema.shape.entries,
})

export const saveGoalsSchema = z.object({
  conversationId: z.uuid(),
  vision: proposeGoalsSchema.shape.vision,
  goals: proposeGoalsSchema.shape.goals,
})
