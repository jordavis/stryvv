import { describe, expect, it } from "vitest"
import {
  followUpsLeft,
  formatPointer,
  isReview,
  messagesForStep,
  mustAdvance,
  nextPointer,
  parsePointer,
  stageAfter,
  startOfStep,
  stepForStage,
  turnsInTopic,
} from "./flow"

describe("the stored pointer", () => {
  it("round-trips through text", () => {
    const p = { step: "story" as const, topic: 2, topicStart: 7, stepStart: 0 }
    expect(parsePointer(formatPointer(p))).toEqual(p)
  })

  it("reads anything malformed or out of range as nothing", () => {
    expect(parsePointer(null)).toBeNull()
    expect(parsePointer("")).toBeNull()
    expect(parsePointer("Money history")).toBeNull()
    expect(parsePointer("story:9:0:0")).toBeNull()
    expect(parsePointer("rich:3:0:0")).toBeNull()
    expect(parsePointer("story:1:-2:5")).toBeNull()
    expect(parsePointer("baseline:0:0:0")).toBeNull()
  })

  it("allows the review position after the last topic", () => {
    expect(isReview(parsePointer("story:4:9:0")!)).toBe(true)
    expect(isReview(parsePointer("rich:2:15:12")!)).toBe(true)
    expect(isReview(parsePointer("story:3:9:0")!)).toBe(false)
  })
})

describe("moving through topics", () => {
  const start = startOfStep("story", 0, 0)

  it("counts the person's answers in the current topic", () => {
    expect(turnsInTopic(start, 0)).toBe(0)
    expect(turnsInTopic(start, 2)).toBe(2)
    expect(followUpsLeft(start, 1)).toBe(2)
    expect(followUpsLeft(start, 3)).toBe(0)
  })

  it("moves on after three answers, or straight away with the shortcut", () => {
    expect(mustAdvance(start, 1, false)).toBe(false)
    expect(mustAdvance(start, 2, false)).toBe(false)
    expect(mustAdvance(start, 3, false)).toBe(true)
    expect(mustAdvance(start, 1, true)).toBe(true)
  })

  it("starts the next topic's count at the person's current message count", () => {
    expect(nextPointer(start, 3)).toEqual({ step: "story", topic: 1, topicStart: 3, stepStart: 0 })
  })

  it("reaches the review after the last topic, and stays there", () => {
    let p = start
    for (let i = 0; i < 4; i++) p = nextPointer(p, i + 1)
    expect(isReview(p)).toBe(true)
    expect(nextPointer(p, 10)).toEqual(p)
    expect(mustAdvance(p, 99, true)).toBe(false)
  })
})

describe("stages", () => {
  it("maps each stage to the step the sheet shows", () => {
    expect(stepForStage("not_started")).toBe("story")
    expect(stepForStage("money_story")).toBe("story")
    expect(stepForStage("baseline")).toBe("baseline")
    expect(stepForStage("rich_life")).toBe("rich")
    expect(stepForStage("done")).toBeNull()
  })

  it("advances only when the current step finishes", () => {
    expect(stageAfter("money_story", "story")).toBe("baseline")
    expect(stageAfter("baseline", "baseline")).toBe("rich_life")
    expect(stageAfter("rich_life", "rich")).toBe("done")
  })

  it("leaves the stage alone for a step reopened from home", () => {
    expect(stageAfter("done", "baseline")).toBe("done")
    expect(stageAfter("done", "story")).toBe("done")
    expect(stageAfter("rich_life", "story")).toBe("rich_life")
  })
})

describe("messagesForStep", () => {
  const rows = [
    { role: "assistant" as const, content: "story opening" },
    { role: "user" as const, content: "a1" },
    { role: "assistant" as const, content: "q2" },
    { role: "user" as const, content: "a2" },
    { role: "assistant" as const, content: "rich opening" },
    { role: "user" as const, content: "b1" },
  ]

  it("returns everything for the first step", () => {
    expect(messagesForStep(rows, 0)).toEqual(rows)
  })

  it("returns the step's messages from its opening on", () => {
    expect(messagesForStep(rows, 4).map((r) => r.content)).toEqual(["rich opening", "b1"])
  })

  it("starts a step after a skipped one that had no answers", () => {
    // Story opened and skipped with no answer, then rich life opened: rich starts at message 1.
    const skipped = [
      { role: "assistant" as const, content: "story opening" },
      { role: "assistant" as const, content: "rich opening" },
    ]
    const rich = startOfStep("rich", 0, 1)
    expect(messagesForStep(skipped, rich.stepStart).map((r) => r.content)).toEqual(["rich opening"])
  })

  it("returns nothing past the end", () => {
    expect(messagesForStep(rows, 9)).toEqual([])
  })
})
