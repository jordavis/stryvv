import type { createClient } from "@/lib/supabase/server"
import { TERMS_VERSION } from "@/lib/terms"

type Supabase = Awaited<ReturnType<typeof createClient>>

/**
 * Records the terms version for a signed-in person whose profile doesn't have one yet.
 * Everyone with an account ticked the terms box at sign-up (the cutover removed every older
 * account), so this only catches up when accept_terms() failed after the code was verified.
 */
export async function recordTermsIfMissing(supabase: Supabase) {
  // RLS returns only the signed-in person's own profile.
  const { data: profile, error } = await supabase.from("profiles").select("terms_version").maybeSingle()
  if (error || !profile || profile.terms_version) return
  const { error: termsError } = await supabase.rpc("accept_terms", { _version: TERMS_VERSION })
  if (termsError) console.error("[auth] accept_terms catch-up failed", { code: termsError.code ?? "unknown" })
}
