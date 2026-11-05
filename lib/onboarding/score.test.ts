import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { scoreBaseline } from "./score"
import { SCORE_CASES, sqlAnswers } from "./score-cases"

const pgtap = readFileSync(join(process.cwd(), "supabase/tests/10_onboarding.sql"), "utf8")

describe("scoreBaseline", () => {
  for (const c of SCORE_CASES) {
    it(`scores the ${c.name} case`, () => {
      expect(scoreBaseline(c.answers)).toEqual(c.expected)
    })
  }

  it("rounds each part and the total only when storing (62.5 becomes 63)", () => {
    const mixed = SCORE_CASES.find((c) => c.name === "mixed")!
    expect(scoreBaseline(mixed.answers).total).toBe(63)
  })
})

describe("the database tests use the same cases", () => {
  for (const c of SCORE_CASES) {
    it(`10_onboarding.sql records the ${c.name} answers`, () => {
      expect(pgtap).toContain(`record_baseline('${sqlAnswers(c.answers)}')`)
    })

    it(`10_onboarding.sql expects the ${c.name} total`, () => {
      expect(pgtap).toContain(`${c.expected.total}::numeric, '${c.name}: stryvv score ${c.expected.total}'`)
    })
  }
})
