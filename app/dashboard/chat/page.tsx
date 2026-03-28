import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/dashboard/ChatInterface"

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user.id)
    .single()

  if (!profile?.household_id) redirect("/onboarding")

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: true })
    .limit(50)

  const initialMessages = (messages ?? []).map((m) => ({
    id: m.id as string,
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }))

  return <ChatInterface initialMessages={initialMessages} />
}
