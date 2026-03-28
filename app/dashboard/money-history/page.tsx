import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MoneyHistoryChat } from "@/components/dashboard/MoneyHistoryChat"
import { MoneyHistorySummary } from "@/components/dashboard/MoneyHistorySummary"

export default async function MoneyHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, household_id")
    .eq("id", user.id)
    .single()

  if (!profile?.household_id) redirect("/onboarding")

  // Fetch current user's money history
  const { data: myHistory } = await supabase
    .from("money_histories")
    .select("conversation, summary, is_complete")
    .eq("user_id", user.id)
    .single()

  if (myHistory?.is_complete && myHistory.summary) {
    // Fetch partner's profile and history (summary only)
    const { data: partnerProfiles } = await supabase
      .from("profiles")
      .select("id, first_name")
      .eq("household_id", profile.household_id)
      .neq("id", user.id)

    const partnerProfile = partnerProfiles?.[0] ?? null

    let partnerSummary: string | null = null
    if (partnerProfile) {
      const { data: partnerHistory } = await supabase
        .from("money_histories")
        .select("summary, is_complete")
        .eq("user_id", partnerProfile.id)
        .single()

      if (partnerHistory?.is_complete) {
        partnerSummary = partnerHistory.summary ?? null
      }
    }

    return (
      <div className="h-full overflow-y-auto">
        <MoneyHistorySummary
          mySummary={myHistory.summary}
          partnerName={partnerProfile?.first_name ?? ""}
          partnerSummary={partnerSummary}
        />
      </div>
    )
  }

  // Build initial messages from stored conversation
  type ConversationMessage = { role: string; content: string }
  const conversation = (myHistory?.conversation as ConversationMessage[] | null) ?? []
  const initialMessages = conversation
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

  return <MoneyHistoryChat initialMessages={initialMessages} />
}
