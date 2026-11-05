// The Stryvv Score, version 1 (docs/measurement-framework.md). The database computes the score that
// counts (public.record_baseline); this copy lets the screen show it straight away. The same cases
// are tested in both places (score-cases.ts and supabase/tests/10_onboarding.sql).

import type { BaselineMetric, UnityMetric } from "./baseline"

export const SCORE_VERSION = 1

/** Six answers, plus the two Unity answers for someone married or in a relationship. */
export type BaselineAnswers = Record<BaselineMetric, number> & Partial<Record<UnityMetric, number>>

export type StryvvScore = {
  security: number
  satisfaction: number
  alignment: number
  /** Only for someone married or in a relationship. */
  unity?: number
  total: number
}

/** A stored answer (0 = Completely … 4 = Not at all) as 0–100. */
function points(answer: number): number {
  return (4 - answer) * 25
}

/** Halves round up, as Postgres `round()` does for positive numbers. */
function store(value: number): number {
  return Math.round(value)
}

export function scoreBaseline(a: BaselineAnswers): StryvvScore {
  const security = (points(a.security_shock) + points(a.security_future)) / 2
  const satisfaction = (points(a.satisfaction_enough) + points(a.satisfaction_sleep)) / 2
  const alignment = (points(a.alignment_values) + points(a.alignment_tracking)) / 2
  const partnered = a.unity_same_page !== undefined && a.unity_shared_vision !== undefined
  const unity = partnered ? (points(a.unity_same_page!) + points(a.unity_shared_vision!)) / 2 : undefined
  // The total comes from the unrounded parts; rounding happens only when storing.
  const total =
    unity === undefined ? (security + satisfaction + alignment) / 3 : (security + satisfaction + alignment + unity) / 4
  return {
    security: store(security),
    satisfaction: store(satisfaction),
    alignment: store(alignment),
    ...(unity === undefined ? {} : { unity: store(unity) }),
    total: store(total),
  }
}
