"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { AlertIcon } from "./text-field"

/**
 * Design-system CodeInput: one large field for the 6-digit email code. One field (not six boxes)
 * so pasting and the phone's one-time-code autofill both just work.
 */
export function CodeInput({
  error,
  className,
  name = "code",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { error?: string }) {
  const id = useId()
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="sr-only">
        6-digit code
      </label>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        placeholder="000000"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "block w-full min-h-[64px] rounded-sv-md border border-sv-border-strong bg-sv-surface text-center",
          "font-sv-display text-[28px] font-bold tracking-[0.4em] tabular-nums text-sv-ink placeholder:text-sv-border-strong",
          "focus:border-sv-teal focus:outline-none focus:ring-[3px] focus:ring-sv-teal-soft",
          "aria-[invalid=true]:border-sv-danger"
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="flex items-start justify-center gap-1 text-sm font-medium text-sv-danger">
          <AlertIcon />
          {error}
        </p>
      ) : null}
    </div>
  )
}
