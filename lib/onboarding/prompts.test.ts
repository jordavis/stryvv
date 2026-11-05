import { describe, expect, it } from "vitest"
import { startOfStep } from "./flow"
import { buildSystemPrompt, nextTopicBrief } from "./prompts"
import { openingMessage, RICH_STEP, STORY_STEP } from "./steps"

describe("buildSystemPrompt", () => {
  const pointer = startOfStep("story", 0, 0)

  it("includes the no-advice rule and the one-question rule", () => {
    const prompt = buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer, followUpsLeft: 2 })
    expect(prompt).toContain("Never give financial advice")
    expect(prompt).toContain("at most one question")
  })

  it("names the current topic and how many follow-ups are left", () => {
    const prompt = buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer, followUpsLeft: 1 })
    expect(prompt).toContain(STORY_STEP.topics[0].label)
    expect(prompt).toContain("at most 1 more follow-up question ")
  })

  it("tells the coach to move on when no follow-ups are left", () => {
    expect(buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer, followUpsLeft: 0 })).toContain("call next_topic now")
  })

  it("tells the coach today's date, so relative goal dates can be resolved", () => {
    const richReview = { step: "rich" as const, topic: 2, topicStart: 14, stepStart: 10 }
    const prompt = buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer: richReview, followUpsLeft: 0 })
    expect(prompt).toContain("Today's date: 2026-11-04.")
    expect(prompt).toContain("relative date")
  })

  it("uses only the first name it is given", () => {
    const prompt = buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer, followUpsLeft: 2 })
    expect(prompt).toContain("first name: Olive.")
    expect(prompt).not.toMatch(/@|email|phone number:/i)
  })

  it("asks for the right review cards at the end of each step", () => {
    const storyReview = { step: "story" as const, topic: 4, topicStart: 9, stepStart: 0 }
    const richReview = { step: "rich" as const, topic: 2, topicStart: 14, stepStart: 10 }
    expect(buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer: storyReview, followUpsLeft: 0 })).toContain("memory, belief, pattern or win")
    expect(buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer: richReview, followUpsLeft: 0 })).toContain("rich-life vision")
  })

  it("moves on with the server's brief instead of offering follow-ups", () => {
    const prompt = buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer, followUpsLeft: 0, moveOn: "Ask about their win." })
    expect(prompt).toContain("Move on now")
    expect(prompt).toContain("Ask about their win.")
    expect(prompt).not.toContain("next_topic")
  })

  it("includes the person's edited cards when they type a correction", () => {
    const storyReview = { step: "story" as const, topic: 4, topicStart: 9, stepStart: 0 }
    const drafts = {
      kind: "money_history" as const,
      entries: [{ kind: "win" as const, title: "Paid off the car in 2024", description: "", attributes: [] }],
    }
    expect(buildSystemPrompt({ today: "2026-11-04", firstName: "Olive", pointer: storyReview, followUpsLeft: 0, drafts })).toContain(
      "Paid off the car in 2024"
    )
  })
})

describe("nextTopicBrief", () => {
  it("gives the next topic's question and example", () => {
    const brief = nextTopicBrief({ step: "story", topic: 1, topicStart: 3, stepStart: 0 })
    expect(brief).toContain(STORY_STEP.topics[1].opening)
    expect(brief).toContain(STORY_STEP.topics[1].example)
  })

  it("wraps up after the last topic", () => {
    expect(nextTopicBrief({ step: "rich", topic: 2, topicStart: 5, stepStart: 3 })).toContain("last topic")
  })
})

describe("openingMessage", () => {
  it("greets by first name and includes an example answer", () => {
    const message = openingMessage(STORY_STEP, 0, "Olive")
    expect(message).toContain("Hi Olive!")
    expect(message).toContain(`For example: "${STORY_STEP.topics[0].example}"`)
  })

  it("opens the rich-life step with its first question", () => {
    expect(openingMessage(RICH_STEP, 0)).toContain(RICH_STEP.topics[0].opening)
  })
})
