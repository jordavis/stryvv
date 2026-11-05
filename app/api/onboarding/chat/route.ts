import { anthropic, type AnthropicProviderOptions } from "@ai-sdk/anthropic"
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  Output,
  stepCountIs,
  streamText,
  tool,
  type ModelMessage,
} from "ai"
import { after } from "next/server"
import { z } from "zod"
import {
  followUpsLeft,
  formatPointer,
  isReview,
  messagesForStep,
  mustAdvance,
  nextPointer,
  parsePointer,
  type Pointer,
} from "@/lib/onboarding/flow"
import { checkLimits } from "@/lib/onboarding/limits"
import type { OnboardingUIMessage } from "@/lib/onboarding/messages"
import { buildSystemPrompt, nextTopicBrief } from "@/lib/onboarding/prompts"
import { chatRequestSchema, proposeGoalsSchema, proposeMoneyHistorySchema, type Drafts } from "@/lib/onboarding/schemas"
import { createClient } from "@/lib/supabase/server"

// POST /api/onboarding/chat: the coach's side of the onboarding chat
// (spec: docs/work/2026-10-16-onboarding-chat/spec.md).
//
// The request carries only the new message, the conversation id and the person's draft cards. The
// server checks who is signed in, loads this step's history itself through the session client (RLS),
// saves the person's message before calling the model, and saves the reply when it finishes.
//
// The server owns the sequence. After three answers in a topic, or the "nothing comes to mind"
// shortcut, it moves on itself and tells the coach what to ask. Before that, the coach may move on
// early by calling next_topic. At a step's end the server asks the model for the review cards as
// structured output and sends them to the screen as a `data-proposal` part; nothing is saved until
// the person confirms them.

export const maxDuration = 60

/** The coach model. Swap for "claude-haiku-5-5" if measured cost runs over budget (plan.md). */
const MODEL = "claude-sonnet-5-5"
/** This model always thinks; thinking counts toward the cap, so the cap allows for it. Replies stay short through the prompt. */
const MAX_REPLY_TOKENS = 1200
const MAX_REVIEW_TOKENS = 4000
const PROVIDER_OPTIONS = { anthropic: { effort: "low" } satisfies AnthropicProviderOptions }

type Supabase = Awaited<ReturnType<typeof createClient>>
type Usage = { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number }

function plain(message: string, status: number) {
  return new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } })
}

