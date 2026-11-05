import { markdownToHtml } from "@/lib/markdown"
import { cn } from "@/lib/utils"

/**
 * One chat message. The coach's text is model output, so it's rendered through markdownToHtml,
 * which escapes HTML first (data-security rule 7). The person's own text is shown as plain text.
 */
export function ChatBubble({ role, text, children }: { role: "user" | "assistant"; text?: string; children?: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-sv-md rounded-br-sv-sm bg-sv-teal px-4 py-2.5 text-[15px] leading-[22px] text-sv-on-teal">
          {text}
        </p>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[90%] rounded-sv-md rounded-bl-sv-sm border border-sv-border bg-sv-surface px-4 py-2.5 text-[15px] leading-[22px] text-sv-ink",
          "[&_em]:text-sv-ink-muted [&_p+p]:mt-2"
        )}
      >
        {text !== undefined ? <div dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }} /> : children}
      </div>
    </div>
  )
}

/** The coach is typing. */
export function TypingBubble() {
  return (
    <div className="flex justify-start" aria-live="polite">
      <div className="flex items-center gap-1 rounded-sv-md rounded-bl-sv-sm border border-sv-border bg-sv-surface px-4 py-3.5">
        <span className="sr-only">Your coach is typing</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-sv-ink-faint"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
