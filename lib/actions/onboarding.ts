"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { isReview, parsePointer, stageAfter, stepForStage } from "@/lib/onboarding/flow"
import { baselineAnswersSchema, saveGoalsSchema, saveMoneyHistorySchema } from "@/lib/onboarding/schemas"
import {
  ensureConversation,
  enterChatStep,
  loadOnboardingState,
  logOnboardingError,
  NO_CHAT_STEP,
  setPointer,
  setStage,
  type Supabase,
} from "@/lib/onboarding/server"
import type { StepId } from "@/lib/onboarding/steps"
import { createClient } from "@/lib/supabase/server"

// Onboarding actions (spec: docs/work/2026-10-16-onboarding-chat/spec.md). Each one checks who is
// signed in first, validates its input with Zod, and writes through the session client, so RLS
// limits every write to the person's own rows. Errors are logged by step and code only.

export type OnboardingActionResult = { ok: true } | { ok: false; message: string }

const OK: OnboardingActionResult = { ok: true }
const SIGNED_OUT: OnboardingActionResult = { ok: false, message: "Please sign in again." }
const SAVE_FAILED: OnboardingActionResult = { ok: false, message: "Couldn't save. Try again." }

const stepSchema = z.enum(["story", "baseline", "rich"])

async function signedIn(): Promise<{ supabase: Supabase; userId: string } | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? { supabase, userId: user.id } : null
}

/** Creates the onboarding conversation and opens the current chat step, if that hasn't happened yet. */
export async function startOnboarding(): Promise<OnboardingActionResult> {
  const ctx = await signedIn()
  if (!ctx) return SIGNED_OUT
  const { supabase, userId } = ctx
  try {
    const state = await loadOnboardingState(supabase)
    const step = stepForStage(state.stage)
    if (step === null) return OK
    const conversation = await ensureConversation(supabase)
    if (step !== "baseline" && parsePointer(conversation.topic)?.step !== step) {
      await enterChatStep(supabase, conversation, step, state.firstName)
    }
    if (state.stage === "not_started") await setStage(supabase, userId, "money_story")
    return OK
  } catch (error) {
    logOnboardingError("start", error as { code?: string })
    return { ok: false, message: "Something went wrong. Try again." }
  }
}

/** Saves the confirmed money-history cards (step 1), then moves on. */
export async function saveMoneyHistory(input: unknown): Promise<OnboardingActionResult> {
  const ctx = await signedIn()
  if (!ctx) return SIGNED_OUT
  const parsed = saveMoneyHistorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Check the cards and try again." }
  const { supabase, userId } = ctx
  const { conversationId, entries } = parsed.data
  try {
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id, topic")
      .eq("id", conversationId)
      .eq("kind", "onboarding")
      .maybeSingle()
    if (error) throw error
    if (!conversation) return SAVE_FAILED
    const pointer = parsePointer(conversation.topic)
    // Only the step's review can be saved. Anything else means it was already saved (a retry).
    if (!pointer || pointer.step !== "story" || !isReview(pointer)) return OK

    if (entries.length > 0) {
      const { error: insertError } = await supabase.from("money_history_entries").insert(
        entries.map((e) => ({
          kind: e.kind,
          title: e.title,
          description: e.description || null,
          attributes: e.attributes,
          source_conversation_id: conversation.id,
        }))
      )
      if (insertError) throw insertError
    }

    await setPointer(supabase, conversation.id, NO_CHAT_STEP)
    const state = await loadOnboardingState(supabase)
    const next = stageAfter(state.stage, "story")
    if (next !== state.stage) await setStage(supabase, userId, next)
    return OK
  } catch (error) {
    logOnboardingError("save_money_history", error as { code?: string })
    return SAVE_FAILED
  }
}

