"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MessageBubble } from "@/components/dashboard/MessageBubble"
import { Button } from "@/components/ui/button"
import { Send, Archive } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

interface MoneyHistoryChatProps {
  initialMessages: ChatMessage[]
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

async function parseDataStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (text: string) => void
): Promise<string> {
  const decoder = new TextDecoder()
  let fullText = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n")

    for (const line of lines) {
      if (line.startsWith('0:"')) {
        const raw = line.slice(3, -1)
        try {
          const text = JSON.parse('"' + raw + '"')
          fullText += text
          onChunk(text)
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  return fullText
}

export function MoneyHistoryChat({ initialMessages }: MoneyHistoryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasStarted = messages.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(
    async (content: string, summarize = false) => {
      if (!content.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
      }

      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setInput("")
      setIsLoading(true)

      const assistantId = generateId()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ])

      try {
        const url = summarize
          ? "/api/money-history?summarize=true"
          : "/api/money-history"

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        })

        if (!response.ok) throw new Error("Request failed")

        if (!response.body) {
          throw new Error("No response from server")
        }
        const reader = response.body.getReader()
        const fullText = await parseDataStream(reader, (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          )
        })

        // If summary was generated, reload the page to show summary view
        if (
          fullText.includes("## Your Money History Summary") ||
          fullText.includes("**Your Money History Summary**")
        ) {
          setTimeout(() => window.location.reload(), 1500)
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  async function handleGenerateSummary() {
    sendMessage("I'm ready. Please generate my money history summary.", true)
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length
  const hasEnoughMessages = userMessageCount >= 3

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border bg-white">
        <h1 className="text-lg font-semibold text-foreground">Your Money History</h1>
        <p className="text-sm text-muted-foreground">
          A private, guided exploration of how you grew up with money.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!hasStarted && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#0b2545" }}
            >
              <Archive className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold">Explore Your Money Story</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your relationship with money started long before you had any. Let&apos;s
              explore your childhood money experiences and the beliefs you carry today.
            </p>
            <Button
              onClick={() =>
                sendMessage("I'm ready to explore my money history.")
              }
              disabled={isLoading}
              className="mt-2"
              style={{ backgroundColor: "#0b2545" }}
            >
              Start My Money History
            </Button>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex items-start gap-3 mb-4">
            <div
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#0b2545" }}
            >
              S
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="flex gap-1 items-center text-sm text-muted-foreground">
                Stryvv is thinking
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Generate Summary CTA */}
      {hasEnoughMessages && hasStarted && (
        <div className="shrink-0 px-6 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isLoading}
            className="w-full text-sm"
          >
            ✨ Generate my Money History Summary
          </Button>
        </div>
      )}

      {/* Input */}
      {hasStarted && (
        <div className="shrink-0 px-6 py-4 border-t border-border bg-white">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground min-h-[48px] max-h-[160px] overflow-y-auto"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-12 w-12 p-0 rounded-xl"
              style={{ backgroundColor: "#0b2545" }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            This conversation is private to you.
          </p>
        </div>
      )}
    </div>
  )
}