/** Ids, flow and token counts only: never message content (data-security rule 6). */
function logUsage(details: Record<string, unknown>, usage: Usage) {
  console.info("onboarding_chat_usage", {
    ...details,
    model: MODEL,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cachedInputTokens: usage.cachedInputTokens,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return plain("Please sign in again.", 401)

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return plain("Something went wrong. Try again.", 400)
  const { conversationId, intent, text, shortcut = false, drafts } = parsed.data

  // RLS returns the conversation only if it's the signed-in person's own.
  const [{ data: conversation, error: conversationError }, { data: profile }] = await Promise.all([
    supabase.from("conversations").select("id, topic").eq("id", conversationId).eq("kind", "onboarding").maybeSingle(),
    supabase.from("profiles").select("first_name").maybeSingle(),
  ])
  if (conversationError) {
    console.error("onboarding_chat_error", { stage: "load", code: conversationError.code })
    return plain("Something went wrong. Try again.", 500)
  }
  if (!conversation) return plain("This chat couldn't be found.", 404)
  const pointer = parsePointer(conversation.topic)
  if (!pointer) return plain("This step is already finished.", 409)

  if (intent === "message" && text) {
    const since = new Date(Date.now() - 60_000).toISOString()
    const [inConversation, lastMinute] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation.id)
        .eq("role", "user"),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("role", "user")
        .gte("created_at", since),
    ])
    const limit = checkLimits({ inConversation: inConversation.count ?? 0, lastMinute: lastMinute.count ?? 0 })
    if (!limit.ok) return plain(limit.message, 429)

    // Saved before the model is called, so it's never lost.
    const { error } = await supabase.from("messages").insert({ conversation_id: conversation.id, role: "user", content: text })
    if (error) {
      console.error("onboarding_chat_error", { stage: "save_user", code: error.code })
      return plain("Couldn't send your message. Try again.", 500)
    }
  }

  const { data: rows, error: historyError } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })
    .limit(400)
  if (historyError || !rows) {
    console.error("onboarding_chat_error", { stage: "history", code: historyError?.code })
    return plain("Something went wrong. Try again.", 500)
  }

  const stored = rows as { role: "user" | "assistant"; content: string }[]
  const userMessages = stored.filter((r) => r.role === "user").length
  const messages: ModelMessage[] = messagesForStep(stored, pointer.stepStart).map((r) => ({ role: r.role, content: r.content }))
  // The API expects the conversation to start and end with the person. The step's opening and
  // the coach's last word are from the coach, so frame them.
  if (messages[0]?.role !== "user") messages.unshift({ role: "user", content: "(I've opened the chat.)" })
  if (messages.at(-1)?.role !== "user") messages.push({ role: "user", content: "(I'm back. Please carry on.)" })

  const firstName = profile?.first_name ?? ""
  const today = new Date().toISOString().slice(0, 10)

  if (isReview(pointer)) {
    return reviewResponse({ conversationId: conversation.id, pointer, firstName, today, messages, drafts })
  }

  // The server moves on after three answers or the shortcut; otherwise the coach may move on early.
  const forced = intent === "message" && mustAdvance(pointer, userMessages, shortcut)
  const state = { pointer: forced ? nextPointer(pointer, userMessages) : pointer, advanced: forced }

  const result = streamText({
    model: anthropic(MODEL),
    system: buildSystemPrompt({
      firstName,
      today,
      pointer,
      followUpsLeft: followUpsLeft(pointer, userMessages),
      moveOn: forced ? nextTopicBrief(state.pointer) : undefined,
    }),
    messages,
    tools: forced
      ? undefined
      : {
          next_topic: tool({
            description:
              "Move on to the next topic. Call it when you have a clear picture of the current topic, or the person wants to move on. It returns the next question to ask.",
            inputSchema: z.object({}),
            execute: async () => {
              if (!state.advanced) {
                state.pointer = nextPointer(state.pointer, userMessages)
                state.advanced = true
              }
              return nextTopicBrief(state.pointer)
            },
          }),
        },
    // After moving on, the coach just writes its reply: it can't skip another topic.
    prepareStep: () => (state.advanced ? { activeTools: [] } : undefined),
    stopWhen: stepCountIs(2),
    maxOutputTokens: MAX_REPLY_TOKENS,
    providerOptions: PROVIDER_OPTIONS,
    onFinish: async ({ steps, totalUsage }) => {
      const reply = steps
        .map((s) => s.text.trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 20_000)
      if (reply) {
        const { error } = await supabase.from("messages").insert({ conversation_id: conversation.id, role: "assistant", content: reply })
        if (error) console.error("onboarding_chat_error", { stage: "save_reply", code: error.code })
      }
      if (state.advanced) await savePointer(supabase, conversation.id, state.pointer)
      logUsage(
        { conversationId: conversation.id, step: pointer.step, topic: pointer.topic, intent, shortcut, forced, advanced: state.advanced },
        totalUsage
      )
    },
    onError: ({ error }) => {
      console.error("onboarding_chat_error", { stage: "model", name: error instanceof Error ? error.name : "unknown" })
    },
  })

  // Finish the reply (and save it) even if the person closes the app mid-stream.
  after(async () => {
    await result.consumeStream()
  })

  return result.toUIMessageStreamResponse<OnboardingUIMessage>({
    messageMetadata: ({ part }) => (part.type === "finish" ? { pointer: formatPointer(state.pointer) } : undefined),
    onError: () => "Something went wrong. Your message is saved; tap to try again.",
  })
}

async function savePointer(supabase: Supabase, conversationId: string, pointer: Pointer) {
  const { error } = await supabase.from("conversations").update({ topic: formatPointer(pointer) }).eq("id", conversationId)
  if (error) console.error("onboarding_chat_error", { stage: "save_pointer", code: error.code })
}

/**
 * The step's review cards, as structured output. They go to the screen as a `data-proposal` part
 * and aren't saved: on resume they're proposed again.
 */
function reviewResponse({
  conversationId,
  pointer,
  firstName,
  today,
  messages,
  drafts,
}: {
  conversationId: string
  pointer: Pointer
  firstName: string
  today: string
  messages: ModelMessage[]
  drafts?: Drafts
}) {
  const stream = createUIMessageStream<OnboardingUIMessage>({
    execute: async ({ writer }) => {
      const system = buildSystemPrompt({ firstName, today, pointer, followUpsLeft: 0, drafts })
      const common = { model: anthropic(MODEL), system, messages, maxOutputTokens: MAX_REVIEW_TOKENS, providerOptions: PROVIDER_OPTIONS }
      let proposal: Drafts
      let usage: Usage
      if (pointer.step === "story") {
        const result = await generateText({ ...common, output: Output.object({ schema: proposeMoneyHistorySchema }) })
        proposal = { kind: "money_history", entries: result.output.entries }
        usage = result.totalUsage
      } else {
        const result = await generateText({ ...common, output: Output.object({ schema: proposeGoalsSchema }) })
        proposal = { kind: "goals", vision: result.output.vision, goals: result.output.goals }
        usage = result.totalUsage
      }
      writer.write({ type: "start", messageMetadata: { pointer: formatPointer(pointer) } })
      writer.write({ type: "data-proposal", data: proposal })
      writer.write({ type: "finish", messageMetadata: { pointer: formatPointer(pointer) } })
      logUsage({ conversationId, step: pointer.step, topic: pointer.topic, intent: "review", corrections: Boolean(drafts) }, usage)
    },
    onError: (error) => {
      console.error("onboarding_chat_error", { stage: "review", name: error instanceof Error ? error.name : "unknown" })
      return "Couldn't gather what I heard. Tap to try again."
    },
  })
  return createUIMessageStreamResponse({ stream })
}
