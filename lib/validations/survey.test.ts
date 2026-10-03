import { describe, expect, it } from "vitest"
import { step3Schema, step4Schema } from "./survey"

describe("step3Schema", () => {
  const valid = {
    q11_save_vs_yolo: "Mostly save",
    q12_my_money_style: "optimizer",
    q13_partner_money_style: "dreamer",
    q14_shape_ranking: ["circle", "square"],
    q15_learning_style: "visual",
  }

  it("accepts exactly two ranked shapes", () => {
    expect(step3Schema.safeParse(valid).success).toBe(true)
  })

  it("rejects fewer or more than two shapes", () => {
    expect(step3Schema.safeParse({ ...valid, q14_shape_ranking: ["circle"] }).success).toBe(false)
    expect(
      step3Schema.safeParse({ ...valid, q14_shape_ranking: ["circle", "square", "triangle"] }).success
    ).toBe(false)
  })
})

describe("step4Schema", () => {
  const base = { q16_goal_alignment: "mostly_aligned" }

  it("requires a description when the priority is 'other'", () => {
    const result = step4Schema.safeParse({ ...base, q17_financial_priority: "other", q17_other_priority: "  " })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(["q17_other_priority"])
  })

  it("does not require a description for a listed priority", () => {
    expect(step4Schema.safeParse({ ...base, q17_financial_priority: "pay_off_debt" }).success).toBe(true)
  })
})
