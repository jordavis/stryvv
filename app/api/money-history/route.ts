import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
})
const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
})

const MONEY_HISTORY_SYSTEM_PROMPT = `You are the Stryvv Money History Coach. Your role is to guide the user through a thoughtful, compassionate exploration of how they grew up with money — their childhood experiences, family attitudes, key formative moments, and the beliefs and habits they carry today.

Ask open-ended, empathetic questions one at a time. Do not rush. Explore topics like:
- What was money like in their household growing up?
- How did their parents talk about (or avoid talking about) money?
- What was their first memory of money?
- Did they ever feel anxious, safe, or confused about money as a child?
- What beliefs about money did they absorb that they carry today?

After 4-6 meaningful exchanges, if the user seems ready, offer to generate a bullet-point summary of their key money history insights. When they agree, produce a clear, empathetic bullet-point summary (8-12 points) capturing their core money story.

Begin by warmly welcoming the user and asking your first question.`

const SUMMARIZE_PROMPT = `Based on our conversation so far, please generate a thoughtful, empathetic summary of this person's money history.

Format it exactly as follows (use this exact heading):

## Your Money History Summary

Then provide 8-12 bullet points capturing:
- Key childhood money experiences and memories
- Family attitudes and beliefs about money they absorbed
- Emotional associations with money (safety, anxiety, abundance, scarcity)
- Formative moments that shaped their relationship with money
- Core money beliefs they carry today
- Strengths and patterns worth celebrating
- Areas of awareness for continued growth

Keep the tone warm, validating, and insightful. This summary will be shared with their partner to build mutual understanding.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single()

  if (!profile?.household_id) return new Response("No household", { status: 403 })

  const url = new URL(req.url)
  const summarize = url.searchParams.get("summarize") === "true"

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return new Response("Invalid request", { status: 400 })
  const { messages } = parsed.data

  const systemPrompt = summarize ? SUMMARIZE_PROMPT : MONEY_HISTORY_SYSTEM_PROMPT

  // Persist the last user message and update conversation
  const lastUserMsg = messages[messages.length - 1]
  if (lastUserMsg?.role === "user") {
    const { data: existing } = await supabase
      .from("money_histories")
      .select("id, conversation")
      .eq("user_id", user.id)
      .single()

    const existingConversation =
      (existing?.conversation as { role: string; content: string }[]) ?? []
    const updatedConversation = [
      ...existingConversation,
      { role: "user", content: lastUserMsg.content },
    ]

    if (existing) {
      await supabase
        .from("money_histories")
        .update({ conversation: updatedConversation, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
    } else {
      await supabase.from("money_histories").insert({
        user_id: user.id,
        household_id: profile.household_id,
        conversation: updatedConversation,
      })
    }
  }

  const userId = user.id

  const result = await streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.role === "user"
        ? `[USER MESSAGE: ${m.content}]`
        : m.content,
    })),
    onFinish: async ({ text }) => {
      const isSummary =
        summarize ||
        text.includes("## Your Money History Summary") ||
        text.includes("**Your Money History Summary**")

      const { data: existing } = await supabase
        .from("money_histories")
        .select("id, conversation")
        .eq("user_id", userId)
        .single()

      const existingConversation =
        (existing?.conversation as { role: string; content: string }[]) ?? []
      const updatedConversation = [
        ...existingConversation,
        { role: "assistant", content: text },
      ]

      if (existing) {
        await supabase
          .from("money_histories")
          .update({
            conversation: updatedConversation,
            ...(isSummary ? { summary: text, is_complete: true } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      } else {
        await supabase.from("money_histories").insert({
          user_id: userId,
          household_id: profile.household_id,
          conversation: updatedConversation,
          ...(isSummary ? { summary: text, is_complete: true } : {}),
        })
      }
    },
  })

  return result.toTextStreamResponse()
}
