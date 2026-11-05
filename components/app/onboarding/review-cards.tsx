"use client"

import { useId, useState } from "react"
import { formatGoalDetails } from "@/lib/onboarding/format"
import type { GoalCard, MoneyHistoryCard } from "@/lib/onboarding/schemas"
import { cn } from "@/lib/utils"

// "Check these before we save them": each thing the coach heard, as a card the person can edit,
// add a note to, or remove. Model output is shown as plain text only.

const KIND_LABELS: Record<MoneyHistoryCard["kind"], string> = {
  memory: "Memory",
  belief: "Belief",
  pattern: "Pattern",
  win: "Win",
}

const fieldClass = cn(
  "w-full rounded-sv-sm border border-sv-border-strong bg-sv-surface px-3 py-2 text-[15px] text-sv-ink",
  "focus:border-sv-teal focus:outline-none focus:ring-[3px] focus:ring-sv-teal-soft"
)

function CardFrame({ children, onEdit, onRemove, editing, label }: {
  children: React.ReactNode
  onEdit: () => void
  onRemove?: () => void
  editing: boolean
  label: string
}) {
  return (
    <article className="flex flex-col gap-2 rounded-sv-md border border-sv-border bg-sv-surface p-4 shadow-sv-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
        <div className="flex flex-none gap-1">
          <IconButton label={editing ? `Done editing ${label}` : `Edit ${label}`} onClick={onEdit}>
            {editing ? <path d="M20 6 9 17l-5-5" /> : <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />}
          </IconButton>
          {onRemove ? (
            <IconButton label={`Remove ${label}`} onClick={onRemove}>
              <path d="M18 6 6 18M6 6l12 12" />
            </IconButton>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-sv-sm text-sv-ink-muted hover:bg-sv-surface-sunken focus-visible:outline-2 focus-visible:outline-sv-teal"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}

function Chips({ chips, onRemove }: { chips: string[]; onRemove?: (chip: string) => void }) {
  if (chips.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <li key={chip} className="flex items-center gap-1 rounded-full bg-sv-teal-soft px-2.5 py-0.5 text-xs font-semibold text-sv-teal-deep">
          {chip}
          {onRemove ? (
            <button type="button" aria-label={`Remove ${chip}`} onClick={() => onRemove(chip)} className="text-sv-teal-deep">
              ×
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function MoneyHistoryReviewCard({
  card,
  onChange,
  onRemove,
}: {
  card: MoneyHistoryCard
  onChange: (card: MoneyHistoryCard) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const uid = useId()
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState("")

  const addNote = () => {
    const text = note.trim()
    if (text) onChange({ ...card, description: [card.description, text].filter(Boolean).join(" ").slice(0, 500) })
    setNote("")
    setNoting(false)
  }

  return (
    <CardFrame editing={editing} onEdit={() => setEditing(!editing)} onRemove={onRemove} label={card.title}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">{KIND_LABELS[card.kind]}</p>
      {editing ? (
        <>
          <label className="sr-only" htmlFor={`${uid}-title`}>
            Title
          </label>
          <input
            id={`${uid}-title`}
            className={cn(fieldClass, "font-semibold")}
            value={card.title}
            maxLength={120}
            onChange={(e) => onChange({ ...card, title: e.target.value })}
          />
          <label className="sr-only" htmlFor={`${uid}-description`}>
            Description
          </label>
          <textarea
            id={`${uid}-description`}
            className={fieldClass}
            rows={2}
            value={card.description}
            maxLength={500}
            onChange={(e) => onChange({ ...card, description: e.target.value })}
          />
          <Chips chips={card.attributes} onRemove={(chip) => onChange({ ...card, attributes: card.attributes.filter((c) => c !== chip) })} />
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold leading-6">{card.title}</h3>
          {card.description ? <p className="text-sm leading-5 text-sv-ink-muted">{card.description}</p> : null}
          <Chips chips={card.attributes} />
        </>
      )}
      {noting ? (
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor={`${uid}-note`}>
            Note
          </label>
          <textarea
            id={`${uid}-note`}
            className={fieldClass}
            rows={2}
            autoFocus
            value={note}
            maxLength={300}
            placeholder="Add a note…"
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" onClick={addNote} className="self-start text-sm font-semibold text-sv-teal-deep hover:underline">
            Add note
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setNoting(true)} className="self-start text-sm font-semibold text-sv-teal-deep hover:underline">
          + Add a note
        </button>
      )}
    </CardFrame>
  )
}

export function VisionReviewCard({ vision, onChange }: { vision: string; onChange: (vision: string) => void }) {
  const [editing, setEditing] = useState(false)
  return (
    <CardFrame editing={editing} onEdit={() => setEditing(!editing)} label="your rich-life vision">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">Your rich life</p>
      {editing ? (
        <>
          <label className="sr-only" htmlFor="vision">
            Your rich-life vision
          </label>
          <textarea id="vision" className={fieldClass} rows={4} value={vision} maxLength={1000} onChange={(e) => onChange(e.target.value)} />
        </>
      ) : (
        <p className="text-[15px] leading-[22px]">{vision || "Tap edit to describe it in your own words."}</p>
      )}
    </CardFrame>
  )
}

export function GoalReviewCard({ goal, onChange, onRemove }: { goal: GoalCard; onChange: (goal: GoalCard) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false)
  return (
    <CardFrame editing={editing} onEdit={() => setEditing(!editing)} onRemove={onRemove} label={goal.title}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">Goal</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input aria-label="Goal" className={cn(fieldClass, "font-semibold")} value={goal.title} maxLength={120} onChange={(e) => onChange({ ...goal, title: e.target.value })} />
          <textarea aria-label="Why it matters" className={fieldClass} rows={2} value={goal.why} maxLength={500} placeholder="Why it matters" onChange={(e) => onChange({ ...goal, why: e.target.value })} />
          <div className="flex gap-2">
            <input
              aria-label="Amount in dollars"
              inputMode="decimal"
              className={fieldClass}
              placeholder="Amount (optional)"
              value={goal.targetAmount ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[$,\s]/g, ""))
                onChange({ ...goal, targetAmount: e.target.value.trim() === "" || !Number.isFinite(n) || n < 0 ? null : n })
              }}
            />
            <input
              aria-label="Target date"
              type="date"
              className={fieldClass}
              value={goal.targetDate ?? ""}
              onChange={(e) => onChange({ ...goal, targetDate: e.target.value || null })}
            />
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-base font-semibold leading-6">{goal.title}</h3>
          {goal.why ? <p className="text-sm leading-5 text-sv-ink-muted">{goal.why}</p> : null}
          <Chips chips={formatGoalDetails(goal)} />
        </>
      )}
    </CardFrame>
  )
}
