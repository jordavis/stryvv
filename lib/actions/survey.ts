"use server"

import { createClient } from "@/lib/supabase/server"
import type { SurveyAnswers } from "@/lib/types/survey"

export async function saveSurveyResponse(answers: Partial<SurveyAnswers>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("survey_responses").upsert(
    {
      user_id: user.id,
      ...answers,
      is_complete: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) throw error
}
