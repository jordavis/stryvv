"use client"

import { useEffect } from "react"
import { formatClock } from "@/lib/voice/recording"
import { cn } from "@/lib/utils"
import type { VoiceProblem, VoiceStatus } from "./use-voice-recorder"

const iconButton = cn(
  "flex size-12 flex-none items-center justify-center rounded-sv-md transition-colors",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal",
  "disabled:cursor-not-allowed disabled:text-sv-ink-faint"
)

/** The microphone next to Send. Dimmed (but still explains itself) when voice can't be used. */
export function MicButton({ onClick, disabled, unavailable }: { onClick: () => void; disabled: boolean; unavailable: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Answer by voice"
      className={cn(iconButton, "border border-sv-border-strong bg-sv-surface text-sv-teal-deep hover:bg-sv-surface-sunken", unavailable && "opacity-60")}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
      </svg>
    </button>
  )
}

/**
 * Takes the place of the text box while recording or transcribing, so the layout doesn't jump.
 * Escape cancels a recording. Elapsed time is announced every 30 seconds, not every second.
 */
export function RecordingBar({
  status,
  seconds,
  onStop,
  onCancel,
}: {
  status: VoiceStatus
  seconds: number
  onStop: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (status !== "recording") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [status, onCancel])

  const halfMinutes = Math.floor(seconds / 30)
  const spoken =
    status === "requesting"
      ? "Waiting for microphone access"
      : status === "transcribing"
        ? "Transcribing"
        : halfMinutes === 0
          ? "Recording"
          : `Recording, ${Math.floor((halfMinutes * 30) / 60)} minutes ${(halfMinutes * 30) % 60} seconds`

  return (
    <div className="flex items-center gap-2">
      <p className="sr-only" aria-live="polite">
        {spoken}
      </p>
      <div className="flex min-h-[48px] flex-1 items-center gap-3 rounded-sv-md border border-sv-border-strong bg-sv-surface px-4">
        {status === "transcribing" ? (
          <>
            <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-sv-teal border-t-transparent" />
            <span className="text-[15px] font-medium text-sv-ink">Transcribing…</span>
          </>
        ) : status === "requesting" ? (
          <span className="text-[15px] text-sv-ink-muted">Allow the microphone to start…</span>
        ) : (
          <>
            <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-sv-danger" />
            <span className="text-[15px] font-semibold text-sv-ink">Recording</span>
            <span className="ml-auto font-sv-display text-[15px] tabular-nums text-sv-ink-muted">{formatClock(seconds)}</span>
          </>
        )}
      </div>
      {status === "recording" ? (
        <>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel recording"
            className={cn(iconButton, "border border-sv-border-strong bg-sv-surface text-sv-ink-muted hover:bg-sv-surface-sunken")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop and transcribe"
            className={cn(iconButton, "bg-sv-teal text-sv-on-teal hover:bg-sv-teal-deep")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  )
}

/** A problem or notice about the last recording, with Retry when the same recording can be resent. */
export function VoiceMessage({
  problem,
  notice,
  onRetry,
  onDismiss,
}: {
  problem: VoiceProblem | null
  notice: string | null
  onRetry: () => void
  onDismiss: () => void
}) {
  const text = problem?.message ?? notice
  if (!text) return null
  const isError = problem?.kind === "failed"
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-center justify-between gap-3 rounded-sv-sm px-3 py-2 text-sm",
        isError ? "bg-sv-danger-soft text-sv-danger" : "bg-sv-teal-soft text-sv-teal-deep"
      )}
    >
      <span>{text}</span>
      <span className="flex flex-none gap-3">
        {problem?.canRetry ? (
          <button type="button" onClick={onRetry} className="font-semibold underline">
            Retry
          </button>
        ) : null}
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="font-semibold">
          ×
        </button>
      </span>
    </div>
  )
}
