import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingClient } from "@/components/onboarding/OnboardingClient"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
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

  if (profile?.household_id) redirect("/dashboard")

  const { invite } = await searchParams

  return <OnboardingClient firstName={profile?.first_name ?? ""} inviteCode={invite ?? null} />
}
