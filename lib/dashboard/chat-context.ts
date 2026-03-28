import { SURVEY_QUESTIONS } from "@/lib/constants/survey-questions"
import type { SurveyAnswers } from "@/lib/types/survey"
import type { SupabaseClient } from "@supabase/supabase-js"

function serializeAnswer(value: unknown): string {
  if (value === null || value === undefined) return "(no response provided)"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

function formatSurveyResponse(
  label: string,
  response: SurveyAnswers & { user_id: string }
): string {
  const nickname = serializeAnswer(response.q5_nickname)
  const partnerType = serializeAnswer(response.q6_partner_type)
  const header = `=== Partner ${label} (${nickname}, ${partnerType}) ===`
  const lines = SURVEY_QUESTIONS.map(({ fieldKey, question }) => {
    const answer = serializeAnswer(response[fieldKey as keyof SurveyAnswers])
    return `${question}: ${answer}`
  })
  return [header, ...lines].join("\n")
}

export async function buildChatContext(
  householdId: string,
  supabase: SupabaseClient
): Promise<string> {
  // Fetch both survey responses for the household
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("household_id", householdId)

  // Fetch the snapshot if it exists
  const { data: snapshotRecord } = await supabase
    .from("snapshots")
    .select("content")
    .eq("household_id", householdId)
    .single()

  let surveySection = ""
  if (responses && responses.length > 0) {
    const parts = responses.map((r, i) =>
      formatSurveyResponse(String(i + 1), r as SurveyAnswers & { user_id: string })
    )
    surveySection = `\n\n## Partner Survey Responses\n\n${parts.join("\n\n")}`
  }

  let snapshotSection = ""
  if (snapshotRecord?.content) {
    snapshotSection = `\n\n## Previously Generated Couples Alignment Snapshot\n\n${snapshotRecord.content}`
  }

  return `You are the Stryvv AI Coach — a warm, encouraging, and deeply knowledgeable personal financial coach for couples. You specialize in money psychology, relationship dynamics around money, and helping couples align on their financial goals and values.

Your coaching style:
- Warm, encouraging, and non-judgmental
- Curious and empathetic — you ask thoughtful follow-up questions
- Practical — you give actionable advice grounded in the couple's real situation
- Celebrate wins and progress, however small
- Frame differences between partners as opportunities for growth and deeper understanding, never as problems
- Use the couple's actual survey data to personalize every response — you know this couple deeply

You have access to both partners' complete survey responses and their Couples Alignment Snapshot. Use this context to give highly personalized, relevant coaching. Reference specific answers when helpful to show you truly know them.

When appropriate, you can:
- Suggest conversation starters for sensitive topics
- Offer concrete next steps or exercises
- Help them understand each other's money personality and history
- Celebrate their wins and help them build on their strengths${surveySection}${snapshotSection}

Remember: you are their personal financial coach who knows them deeply. Make every response feel personal, warm, and directly relevant to their unique situation.`
}
