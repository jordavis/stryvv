import { cn } from "@/lib/utils"
import { markdownToHtml } from "@/lib/dashboard/markdown"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white"
          style={{ backgroundColor: "#0b2545" }}
        >
          {content}
        </div>
      </div>
    )
  }

  const html = markdownToHtml(content)

  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Avatar */}
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: "#0b2545" }}
      >
        S
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-foreground bg-muted",
          "prose prose-sm max-w-none"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
