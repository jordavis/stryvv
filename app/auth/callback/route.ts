import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/onboarding"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if profile already exists (e.g. returning user via password reset)
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!existing) {
          // Create profile from name set during signup
          const meta = user.user_metadata
          const { error: profileError } = await supabase.from("profiles").insert({
            id: user.id,
            first_name: meta?.first_name ?? "",
            last_name: meta?.last_name ?? "",
          })
          if (profileError) {
            console.error("[auth/callback] profile insert failed:", profileError)
          }
        }

        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
