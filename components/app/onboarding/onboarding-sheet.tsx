"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Sheet } from "@/components/app/sheet"
import { skipStep, startOnboarding } from "@/lib/actions/onboarding"
import type { StoredMessage } from "@/lib/onboarding/messages"
import type { StepId } from "@/lib/onboarding/steps"
import { BaselineStep } from "./baseline-step"
import { ChatStep } from "./chat-step"

/**
 * The onboarding sheet over the home screen. The server decides which step to show (from the
 * person's stage, or a step reopened from home); this component runs that step and refreshes the
 * page when it's saved or skipped, so the next step (or home) comes from the server.
 */
export function OnboardingSheet({
  step,
  reopened,
  conversationId,
  pointer,
  messages,
}: {
  step: StepId
  /** Opened from a home empty state after onboarding was done: closing returns to home. */
  reopened: boolean
  conversationId: string | null
  pointer: string | null
  messages: StoredMessage[]
}) {
  const router = useRouter()
  const [skipping, startSkipping] = useTransition()
  const [problem, setProblem] = useState<string | null>(null)

  // A reopened step goes back to plain /home (a fresh render). Otherwise reload the same page, which
  // now shows the next step, or home once onboarding is done. Never both: a refresh issued straight
  // after the navigation would reload the old URL and keep the sheet open.
  const finish = () => {
    if (reopened) router.replace("/home")
    else router.refresh()
  }

  // A chat step with no conversation or position yet: set it up, then load it.
  const needsStart = step !== "baseline" && (!conversationId || !pointer)
  const started = useRef(false)
  useEffect(() => {
    if (!needsStart || started.current) return
    started.current = true
    void startOnboarding().then((result) => {
      if (result.ok) router.refresh()
      else setProblem(result.message)
    })
  }, [needsStart, router])

  const skip = () => {
    startSkipping(async () => {
      const result = await skipStep(step)
      if (result.ok) finish()
      else setProblem(result.message)
    })
  }

  return (
    <Sheet open title="Getting started with Stryvv">
      {step === "baseline" ? (
        <BaselineStep onSkip={skip} skipping={skipping} onSaved={finish} />
      ) : conversationId && pointer ? (
        <ChatStep
          // A new step (or a reopened one) starts a fresh chat on screen.
          key={`${step}-${pointer.split(":").slice(3).join(":")}`}
          step={step}
          conversationId={conversationId}
          initialPointer={pointer}
          initialMessages={messages}
          onSkip={skip}
          skipping={skipping}
          onSaved={finish}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-sv-ink-muted" role="status">
          {problem ?? "Getting your coach ready…"}
        </div>
      )}
      {problem && (step === "baseline" || (conversationId && pointer)) ? (
        <p role="alert" className="border-t border-sv-border bg-sv-danger-soft px-4 py-2 text-sm text-sv-danger">
          {problem}
        </p>
      ) : null}
    </Sheet>
  )
}
