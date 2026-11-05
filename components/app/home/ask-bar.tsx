"use client"

import { useEffect, useState } from "react"

/** "Ask Stryvv about your finances". Not wired up yet: tapping it says it's coming soon. */
export function AskBar() {
  const [notice, setNotice] = useState(false)
  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(false), 3000)
    return () => window.clearTimeout(t)
  }, [notice])

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setNotice(true)}
        className="flex min-h-[52px] w-full items-center gap-3 rounded-full border border-sv-border-strong bg-sv-surface px-4 text-left text-base text-sv-ink-faint shadow-sv-card hover:bg-sv-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-sv-teal">
          <path d="m12 3-1.9 5.8L4 10.7l5.4 3.4L8 20l4-3.6 4 3.6-1.4-5.9 5.4-3.4-6.1-1.9Z" />
        </svg>
        Ask Stryvv about your finances
      </button>
      <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-sv-teal-deep">
        {notice ? "Ask Stryvv is coming soon." : ""}
      </p>
    </div>
  )
}
