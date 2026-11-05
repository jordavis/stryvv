// Database helpers for onboarding, used by the server actions and the chat route. Not a
// "use server" file: nothing here is callable from the browser. Every query uses the person's
// session client, so RLS applies.

import type { createClient } from "@/lib/supabase/server"
import { formatPointer, isStage, parsePointer, startOfStep, type OnboardingStage, type Pointer } from "./flow"
import { CHAT_STEPS, openingMessage, type ChatStepId } from "./steps"

export type Supabase = Awaited<ReturnType<typeof createClient>>

/** Stored in `conversations.topic` when no chat step is active (baseline, or onboarding finished). */
export const NO_CHAT_STEP = "none"

export type OnboardingState = {
  firstName: string
  stage: OnboardingStage
  conversation: { id: string; pointer: Pointer | null } | null
}

/** Logs an error by step and code only: never message content or personal details. */
export function logOnboardingError(step: string, error: { code?: string; message?: string } | null | undefined) {
  console.error("onboarding_error", { step, code: error?.code ?? "unknown" })
}

export async function loadOnboardingState(supabase: Supabase): Promise<OnboardingState> {
  // RLS returns only the signed-in person's own profile and conversations.
  const [{ data: profile }, { data: conversation }] = await Promise.all([
    supabase.from("profiles").select("first_name, onboarding_stage").maybeSingle(),
    supabase.from("conversations").select("id, topic").eq("kind", "onboarding").maybeSingle(),
  ])
  const stage = isStage(profile?.onboarding_stage) ? profile.onboarding_stage : "not_started"
  return {
    firstName: profile?.first_name?.trim() ?? "",
    stage,
    conversation: conversation ? { id: conversation.id, pointer: parsePointer(conversation.topic) } : null,
  }
}

export async function countUserMessages(supabase: Supabase, conversationId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "user")
  if (error) throw error
  return count ?? 0
}

/** Gets the person's onboarding conversation, creating it the first time. */
export async function ensureConversation(supabase: Supabase): Promise<{ id: string; topic: string | null }> {
  const existing = await supabase.from("conversations").select("id, topic").eq("kind", "onboarding").maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return existing.data

  const created = await supabase.from("conversations").insert({ kind: "onboarding" }).select("id, topic").single()
  if (!created.error) return created.data
  // Another tab created it first (one onboarding conversation per person).
  if (created.error.code === "23505") {
    const again = await supabase.from("conversations").select("id, topic").eq("kind", "onboarding").single()
    if (again.error) throw again.error
    return again.data
  }
  throw created.error
}

/**
 * Starts a chat step: points the conversation at its first topic and adds the coach's opening
 * message. Calling it again for a step that has just started does nothing, so a retry can't post
 * the opening twice.
 */
export async function enterChatStep(
  supabase: Supabase,
  conversation: { id: string; topic: string | null },
  step: ChatStepId,
  firstName: string
): Promise<void> {
  const { count: allMessages, error: countError } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversation.id)
  if (countError) throw countError
  const userMessages = await countUserMessages(supabase, conversation.id)
  const pointer = startOfStep(step, userMessages, allMessages ?? 0)
  if (conversation.topic === formatPointer(pointer)) return

  const { error: messageError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversation.id, role: "assistant", content: openingMessage(CHAT_STEPS[step], 0, firstName) })
  if (messageError) throw messageError

  await setPointer(supabase, conversation.id, formatPointer(pointer))
}

export async function setPointer(supabase: Supabase, conversationId: string, topic: string): Promise<void> {
  const { error } = await supabase.from("conversations").update({ topic }).eq("id", conversationId)
  if (error) throw error
}

export async function setStage(supabase: Supabase, userId: string, stage: OnboardingStage): Promise<void> {
  const { error } = await supabase.from("profiles").update({ onboarding_stage: stage }).eq("id", userId)
  if (error) throw error
}
