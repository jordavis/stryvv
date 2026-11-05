import { PART_LABELS, type ScorePart } from "@/lib/onboarding/baseline"

/** One ring: the score as an arc around its number. */
function Ring({ value, size, stroke, label, big = false }: { value: number; size: number; stroke: number; label: string; big?: boolean }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value} out of 100`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sv-surface-sunken)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--sv-teal)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(clamped / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span
          aria-hidden="true"
          className={big ? "absolute inset-0 flex items-center justify-center font-sv-display text-4xl font-extrabold" : "absolute inset-0 flex items-center justify-center font-sv-display text-lg font-bold"}
        >
          {value}
        </span>
      </div>
      <figcaption className={big ? "text-sm font-semibold text-sv-ink" : "text-xs font-medium text-sv-ink-muted"}>{label}</figcaption>
    </figure>
  )
}

/** The Stryvv Score as one big ring, with a smaller ring for each part. */
export function ScoreRings({ total, parts }: { total: number; parts: Partial<Record<ScorePart, number>> }) {
  const shown = (Object.keys(PART_LABELS) as ScorePart[]).filter((part) => parts[part] !== undefined)
  return (
    <div className="flex flex-col items-center gap-4">
      <Ring value={total} size={132} stroke={12} label="Your starting point" big />
      <div className="flex w-full justify-around">
        {shown.map((part) => (
          <Ring key={part} value={parts[part]!} size={64} stroke={7} label={PART_LABELS[part]} />
        ))}
      </div>
    </div>
  )
}
