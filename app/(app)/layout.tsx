import { redirect } from "next/navigation"
import { AppShell } from "@/components/app/app-shell"
import { recordTermsIfMissing } from "@/lib/auth/terms"
import { createClient } from "@/lib/supabase/server"

// Signed-in pages. The proxy also guards these; this check is the one that counts,
// because it runs next to the page and asks Supabase who the user is.
export default async function SignedInLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  await recordTermsIfMissing(supabase)

  return <AppShell>{children}</AppShell>
}
