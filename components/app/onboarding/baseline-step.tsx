"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/app/button"
import { saveBaseline } from "@/lib/actions/onboarding"
import { ANSWER_LABELS, BASELINE_ITEMS, BASELINE_PROMPT, RELATIONSHIP_QUESTION, UNITY_ITEMS } from "@/lib/onboarding/baseline"
import { cn } from "@/lib/utils"
import { ChatBubble } from "./chat-bubble"
import { StepHeader } from "./step-header"

type Answers = Record<string, number>

const optionClass = (chosen: boolean) =>
  cn(
    "min-h-12 rounded-sv-md border px-4 text-left text-[15px] font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-teal",
    chosen ? "border-sv-teal bg-sv-teal text-sv-on-teal" : "border-sv-border-strong bg-sv-surface text-sv-ink hover:bg-sv-surface-sunken"
  )

/**
 * Step 2: the Stryvv Score baseline. First "Are you married or in a relationship?", then six
 * tap-to-answer items, plus the two Unity items for a yes. The wording is fixed and the coach model
 * isn't involved. Nothing is saved until the last answer, and then all of it is saved together.
 */
export function BaselineStep({
  onSkip,
  skipping,
  onSaved,
}: {
  onSkip: () => void
  skipping: boolean
  onSaved: () => void
}) {
  const [partnered, setPartnered] = useState<boolean | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const items = partnered ? [...BASELINE_ITEMS, ...UNITY_ITEMS] : BASELINE_ITEMS
  const total = items.length + 1 // including the relationship question
  const position = partnered === null ? 0 : index + 1
  const done = partnered !== null && index >= items.length
  const item = items[Math.min(index, items.length - 1)]

  const save = (all: Answers) => {
    setError(null)
    startSaving(async () => {
      const result = await saveBaseline(all)
      if (result.ok) onSaved()
      else setError(result.message)
    })
  }

  // A short pause so the chosen answer is seen before the next question slides in.
  const after = (key: string, then: () => void) => {
    if (chosen !== null) return
    setChosen(key)
    window.setTimeout(() => {
      setChosen(null)
      then()
    }, 250)
  }

  const answerRelationship = (yes: boolean) => after(yes ? "yes" : "no", () => setPartnered(yes))

  const answerItem = (answer: number) =>
    after(String(answer), () => {
      const next = { ...answers, [item.metric]: answer }
      // Answers to the Unity items are dropped if the person goes back and says they're on their own.
      const kept = Object.fromEntries(Object.entries(next).filter(([metric]) => items.some((i) => i.metric === metric)))
      setAnswers(kept)
      setIndex((i) => i + 1)
      if (index + 1 >= items.length) save(kept)
    })

  const back = () => {
    if (index > 0) setIndex((i) => i - 1)
    else setPartnered(null)
  }

  return (
    <>
      <StepHeader
        stepNumber={2}
        title="Where you are today"
        // The count is only known after the relationship question (a yes adds two items).
        topic={done ? "All done" : partnered === null ? "A quick question first" : `Question ${index + 1} of ${items.length}`}
        progress={(1 + position / total) / 3}
        onSkip={onSkip}
        skipping={skipping}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <ChatBubble
          role="assistant"
          text={"A few quick taps so you can see where you're starting from. There are no right answers: pick what fits best today."}
        />
        {partnered === null ? (
          <div className="flex flex-col gap-3 motion-safe:animate-[sv-slide-in_200ms_ease-out]">
            <ChatBubble role="assistant">
              <p className="font-semibold">{RELATIONSHIP_QUESTION}</p>
            </ChatBubble>
            <div role="group" aria-label={RELATIONSHIP_QUESTION} className="flex flex-col gap-2">
              <button type="button" onClick={() => answerRelationship(true)} aria-pressed={chosen === "yes"} className={optionClass(chosen === "yes")}>
                Yes
              </button>
              <button type="button" onClick={() => answerRelationship(false)} aria-pressed={chosen === "no"} className={optionClass(chosen === "no")}>
                No
              </button>
            </div>
          </div>
        ) : !done ? (
          <div key={item.metric} className="flex flex-col gap-3 motion-safe:animate-[sv-slide-in_200ms_ease-out]">
            <ChatBubble role="assistant">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">{BASELINE_PROMPT}</p>
              <p className="mt-1 font-semibold">{item.text}</p>
            </ChatBubble>
            <div role="group" aria-label={item.text} className="flex flex-col gap-2">
              {ANSWER_LABELS.map((label, answer) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => answerItem(answer)}
                  aria-pressed={chosen === String(answer)}
                  className={optionClass(chosen === String(answer))}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={back} className="self-start text-sm font-semibold text-sv-teal-deep hover:underline">
              Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {error ? (
              <>
                <p role="alert" className="rounded-sv-sm bg-sv-danger-soft px-3 py-2.5 text-sm text-sv-danger">
                  {error}
                </p>
                <Button onClick={() => save(answers)} pending={saving} pendingLabel="Saving…">
                  Try again
                </Button>
              </>
            ) : (
              <p role="status" className="text-sm text-sv-ink-muted">
                Saving…
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
