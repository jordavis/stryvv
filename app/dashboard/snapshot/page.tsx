import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SnapshotViewer } from "@/components/dashboard/SnapshotViewer"

export default async function SnapshotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single()

  if (!profile?.household_id) redirect("/onboarding")

  // Count how many household members have completed the survey
  const { data: surveyResponses } = await supabase
    .from("survey_responses")
    .select("user_id")
    .eq("household_id", profile.household_id)

  const surveyCount = surveyResponses?.length ?? 0

  // Only fetch snapshot if both partners have completed surveys
  let snapshotContent: string | null = null
  if (surveyCount >= 2) {
    const { data: snapshot } = await supabase
      .from("snapshots")
      .select("content")
      .eq("household_id", profile.household_id)
      .single()
    snapshotContent = snapshot?.content ?? null
  }

  return (
    <div className="h-full overflow-y-auto">
      <SnapshotViewer
        content={snapshotContent}
        surveyCount={surveyCount}
        householdId={profile.household_id}
      />
    </div>
  )
}
