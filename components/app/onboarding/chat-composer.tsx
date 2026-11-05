"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { MESSAGE_MAX } from "@/lib/onboarding/schemas"
import { appendTranscript, TOO_LONG_MESSAGE } from "@/lib/voice/text"
import { cn } from "@/lib/utils"
import { useVoiceRecorder } from "./use-voice-recorder"
import { MicButton, RecordingBar, VoiceMessage } from "./voice-controls"

/**
 * The message box: grows with the text, Enter sends (Shift+Enter for a new line), and Send is off
 * while the coach is replying. The microphone records a voice answer whose transcript is added to
 * the box (never sent by itself). An optional one-tap shortcut sits underneath.
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
  const [tooLong, setTooLong] = useState(false)
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])

  const addTranscript = useCallback(
    (transcript: string) => {
      const { text, truncated } = appendTranscript(latest.current, transcript)
      onChange(text)
      setTooLong(truncated)
      // Focus the box with the cursor at the end, ready to check and send.
      requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      })
    },
    [onChange]
  )
  const voice = useVoiceRecorder({ onTranscript: addTranscript })
  const voiceActive = voice.status !== "idle"
  const voiceUnavailable =
    voice.problem?.kind === "unsupported" || voice.problem?.kind === "blocked" || voice.problem?.kind === "no-mic"

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const canSend = !busy && !voiceActive && (value.trim().length > 0 || canSendEmpty)

  return (
    <div className="flex flex-col gap-2">
      <VoiceMessage
        problem={voice.problem}
        notice={tooLong ? TOO_LONG_MESSAGE : voice.notice}
        onRetry={voice.retry}
        onDismiss={() => {
          voice.dismiss()
          setTooLong(false)
        }}
      />
      {voiceActive ? (
        <RecordingBar status={voice.status} seconds={voice.seconds} onStop={voice.stop} onCancel={voice.cancel} />
      ) : (
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
          <MicButton
            onClick={() => {
              setTooLong(false)
              void voice.start()
            }}
            disabled={busy}
            unavailable={voiceUnavailable}
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      )}
      {shortcut && onShortcut ? (
        <button
          type="button"
          onClick={onShortcut}
          disabled={busy || voiceActive}
          className="self-start rounded-sv-sm px-1 py-1 text-sm font-semibold text-sv-teal-deep hover:underline disabled:text-sv-ink-faint"
        >
          {shortcut}
        </button>
      ) : null}
    </div>
  )
}
