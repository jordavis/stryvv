"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { Button } from "@/components/app/button"
import { saveGoals, saveMoneyHistory } from "@/lib/actions/onboarding"
import { isReview, parsePointer } from "@/lib/onboarding/flow"
import { toUIMessages, type OnboardingUIMessage, type StoredMessage } from "@/lib/onboarding/messages"
import { draftsSchema, type Drafts } from "@/lib/onboarding/schemas"
import { CHAT_STEPS, type ChatStepId } from "@/lib/onboarding/steps"
import { ChatBubble, TypingBubble } from "./chat-bubble"
import { ChatComposer } from "./chat-composer"
import { ChipGroup } from "./chip-group"
import { GoalReviewCard, MoneyHistoryReviewCard, VisionReviewCard } from "./review-cards"
import { StepHeader } from "./step-header"

type Proposal = Drafts & { id: string }

/** The newest review cards the coach proposed, validated again before they're shown. */
function latestProposal(messages: OnboardingUIMessage[]): Proposal | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== "assistant") continue
    for (let j = message.parts.length - 1; j >= 0; j--) {
      const part = message.parts[j]
      if (part.type !== "data-proposal") continue
      const parsed = draftsSchema.safeParse(part.data)
      if (parsed.success) return { ...parsed.data, id: `${message.id}-${j}` }
    }
  }
  return null
}

function messageText(message: OnboardingUIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim()
}

