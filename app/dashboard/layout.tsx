import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
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

  if (!profile?.household_id) redirect("/onboarding")

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar firstName={profile.first_name ?? ""} />
      <main className="flex-1 overflow-hidden min-w-0">{children}</main>
    </div>
  )
}
