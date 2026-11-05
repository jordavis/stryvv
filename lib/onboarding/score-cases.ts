// Shared test cases for the Stryvv Score. Each case's `sql` answers and expected scores must also
// appear in supabase/tests/10_onboarding.sql (score.test.ts checks this), so the TypeScript and SQL
// formulas can't drift apart unnoticed.

import type { BaselineAnswers, StryvvScore } from "./score"

export type ScoreCase = { name: string; answers: BaselineAnswers; expected: StryvvScore }

export const SCORE_CASES: ScoreCase[] = [
  {
    name: "mixed",
    answers: {
      security_shock: 1,
      security_future: 2,
      satisfaction_enough: 3,
      satisfaction_sleep: 2,
      alignment_values: 0,
      alignment_tracking: 1,
    },
    expected: { security: 63, satisfaction: 38, alignment: 88, total: 63 },
  },
  {
    name: "partnered",
    answers: {
      security_shock: 1,
      security_future: 2,
      satisfaction_enough: 3,
      satisfaction_sleep: 2,
      alignment_values: 0,
      alignment_tracking: 1,
      unity_same_page: 0,
      unity_shared_vision: 0,
    },
    expected: { security: 63, satisfaction: 38, alignment: 88, unity: 100, total: 72 },
  },
  {
    name: "best",
    answers: {
      security_shock: 0,
      security_future: 0,
      satisfaction_enough: 0,
      satisfaction_sleep: 0,
      alignment_values: 0,
      alignment_tracking: 0,
    },
    expected: { security: 100, satisfaction: 100, alignment: 100, total: 100 },
  },
  {
    name: "worst",
    answers: {
      security_shock: 4,
      security_future: 4,
      satisfaction_enough: 4,
      satisfaction_sleep: 4,
      alignment_values: 4,
      alignment_tracking: 4,
    },
    expected: { security: 0, satisfaction: 0, alignment: 0, total: 0 },
  },
]

/** The answers as the pgTAP file writes them in its record_baseline calls. */
export function sqlAnswers(a: BaselineAnswers): string {
  const unity =
    a.unity_same_page === undefined ? "" : `, "unity_same_page": ${a.unity_same_page}, "unity_shared_vision": ${a.unity_shared_vision}`
  return `{"security_shock": ${a.security_shock}, "security_future": ${a.security_future}, "satisfaction_enough": ${a.satisfaction_enough}, "satisfaction_sleep": ${a.satisfaction_sleep}, "alignment_values": ${a.alignment_values}, "alignment_tracking": ${a.alignment_tracking}${unity}}`
}
