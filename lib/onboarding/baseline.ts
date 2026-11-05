// The Stryvv Score items (docs/measurement-framework.md → The Stryvv Score, version 1).
// The wording is fixed: answers can only be compared over time if every item is asked exactly as
// written. Items 7–8 (Unity) are asked only of people married or in a relationship.

export const ANSWER_LABELS = ["Completely", "Very well", "Somewhat", "Very little", "Not at all"] as const

export const BASELINE_PROMPT = "How well does this describe you?"

export const BASELINE_ITEMS = [
  { metric: "security_shock", part: "security", text: "I could handle a major unexpected expense." },
  { metric: "security_future", part: "security", text: "I am securing my financial future." },
  { metric: "satisfaction_enough", part: "satisfaction", text: "What I have is enough for me." },
  { metric: "satisfaction_sleep", part: "satisfaction", text: "My money choices let me sleep well at night." },
  { metric: "alignment_values", part: "alignment", text: "My spending reflects what matters to me." },
  { metric: "alignment_tracking", part: "alignment", text: "I know where my money goes each month." },
] as const

export const UNITY_ITEMS = [
  { metric: "unity_same_page", part: "unity", text: "My partner and I are on the same page about money." },
  { metric: "unity_shared_vision", part: "unity", text: "We're working toward a shared picture of our rich life." },
] as const

/** Asked first: a yes adds the two Unity items. */
export const RELATIONSHIP_QUESTION = "Are you married or in a relationship?"

export type BaselineMetric = (typeof BASELINE_ITEMS)[number]["metric"]
export type UnityMetric = (typeof UNITY_ITEMS)[number]["metric"]
export type ScorePart = "security" | "satisfaction" | "alignment" | "unity"

export const PART_LABELS: Record<ScorePart, string> = {
  security: "Security",
  satisfaction: "Satisfaction",
  alignment: "Alignment",
  unity: "Unity",
}
