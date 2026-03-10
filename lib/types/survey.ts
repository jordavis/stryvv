export type PartnerType = "husband" | "wife"
export type MoneyStyle = "avoider" | "optimizer" | "worrier" | "dreamer"
export type LearningStyle = "visual" | "auditory" | "reading_writing" | "kinesthetic" | "idk"
export type FinanceStructure = "fully_joint" | "partially" | "separate"
export type FinanceManager = "i_do" | "partner" | "share_equally" | "not_defined"
export type GoalAlignment = "very_aligned" | "mostly_aligned" | "somewhat_aligned" | "rarely_aligned" | "not_at_all"
export type FinancialPriority =
  | "pay_off_debt"
  | "build_emergency_fund"
  | "save_for_home"
  | "invest_for_retirement"
  | "grow_wealth"
  | "save_for_family"
  | "travel_experiences"
  | "financial_freedom"
  | "other"
export type DiscussionFrequency = "weekly" | "monthly" | "occasionally" | "rarely" | "almost_never"
export type ConversationFeeling =
  | "easy_productive"
  | "somewhat_tense"
  | "one_sided"
  | "emotionally_charged"
  | "we_avoid_them"
export type RelationshipDuration =
  | "less_than_1yr"
  | "1_to_3yr"
  | "4_to_7yr"
  | "8_to_15yr"
  | "16_to_25yr"
  | "25_plus_yr"
export type ReflectionFeeling = "very_positive" | "positive" | "neutral" | "uneasy" | "concerned"
export type ShapeId = "circle" | "square" | "triangle" | "squiggle"

export interface SurveyAnswers {
  // Step 1
  q5_nickname: string
  q6_partner_type: PartnerType
  q7_relationship_duration: RelationshipDuration
  // Step 2
  q8_finance_structure: FinanceStructure
  q9_finance_manager: FinanceManager
  q10_satisfaction: number
  // Step 3
  q11_save_vs_yolo: string
  q12_my_money_style: MoneyStyle
  q13_partner_money_style: MoneyStyle
  q14_shape_ranking: ShapeId[]
  q15_learning_style: LearningStyle
  // Step 4
  q16_goal_alignment: GoalAlignment
  q17_financial_priority: FinancialPriority
  q17_other_priority?: string
  // Step 5
  q19_joy_spending_moment: string
  q20_discussion_frequency: DiscussionFrequency
  q21_conversation_feeling: ConversationFeeling
  q22_biggest_challenge: string
  q23_biggest_win: string
  // Step 6
  q_reflection_feeling: ReflectionFeeling
  q_discuss_with_partner: string
}
