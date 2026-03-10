import { z } from "zod"

const partnerType = z.enum(["husband", "wife"])
const moneyStyle = z.enum(["avoider", "optimizer", "worrier", "dreamer"])
const learningStyle = z.enum(["visual", "auditory", "reading_writing", "kinesthetic", "idk"])
const financeStructure = z.enum(["fully_joint", "partially", "separate"])
const financeManager = z.enum(["i_do", "partner", "share_equally", "not_defined"])
const goalAlignment = z.enum(["very_aligned", "mostly_aligned", "somewhat_aligned", "rarely_aligned", "not_at_all"])
const financialPriority = z.enum([
  "pay_off_debt",
  "build_emergency_fund",
  "save_for_home",
  "invest_for_retirement",
  "grow_wealth",
  "save_for_family",
  "travel_experiences",
  "financial_freedom",
  "other",
])
const discussionFrequency = z.enum(["weekly", "monthly", "occasionally", "rarely", "almost_never"])
const conversationFeeling = z.enum([
  "easy_productive",
  "somewhat_tense",
  "one_sided",
  "emotionally_charged",
  "we_avoid_them",
])
const relationshipDuration = z.enum([
  "less_than_1yr",
  "1_to_3yr",
  "4_to_7yr",
  "8_to_15yr",
  "16_to_25yr",
  "25_plus_yr",
])
const reflectionFeeling = z.enum(["very_positive", "positive", "neutral", "uneasy", "concerned"])
const shapeId = z.enum(["circle", "square", "triangle", "squiggle"])

export const step1Schema = z.object({
  q5_nickname: z.string().min(1, "Please enter a nickname"),
  q6_partner_type: partnerType,
  q7_relationship_duration: relationshipDuration,
})
export type Step1Data = z.infer<typeof step1Schema>

export const step2Schema = z.object({
  q8_finance_structure: financeStructure,
  q9_finance_manager: financeManager,
  q10_satisfaction: z.number().int().min(1).max(5),
})
export type Step2Data = z.infer<typeof step2Schema>

export const step3Schema = z.object({
  q11_save_vs_yolo: z.string().min(1, "Please share your thoughts"),
  q12_my_money_style: moneyStyle,
  q13_partner_money_style: moneyStyle,
  q14_shape_ranking: z.array(shapeId).min(2, "Please select your top 2 shapes").max(2),
  q15_learning_style: learningStyle,
})
export type Step3Data = z.infer<typeof step3Schema>

export const step4Schema = z.object({
  q16_goal_alignment: goalAlignment,
  q17_financial_priority: financialPriority,
  q17_other_priority: z.string().optional(),
}).refine(
  (data) => data.q17_financial_priority !== "other" || (data.q17_other_priority ?? "").trim().length > 0,
  { message: "Please describe your priority", path: ["q17_other_priority"] }
)
export type Step4Data = z.infer<typeof step4Schema>

export const step5Schema = z.object({
  q19_joy_spending_moment: z.string().min(1, "Please share a moment"),
  q20_discussion_frequency: discussionFrequency,
  q21_conversation_feeling: conversationFeeling,
  q22_biggest_challenge: z.string().min(1, "Please describe a challenge"),
  q23_biggest_win: z.string().min(1, "Please describe a win"),
})
export type Step5Data = z.infer<typeof step5Schema>

export const step6Schema = z.object({
  q_reflection_feeling: reflectionFeeling,
  q_discuss_with_partner: z.string().min(1, "Please share something"),
})
export type Step6Data = z.infer<typeof step6Schema>
