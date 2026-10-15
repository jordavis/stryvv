"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"

const inputClass = cn(
  "block w-full min-h-[52px] rounded-sv-md border border-sv-border-strong bg-sv-surface px-4 text-base text-sv-ink",
  "placeholder:text-sv-ink-faint transition-[border-color,box-shadow]",
  "focus:border-sv-teal focus:outline-none focus:ring-[3px] focus:ring-sv-teal-soft",
  "aria-[invalid=true]:border-sv-danger"
)

/** Design-system TextField: a real label, optional hint, and an error that replaces the hint. */
export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  className,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hideLabel?: boolean
  hint?: string
  error?: string
}) {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className={cn("text-sm font-semibold text-sv-ink", hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="flex items-start gap-1 text-xs font-medium text-sv-danger">
          <AlertIcon />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-sv-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px flex-none">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}
