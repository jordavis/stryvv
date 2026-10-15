import { cn } from "@/lib/utils"
import { AlertIcon } from "./text-field"

/** The card that holds each sign-up / sign-in step, with a title and one line under it. */
export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        "flex w-full flex-col gap-4 rounded-sv-lg border border-sv-border bg-sv-surface p-5 shadow-sv-card sm:p-6",
        className
      )}
    >
      <div className="mb-1 flex flex-col gap-1.5 text-center">
        <h1 className="font-sv-display text-2xl font-bold leading-[30px] tracking-[-0.01em] text-balance">{title}</h1>
        {subtitle ? <p className="text-[15px] leading-[22px] text-sv-ink-muted">{subtitle}</p> : null}
      </div>
      {children}
    </main>
  )
}

/** A message for the whole form: an error that isn't about one field, or a confirmation. */
export function FormMessage({ tone = "error", children }: { tone?: "error" | "info"; children: React.ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-sv-sm px-3 py-2.5 text-sm",
        tone === "error" ? "bg-sv-danger-soft text-sv-danger" : "bg-sv-teal-soft text-sv-teal-deep"
      )}
    >
      {tone === "error" ? <AlertIcon /> : null}
      <span>{children}</span>
    </p>
  )
}