/** Steps 1 and 3: the chat with the coach, then the review cards. */
export function ChatStep({
  step,
  conversationId,
  initialPointer,
  initialMessages,
  onSkip,
  skipping,
  onSaved,
}: {
  step: ChatStepId
  conversationId: string
  initialPointer: string
  initialMessages: StoredMessage[]
  onSkip: () => void
  skipping: boolean
  onSaved: () => void
}) {
  const config = CHAT_STEPS[step]
  const [pointerText, setPointerText] = useState(initialPointer)
  const pointer = parsePointer(pointerText)
  const inReview = pointer ? isReview(pointer) : false

  const transport = useMemo(
    () =>
      new DefaultChatTransport<OnboardingUIMessage>({
        api: "/api/onboarding/chat",
        // Only the new message, the conversation id and the draft cards: the server loads the history.
        prepareSendMessagesRequest: ({ body }) => ({ body: { conversationId, ...body } }),
      }),
    [conversationId]
  )

  const { messages, sendMessage, status, error, clearError } = useChat<OnboardingUIMessage>({
    id: `${conversationId}-${step}`,
    messages: toUIMessages(initialMessages),
    transport,
    onFinish: ({ message }) => {
      if (message.metadata?.pointer) setPointerText(message.metadata.pointer)
    },
  })

  const busy = status === "submitted" || status === "streaming"
  const [input, setInput] = useState("")
  const [chips, setChips] = useState<string[]>([])
  const lastSent = useRef("")

  // Review cards: start from the coach's latest proposal, then keep the person's edits.
  const proposal = latestProposal(messages)
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const [draftsFor, setDraftsFor] = useState<string | null>(null)
  if (proposal && proposal.id !== draftsFor) {
    setDraftsFor(proposal.id)
    setDrafts(
      proposal.kind === "money_history"
        ? { kind: "money_history", entries: proposal.entries }
        : { kind: "goals", vision: proposal.vision, goals: proposal.goals }
    )
  }

  // At the review with no cards yet (coming back to the app, or the coach just wrapped up): ask for them.
  const asked = useRef(false)
  useEffect(() => {
    if (inReview && !proposal && status === "ready" && !error && !asked.current) {
      asked.current = true
      void sendMessage(undefined, { body: { intent: "continue" } })
    }
  }, [inReview, proposal, status, error, sendMessage])

  // Keep the newest message in view.
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, status, drafts])

  const send = (text: string, shortcut = false) => {
    clearError()
    lastSent.current = text
    setInput("")
    setChips([])
    void sendMessage(
      { text },
      { body: { intent: "message", text, shortcut, drafts: inReview && drafts ? drafts : undefined } }
    )
  }

  const sendTyped = () => {
    const text = [chips.join(", "), input.trim()].filter(Boolean).join(". ")
    if (text) send(text)
  }

  const retry = () => {
    clearError()
    if (!input && lastSent.current) setInput(lastSent.current)
    void sendMessage(undefined, { body: { intent: "continue" } })
  }

  const [saving, startSaving] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const save = () => {
    if (!drafts) return
    setSaveError(null)
    startSaving(async () => {
      const result =
        drafts.kind === "money_history"
          ? await saveMoneyHistory({ conversationId, entries: drafts.entries })
          : await saveGoals({ conversationId, vision: drafts.vision.trim(), goals: drafts.goals })
      if (result.ok) onSaved()
      else setSaveError(result.message)
    })
  }

  const topic = pointer && !inReview ? config.topics[pointer.topic] : null
  const stepProgress = pointer ? Math.min(pointer.topic, config.topics.length) / (config.topics.length + 1) : 0
  const overall = step === "story" ? stepProgress / 3 : (2 + stepProgress) / 3

  return (
    <>
      <StepHeader
        stepNumber={config.number}
        title={config.title}
        topic={
          topic
            ? `${config.section} · ${(pointer?.topic ?? 0) + 1}/${config.topics.length}`
            : inReview
              ? "Check what I heard"
              : undefined
        }
        progress={overall}
        onSkip={onSkip}
        skipping={skipping}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.map((message) => {
          const text = messageText(message)
          return text ? <ChatBubble key={message.id} role={message.role === "user" ? "user" : "assistant"} text={text} /> : null
        })}
        {status === "submitted" ? <TypingBubble /> : null}

        {inReview && drafts ? (
          <section className="mt-2 flex flex-col gap-3" aria-label="Check these before we save them">
            <h3 className="font-sv-display text-lg font-bold">Check these before we save them</h3>
            {drafts.kind === "money_history" ? (
              drafts.entries.length > 0 ? (
                drafts.entries.map((entry, i) => (
                  <MoneyHistoryReviewCard
                    key={`${draftsFor}-${i}`}
                    card={entry}
                    onChange={(card) => setDrafts({ ...drafts, entries: drafts.entries.map((e, j) => (j === i ? card : e)) })}
                    onRemove={() => setDrafts({ ...drafts, entries: drafts.entries.filter((_, j) => j !== i) })}
                  />
                ))
              ) : (
                <p className="text-sm text-sv-ink-muted">Nothing to save from this part, and that&apos;s fine. You can add to your story any time.</p>
              )
            ) : (
              <>
                <VisionReviewCard vision={drafts.vision} onChange={(vision) => setDrafts({ ...drafts, vision })} />
                {drafts.goals.map((goal, i) => (
                  <GoalReviewCard
                    key={`${draftsFor}-${i}`}
                    goal={goal}
                    onChange={(g) => setDrafts({ ...drafts, goals: drafts.goals.map((x, j) => (j === i ? g : x)) })}
                    onRemove={() => setDrafts({ ...drafts, goals: drafts.goals.filter((_, j) => j !== i) })}
                  />
                ))}
              </>
            )}
          </section>
        ) : null}
        {inReview && !drafts && !error ? <p className="text-sm text-sv-ink-muted">Gathering what I heard…</p> : null}
        <div ref={bottom} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-sv-border bg-sv-surface px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        {error ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-sv-sm bg-sv-danger-soft px-3 py-2 text-sm text-sv-danger">
            <span>{error.message || "Something went wrong. Your message is saved; tap to try again."}</span>
            <button type="button" onClick={retry} className="flex-none font-semibold underline">
              Try again
            </button>
          </div>
        ) : null}

        {inReview && drafts ? (
          <>
            {saveError ? (
              <p role="alert" className="text-sm text-sv-danger">
                {saveError}
              </p>
            ) : null}
            <Button block onClick={save} pending={saving} pendingLabel="Saving…" disabled={busy}>
              {saveLabel(drafts)}
            </Button>
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={sendTyped}
              busy={busy || saving}
              placeholder="Anything to change or add…"
            />
          </>
        ) : !inReview ? (
          <>
            {topic?.chips ? (
              <ChipGroup
                chips={topic.chips}
                selected={chips}
                disabled={busy}
                onToggle={(chip) => setChips((c) => (c.includes(chip) ? c.filter((x) => x !== chip) : [...c, chip]))}
              />
            ) : null}
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={sendTyped}
              busy={busy}
              canSendEmpty={chips.length > 0}
              shortcut={config.shortcut}
              onShortcut={() => send(config.shortcut, true)}
            />
          </>
        ) : null}
      </footer>
    </>
  )
}

function saveLabel(drafts: Drafts): string {
  if (drafts.kind === "money_history") {
    const n = drafts.entries.length
    return n === 0 ? "Continue" : `Save ${n} ${n === 1 ? "entry" : "entries"} & continue`
  }
  const n = drafts.goals.length
  return n === 0 ? "Save & finish" : `Save ${n} ${n === 1 ? "goal" : "goals"} & finish`
}
