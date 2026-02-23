import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingClient } from "@/components/onboarding/OnboardingClient"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single()

  return <OnboardingClient firstName={profile?.first_name ?? ""} />
}
