import { cn } from "@/lib/utils"

/** "STEP 1 OF 3", the step title, the current topic ("Money history · 2/4"), progress and Skip. */
export function StepHeader({
  stepNumber,
  title,
  topic,
  progress,
  onSkip,
  skipping = false,
}: {
  stepNumber: 1 | 2 | 3
  title: string
  topic?: string
  /** 0–1 through the whole onboarding. */
  progress: number
  onSkip: () => void
  skipping?: boolean
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-sv-border bg-sv-surface px-4 pt-4 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">Step {stepNumber} of 3</p>
          <h2 className="font-sv-display text-xl font-bold leading-7 tracking-[-0.01em]">{title}</h2>
          {topic ? <p className="text-sm text-sv-ink-muted">{topic}</p> : null}
        </div>
        <button
          type="button"
          onClick={onSkip}
          disabled={skipping}
          className={cn(
            "flex-none rounded-sv-sm px-2 py-1.5 text-sm font-semibold text-sv-teal-deep hover:bg-sv-teal-soft",
            "focus-visible:outline-2 focus-visible:outline-sv-teal disabled:text-sv-ink-faint"
          )}
        >
          {skipping ? "Skipping…" : "Skip for now"}
        </button>
      </div>
      <div
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="h-1.5 overflow-hidden rounded-full bg-sv-surface-sunken"
      >
        <div className="h-full rounded-full bg-sv-teal transition-[width] duration-500" style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </div>
    </header>
  )
}
