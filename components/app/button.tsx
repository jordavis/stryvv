import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "quiet"

const variants: Record<Variant, string> = {
  primary: "bg-sv-teal text-sv-on-teal hover:bg-sv-teal-deep",
  secondary: "border border-sv-border-strong bg-sv-surface text-sv-ink hover:bg-sv-surface-sunken",
  quiet: "bg-transparent text-sv-teal-deep hover:bg-sv-teal-soft",
}

/** Design-system Button. Use one primary per screen, verb-first labels ("Create account"). */
export function Button({
  variant = "primary",
  block = false,
  pending = false,
  pendingLabel,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  block?: boolean
  pending?: boolean
  pendingLabel?: string
}) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-sv-md px-5 text-base font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal",
        "disabled:cursor-not-allowed disabled:bg-sv-surface-sunken disabled:text-sv-ink-faint disabled:border-transparent",
        variants[variant],
        block && "w-full",
        className
      )}
      {...props}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}
