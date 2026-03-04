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

    // Fetch the household to get the creator (partner1)
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, created_by")
      .eq("id", householdId)
      .single()

    if (householdError) throw new Error(householdError.message)
    if (!household?.created_by) {
      throw new Error("Household creator not found")
    }

    // Fetch profiles in the household — the creator is partner1, the other is partner2
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId)

    if (profilesError) throw new Error(profilesError.message)
    if (!profiles || profiles.length < 2) {
      throw new Error("Both partners must be in the household before sending analysis")
    }

    const partner1Id = household.created_by
    const partner2Id = profiles.find((p) => p.id !== partner1Id)?.id
    if (!partner2Id) {
      throw new Error("Could not identify both partners")
    }

    // Fetch survey responses for both partners
    const { data: responses, error: responsesError } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("household_id", householdId)
      .in("user_id", [partner1Id, partner2Id])

    if (responsesError) throw new Error(responsesError.message)
    if (!responses || responses.length < 2) {
      throw new Error("Both partners must complete the survey before sending analysis")
    }

    const partner1Response = responses.find((r) => r.user_id === partner1Id) as
      | (SurveyAnswers & { user_id: string })
      | undefined
    const partner2Response = responses.find((r) => r.user_id === partner2Id) as
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
