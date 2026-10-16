import type { Metadata } from "next"
import { Logo } from "@/components/app/app-shell"
import { Button } from "@/components/app/button"
import { signOut } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Welcome | Stryvv" }

// The first signed-in page: a placeholder until the onboarding chat exists.
export default async function WelcomePage() {
  const supabase = await createClient()
  // RLS returns only the signed-in person's own profile.
  const { data: profile } = await supabase.from("profiles").select("first_name").maybeSingle()
  const firstName = profile?.first_name?.trim()

  return (
    <div className="flex flex-1 flex-col gap-10">
      <Logo />
      <main className="flex flex-1 flex-col justify-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">You&apos;re in</p>
        <h1 className="font-sv-display text-[32px] font-bold leading-[38px] tracking-[-0.02em] text-balance">
          {firstName ? `Welcome to Stryvv, ${firstName}.` : "Welcome to Stryvv."}
        </h1>
        <p className="text-base leading-6 text-sv-ink-muted">
          Your account is ready. Soon you&apos;ll start here by telling your coach your money story. We&apos;ll email you
          when it&apos;s ready.
        </p>
      </main>
      <form action={signOut}>
        <Button type="submit" variant="secondary" block>
          Sign out
        </Button>
      </form>
    </div>
  )
}