/** Saves the Stryvv Score baseline (step 2) through record_baseline, which saves it all or nothing. */
export async function saveBaseline(input: unknown): Promise<OnboardingActionResult> {
  const ctx = await signedIn()
  if (!ctx) return SIGNED_OUT
  const parsed = baselineAnswersSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Answer every question, then try again." }
  const { supabase, userId } = ctx
  try {
    const { error } = await supabase.rpc("record_baseline", { answers: parsed.data })
    // A baseline that already exists means an earlier attempt saved it: carry on.
    if (error && !error.message.includes("baseline_exists")) throw error

    const state = await loadOnboardingState(supabase)
    const next = stageAfter(state.stage, "baseline")
    if (next !== state.stage) {
      await setStage(supabase, userId, next)
      if (next === "rich_life") {
        const conversation = await ensureConversation(supabase)
        await enterChatStep(supabase, conversation, "rich", state.firstName)
      }
    }
    return OK
  } catch (error) {
    logOnboardingError("save_baseline", error as { code?: string })
    return { ok: false, message: "Couldn't save your answers. Try again." }
  }
}

/** Saves the rich-life vision and the confirmed goals (step 3), which finishes onboarding. */
export async function saveGoals(input: unknown): Promise<OnboardingActionResult> {
  const ctx = await signedIn()
  if (!ctx) return SIGNED_OUT
  const parsed = saveGoalsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Check the cards and try again." }
  const { supabase, userId } = ctx
  const { conversationId, vision, goals } = parsed.data
  try {
    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("id, topic")
      .eq("id", conversationId)
      .eq("kind", "onboarding")
      .maybeSingle()
    if (error) throw error
    if (!conversation) return SAVE_FAILED
    const pointer = parsePointer(conversation.topic)
    if (!pointer || pointer.step !== "rich" || !isReview(pointer)) return OK

    if (goals.length > 0) {
      const { error: insertError } = await supabase.from("goals").insert(
        goals.map((g) => ({
          title: g.title,
          why: g.why || null,
          target_amount: g.targetAmount,
          target_date: g.targetDate,
          source_conversation_id: conversation.id,
        }))
      )
      if (insertError) throw insertError
    }
    if (vision) {
      const { error: visionError } = await supabase.from("profiles").update({ rich_life_vision: vision }).eq("id", userId)
      if (visionError) throw visionError
    }

    await setPointer(supabase, conversation.id, NO_CHAT_STEP)
    const state = await loadOnboardingState(supabase)
    const next = stageAfter(state.stage, "rich")
    if (next !== state.stage) await setStage(supabase, userId, next)
    return OK
  } catch (error) {
    logOnboardingError("save_goals", error as { code?: string })
    return SAVE_FAILED
  }
}

/** "Skip for now": saves nothing and moves to the next step (or closes a step reopened from home). */
export async function skipStep(step: StepId): Promise<OnboardingActionResult> {
  const ctx = await signedIn()
  if (!ctx) return SIGNED_OUT
  const parsedStep = stepSchema.safeParse(step)
  if (!parsedStep.success) return { ok: false, message: "Something went wrong. Try again." }
  const { supabase, userId } = ctx
  try {
    const state = await loadOnboardingState(supabase)
    const conversation = await ensureConversation(supabase)
    if (parsePointer(conversation.topic)?.step === parsedStep.data) {
      await setPointer(supabase, conversation.id, NO_CHAT_STEP)
    }
    const next = stageAfter(state.stage, parsedStep.data)
    if (next !== state.stage) {
      await setStage(supabase, userId, next)
      if (next === "rich_life") await enterChatStep(supabase, { ...conversation, topic: NO_CHAT_STEP }, "rich", state.firstName)
    }
    return OK
  } catch (error) {
    logOnboardingError("skip", error as { code?: string })
    return { ok: false, message: "Something went wrong. Try again." }
  }
}

/** Reopens a step from a home empty state ("Set a goal with Stryvv", "Take your baseline"…). */
export async function reopenStep(formData: FormData): Promise<void> {
  const ctx = await signedIn()
  if (!ctx) redirect("/login")
  const parsedStep = stepSchema.safeParse(formData.get("step"))
  if (!parsedStep.success) redirect("/home")
  const step = parsedStep.data
  const { supabase } = ctx
  if (step !== "baseline") {
    try {
      const state = await loadOnboardingState(supabase)
      const conversation = await ensureConversation(supabase)
      if (parsePointer(conversation.topic)?.step !== step) {
        await enterChatStep(supabase, conversation, step, state.firstName)
      }
    } catch (error) {
      logOnboardingError("reopen", error as { code?: string })
      redirect("/home")
    }
  }
  redirect(`/home?step=${step}`)
}
