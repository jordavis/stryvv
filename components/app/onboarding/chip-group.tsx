"use client"

import { cn } from "@/lib/utils"

/** Answer chips: tap any number of them, type instead, or both. */
export function ChipGroup({
  chips,
  selected,
  onToggle,
  disabled = false,
}: {
  chips: string[]
  selected: string[]
  onToggle: (chip: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-sv-ink-muted">Tap any that apply, or just type below.</p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const on = selected.includes(chip)
          return (
            <button
              key={chip}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(chip)}
              className={cn(
                "min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal",
                on
                  ? "border-sv-teal bg-sv-teal-soft text-sv-teal-deep"
                  : "border-sv-border-strong bg-sv-surface text-sv-ink hover:bg-sv-surface-sunken"
              )}
            >
              {chip}
            </button>
          )
        })}
      </div>
    </div>
  )
}
