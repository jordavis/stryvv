import { reopenStep } from "@/lib/actions/onboarding"
import type { StepId } from "@/lib/onboarding/steps"
import { cn } from "@/lib/utils"

/** A home module: a small-caps label, its content, and at most one call to action. */
export function ModuleCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-sv-lg border border-sv-border bg-sv-surface p-5 shadow-sv-card", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">{title}</h2>
      {children}
    </section>
  )
}

/** An empty module: what it's for, and one button that reopens the matching onboarding step. */
export function EmptyModule({ text, action, step }: { text: string; action: string; step: StepId }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-[15px] leading-[22px] text-sv-ink-muted">{text}</p>
      <form action={reopenStep}>
        <input type="hidden" name="step" value={step} />
        <button
          type="submit"
          className="rounded-sv-md bg-sv-teal-soft px-4 py-2.5 text-sm font-semibold text-sv-teal-deep hover:bg-sv-teal hover:text-sv-on-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal"
        >
          {action}
        </button>
      </form>
    </div>
  )
}

export function ModuleError() {
  return <p className="text-sm text-sv-danger">Couldn&apos;t load this. Pull to refresh.</p>
}
