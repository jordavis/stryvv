import { describe, expect, it } from "vitest"
import {
  baselineAnswersSchema,
  chatRequestSchema,
  MESSAGE_MAX,
  proposeGoalsSchema,
  proposeMoneyHistorySchema,
} from "./schemas"

const id = "4f6c2a3e-1b2d-4c5e-8f9a-0b1c2d3e4f5a"

describe("chatRequestSchema", () => {
  it("accepts a message", () => {
    expect(chatRequestSchema.safeParse({ conversationId: id, intent: "message", text: "Dad paid the bills." }).success).toBe(true)
  })

  it("accepts a request to continue with no text", () => {
    expect(chatRequestSchema.safeParse({ conversationId: id, intent: "continue" }).success).toBe(true)
  })

  it("refuses a message with no text, or only spaces", () => {
    expect(chatRequestSchema.safeParse({ conversationId: id, intent: "message" }).success).toBe(false)
    expect(chatRequestSchema.safeParse({ conversationId: id, intent: "message", text: "   " }).success).toBe(false)
  })

  it(`refuses a message over ${MESSAGE_MAX} characters`, () => {
    const text = "a".repeat(MESSAGE_MAX + 1)
    expect(chatRequestSchema.safeParse({ conversationId: id, intent: "message", text }).success).toBe(false)
  })

  it("refuses a conversation id that isn't a uuid", () => {
    expect(chatRequestSchema.safeParse({ conversationId: "1", intent: "continue" }).success).toBe(false)
  })

  it("accepts the person's draft cards, within limits", () => {
    const entries = [{ kind: "belief", title: "Spending is risky", description: "", attributes: ["Guilt"] }]
    expect(
      chatRequestSchema.safeParse({ conversationId: id, intent: "message", text: "Fix it", drafts: { kind: "money_history", entries } })
        .success
    ).toBe(true)
    const tooMany = Array.from({ length: 13 }, () => entries[0])
    expect(
      chatRequestSchema.safeParse({ conversationId: id, intent: "message", text: "x", drafts: { kind: "money_history", entries: tooMany } })
        .success
    ).toBe(false)
  })
})

describe("proposal schemas", () => {
  it("refuses an unknown kind of money-history entry", () => {
    const entries = [{ kind: "rant", title: "x", description: "", attributes: [] }]
    expect(proposeMoneyHistorySchema.safeParse({ entries }).success).toBe(false)
  })

  it("refuses more than four chips, or a chip over 40 characters", () => {
    const base = { kind: "win", title: "Paid off the car", description: "" }
    expect(proposeMoneyHistorySchema.safeParse({ entries: [{ ...base, attributes: ["a", "b", "c", "d", "e"] }] }).success).toBe(false)
    expect(proposeMoneyHistorySchema.safeParse({ entries: [{ ...base, attributes: ["x".repeat(41)] }] }).success).toBe(false)
  })

  it("accepts a goal with no amount or date", () => {
    const goals = [{ title: "Japan trip", why: "Family time", targetAmount: null, targetDate: null }]
    expect(proposeGoalsSchema.safeParse({ vision: "Weekends free.", goals }).success).toBe(true)
  })

  it("refuses a negative amount or a malformed date", () => {
    expect(
      proposeGoalsSchema.safeParse({ vision: "", goals: [{ title: "x", why: "", targetAmount: -1, targetDate: null }] }).success
    ).toBe(false)
    expect(
      proposeGoalsSchema.safeParse({ vision: "", goals: [{ title: "x", why: "", targetAmount: null, targetDate: "next fall" }] })
        .success
    ).toBe(false)
  })
})

describe("baselineAnswersSchema", () => {
  const answers = {
    security_shock: 1,
    security_future: 2,
    satisfaction_enough: 3,
    satisfaction_sleep: 2,
    alignment_values: 0,
    alignment_tracking: 1,
  }

  it("accepts the six answers", () => {
    expect(baselineAnswersSchema.safeParse(answers).success).toBe(true)
  })

  it("accepts the two Unity answers together, but not one alone", () => {
    expect(baselineAnswersSchema.safeParse({ ...answers, unity_same_page: 1, unity_shared_vision: 2 }).success).toBe(true)
    expect(baselineAnswersSchema.safeParse({ ...answers, unity_same_page: 1 }).success).toBe(false)
  })

  it("refuses a missing, extra, fractional or out-of-range answer", () => {
    const missing: Partial<typeof answers> = { ...answers }
    delete missing.alignment_tracking
    expect(baselineAnswersSchema.safeParse(missing).success).toBe(false)
    expect(baselineAnswersSchema.safeParse({ ...answers, stress: 3 }).success).toBe(false)
    expect(baselineAnswersSchema.safeParse({ ...answers, security_shock: 1.5 }).success).toBe(false)
    expect(baselineAnswersSchema.safeParse({ ...answers, security_shock: 5 }).success).toBe(false)
  })
})
