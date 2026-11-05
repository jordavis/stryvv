"use client"

import { useEffect, useRef } from "react"
import { MESSAGE_MAX } from "@/lib/onboarding/schemas"
import { cn } from "@/lib/utils"

/**
 * The message box: grows with the text, Enter sends (Shift+Enter for a new line), and Send is off
 * while the coach is replying. An optional one-tap shortcut sits underneath.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  busy,
  placeholder = "Type your answer…",
  shortcut,
  onShortcut,
  canSendEmpty = false,
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  busy: boolean
  placeholder?: string
  shortcut?: string
  onShortcut?: () => void
  /** Send is allowed with an empty box (e.g. when chips are selected). */
  canSendEmpty?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const canSend = !busy && (value.trim().length > 0 || canSendEmpty)

  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSend) onSend()
        }}
      >
        <label htmlFor="onboarding-message" className="sr-only">
          Your message
        </label>
        <textarea
          id="onboarding-message"
          ref={ref}
          rows={1}
          value={value}
          maxLength={MESSAGE_MAX}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              if (canSend) onSend()
            }
          }}
          className={cn(
            "min-h-[48px] flex-1 resize-none rounded-sv-md border border-sv-border-strong bg-sv-surface px-4 py-3 text-base leading-6 text-sv-ink",
            "placeholder:text-sv-ink-faint focus:border-sv-teal focus:outline-none focus:ring-[3px] focus:ring-sv-teal-soft"
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className={cn(
            "flex size-12 flex-none items-center justify-center rounded-sv-md bg-sv-teal text-sv-on-teal transition-colors hover:bg-sv-teal-deep",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal",
            "disabled:cursor-not-allowed disabled:bg-sv-surface-sunken disabled:text-sv-ink-faint"
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
      {shortcut && onShortcut ? (
        <button
          type="button"
          onClick={onShortcut}
          disabled={busy}
          className="self-start rounded-sv-sm px-1 py-1 text-sm font-semibold text-sv-teal-deep hover:underline disabled:text-sv-ink-faint"
        >
          {shortcut}
        </button>
      ) : null}
    </div>
  )
}
