"use server"

import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

/** Ensure a profile row exists for the current user. Silently no-ops if it already does. */
async function ensureProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; user_metadata: Record<string, string> }
) {
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      first_name: user.user_metadata?.first_name ?? "",
      last_name: user.user_metadata?.last_name ?? "",
    },
    { onConflict: "id", ignoreDuplicates: true }
  )
}

export async function createHousehold() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await ensureProfile(supabase, user)

  // If the profile is already linked to a household, return that invite code
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single()

  if (profile?.household_id) {
    const { data: household } = await supabase
      .from("households")
      .select("invite_code")
      .eq("id", profile.household_id)
      .single()
    return { inviteCode: household?.invite_code ?? "" }
  }

  // Guard against React Strict Mode double-invocation: if this user already
  // created a household (created_by), return it instead of creating a second one.
  const { data: existing } = await supabase
    .from("households")
    .select("id, invite_code")
    .eq("created_by", user.id)
    .limit(1)
    .single()

  if (existing) {
    // Link profile to the already-created household
    await supabase
      .from("profiles")
      .update({ household_id: existing.id })
      .eq("id", user.id)
    await supabase
      .from("survey_responses")
      .update({ household_id: existing.id })
      .eq("user_id", user.id)
    return { inviteCode: existing.invite_code }
  }

  // Create new household
  const inviteCode = nanoid(6).toUpperCase()
  const { data: household, error: hError } = await supabase
    .from("households")
    .insert({ invite_code: inviteCode, created_by: user.id })
    .select()
    .single()

  if (hError || !household) throw hError ?? new Error("Failed to create household")

  const { error: pError } = await supabase
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", user.id)

  if (pError) throw pError

  // Link survey response to household
  await supabase
    .from("survey_responses")
    .update({ household_id: household.id })
    .eq("user_id", user.id)

  return { inviteCode }
}

export async function joinHousehold(inviteCode: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await ensureProfile(supabase, user)

  // Find the household
  const { data: household, error: hError } = await supabase
    .from("households")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single()

  if (hError || !household) throw new Error("Invalid invite code")

  // Link profile to household
  const { error: pError } = await supabase
    .from("profiles")
    .update({ household_id: household.id })
    .eq("id", user.id)

  if (pError) throw pError

  // Link Person 2's survey response to the household.
  // Person 1's survey_response is already linked in createHousehold() under their
  // own session. Attempting to update it here would be silently blocked by RLS
  // (this user can only update rows where user_id = auth.uid()).
  await supabase
    .from("survey_responses")
    .update({ household_id: household.id })
    .eq("user_id", user.id)

  return { householdId: household.id }
}
