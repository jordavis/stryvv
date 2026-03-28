import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { buildChatContext } from "@/lib/dashboard/chat-context"
import { z } from "zod"

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
})
const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
})

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

  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) return new Response("Invalid request", { status: 400 })
  const { messages } = parsed.data
  const systemPrompt = await buildChatContext(profile.household_id, supabase)

  // Persist the last user message
  const lastUserMsg = messages[messages.length - 1]
  if (lastUserMsg?.role === "user") {
    await supabase.from("chat_messages").insert({
      household_id: profile.household_id,
      user_id: user.id,
      role: "user",
      content: lastUserMsg.content,
    })
  }

  const householdId = profile.household_id
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
      await supabase.from("chat_messages").insert({
        household_id: householdId,
        user_id: userId,
        role: "assistant",
        content: text,
      })
    },
  })

  return result.toTextStreamResponse()
}
