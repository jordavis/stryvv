"use server"

import { createClient } from "@/lib/supabase/server"
import { SURVEY_QUESTIONS } from "@/lib/constants/survey-questions"
import type { SurveyAnswers } from "@/lib/types/survey"
// TODO make this an environment variable
const WEBHOOK_URL = "https://jzpeterson.app.n8n.cloud/webhook/survey-analysis"

interface UserDataItem {
  question: string
  questionContextForAiAgent: string
  partner1Answer: string
  partner2Answer: string
}

function serializeAnswer(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

export async function sendSurveyAnalysis(
  householdId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch profiles in the household ordered by created_at ASC
    // First profile = partner1 (creator), second = partner2 (joiner)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, created_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true })

    if (profilesError) throw new Error(profilesError.message)
    if (!profiles || profiles.length < 2) {
      throw new Error("Both partners must be in the household before sending analysis")
    }

    const [partner1Profile, partner2Profile] = profiles

    // Fetch survey responses for both partners
    const { data: responses, error: responsesError } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("household_id", householdId)
      .in("user_id", [partner1Profile.id, partner2Profile.id])

    if (responsesError) throw new Error(responsesError.message)
    if (!responses || responses.length < 2) {
      throw new Error("Both partners must complete the survey before sending analysis")
    }

    const partner1Response = responses.find((r) => r.user_id === partner1Profile.id) as
      | (SurveyAnswers & { user_id: string })
      | undefined
    const partner2Response = responses.find((r) => r.user_id === partner2Profile.id) as
      | (SurveyAnswers & { user_id: string })
      | undefined

    if (!partner1Response || !partner2Response) {
      throw new Error("Could not match survey responses to partners")
    }

    const userData: UserDataItem[] = SURVEY_QUESTIONS.map(
      ({ fieldKey, question, questionContextForAiAgent }) => ({
        question,
        questionContextForAiAgent,
        partner1Answer: serializeAnswer(partner1Response[fieldKey]),
        partner2Answer: serializeAnswer(partner2Response[fieldKey]),
      })
    )

    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userData }),
    })

    if (!res.ok) {
      throw new Error(`Webhook responded with status ${res.status}`)
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[sendSurveyAnalysis]", message)
    return { success: false, error: message }
  }
}
