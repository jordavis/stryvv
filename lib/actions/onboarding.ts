"use server"

import { createClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export async function createHousehold() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // If already in a household, return existing invite code
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
