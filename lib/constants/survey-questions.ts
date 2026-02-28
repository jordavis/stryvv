import type { SurveyAnswers } from "@/lib/types/survey"

export interface SurveyQuestion {
  fieldKey: keyof SurveyAnswers
  question: string
  questionContextForAiAgent: string
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    fieldKey: "q5_nickname",
    question: "What should we call you?",
    questionContextForAiAgent: "Preferred nickname. Used for personalization in coaching.",
  },
  {
    fieldKey: "q6_partner_type",
    question: "My partner is my…",
    questionContextForAiAgent: "Relationship label (husband/wife). Used to personalize language.",
  },
  {
    fieldKey: "q7_relationship_duration",
    question: "How long have you been together?",
    questionContextForAiAgent:
      "Relationship length. Provides context for alignment expectations.",
  },
  {
    fieldKey: "q8_finance_structure",
    question: "How do you handle money as a couple?",
    questionContextForAiAgent:
      "Whether finances are joint, partially combined, or separate. Key structural indicator.",
  },
  {
    fieldKey: "q9_finance_manager",
    question: "Who manages the day-to-day finances?",
    questionContextForAiAgent:
      "Who bears responsibility for daily money management. Highlights imbalances.",
  },
  {
    fieldKey: "q10_satisfaction",
    question: "How satisfied are you with how you manage money together?",
    questionContextForAiAgent:
      "1–5 satisfaction rating. Key indicator of alignment tension or harmony.",
  },
  {
    fieldKey: "q11_save_vs_yolo",
    question: "When it comes to spending, which are you?",
    questionContextForAiAgent: "Core spending personality: saver, spender, or balanced.",
  },
  {
    fieldKey: "q12_my_money_style",
    question: "My money personality is…",
    questionContextForAiAgent:
      "Self-identified archetype (optimizer, dreamer, worrier, avoider).",
  },
  {
    fieldKey: "q13_partner_money_style",
    question: "My partner's money personality is…",
    questionContextForAiAgent:
      "Perception of partner's archetype. Compare with partner's q12 to find perception gaps.",
  },
  {
    fieldKey: "q14_shape_ranking",
    question: "Rank these shapes from most to least like your personality",
    questionContextForAiAgent:
      "Projective personality ranking (circle, square, triangle, squiggle).",
  },
  {
    fieldKey: "q15_learning_style",
    question: "How do you best learn new information?",
    questionContextForAiAgent:
      "Preferred learning modality. Tailors how coaching content is delivered.",
  },
  {
    fieldKey: "q16_goal_alignment",
    question: "How aligned are you and your partner on financial goals?",
    questionContextForAiAgent:
      "Self-reported goal alignment. Cross-reference to identify perception gaps.",
  },
  {
    fieldKey: "q17_financial_priority",
    question: "What's your biggest financial priority right now?",
    questionContextForAiAgent:
      "Top financial priority. Compare with partner's to identify convergence or conflict.",
  },
  {
    fieldKey: "q18_favorite_treat",
    question: "What's your favorite little treat or splurge?",
    questionContextForAiAgent:
      "Small personal indulgence. Reveals values around reward and spending guilt.",
  },
  {
    fieldKey: "q19_joy_spending_moment",
    question: "Describe a time spending money brought you real joy",
    questionContextForAiAgent:
      "Positive spending narrative. Reveals what the user values emotionally about money.",
  },
  {
    fieldKey: "q20_discussion_frequency",
    question: "How often do you talk about money with your partner?",
    questionContextForAiAgent:
      "Money conversation frequency. Low frequency may indicate avoidance.",
  },
  {
    fieldKey: "q21_conversation_feeling",
    question: "How do money conversations usually feel?",
    questionContextForAiAgent:
      "Emotional tone of money conversations. Cross-reference partner's answer.",
  },
  {
    fieldKey: "q22_biggest_challenge",
    question: "What's your biggest financial challenge as a couple?",
    questionContextForAiAgent:
      "Main financial pain point. Rich qualitative data for coaching focus areas.",
  },
  {
    fieldKey: "q23_biggest_win",
    question: "What's your biggest financial win as a couple?",
    questionContextForAiAgent:
      "Shared financial success. Reveals strengths and reinforcement opportunities.",
  },
  {
    fieldKey: "q_reflection_feeling",
    question: "Reflecting on your financial life together, how do you feel?",
    questionContextForAiAgent:
      "Holistic emotional wellbeing indicator about their financial life.",
  },
  {
    fieldKey: "q_discuss_with_partner",
    question: "What's one thing you'd most like to discuss with your partner?",
    questionContextForAiAgent:
      "Top unresolved financial topic. High-priority input for coaching session planning.",
  },
  {
    fieldKey: "q_missed_question",
    question: "Anything we should have asked but didn't?",
    questionContextForAiAgent:
      "Open-ended catch-all. May surface blind spots not captured elsewhere.",
  },
]

// O(1) lookup for use in survey step form Labels
export const QUESTION_BY_KEY = Object.fromEntries(
  SURVEY_QUESTIONS.map(({ fieldKey, question }) => [fieldKey, question])
) as Record<keyof SurveyAnswers, string>
