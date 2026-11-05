import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Logo } from "@/components/app/app-shell"
import { Button } from "@/components/app/button"
import { AskBar } from "@/components/app/home/ask-bar"
import { EmptyModule, ModuleCard, ModuleError } from "@/components/app/home/module-card"
import { ScoreRings } from "@/components/app/home/score-rings"
import { OnboardingSheet } from "@/components/app/onboarding/onboarding-sheet"
import { formatGoalDetails } from "@/lib/onboarding/format"
import { signOut } from "@/lib/actions/auth"
import { messagesForStep, stepForStage } from "@/lib/onboarding/flow"
import type { StoredMessage } from "@/lib/onboarding/messages"
import { loadOnboardingState } from "@/lib/onboarding/server"
import type { StepId } from "@/lib/onboarding/steps"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Home | Stryvv" }

const KIND_LABELS: Record<string, string> = { memory: "Memory", belief: "Belief", pattern: "Pattern", win: "Win" }
const STEPS: StepId[] = ["story", "baseline", "rich"]

// Home: the "Ask Stryvv" bar and the module cards, with the onboarding sheet over it until
// onboarding is done (spec requirements 1–2 and 21–24).
export default async function HomePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { step: requested } = await searchParams
  const state = await loadOnboardingState(supabase)

  // Everything below reads only the person's own rows (RLS, plus an owner filter so a partner's
  // shared records never show up here).
  const [visionResult, goalsResult, entriesResult, baselineResult] = await Promise.all([
    supabase.from("profiles").select("rich_life_vision").maybeSingle(),
    supabase
      .from("goals")
      .select("id, title, target_amount, target_date")
      .eq("owner_id", user.id)
      .eq("status", "active")
      .is("archived_at", null)
      .order("confirmed_at", { ascending: true }),
    supabase
      .from("money_history_entries")
      .select("id, kind, title")
      .eq("owner_id", user.id)
      .is("archived_at", null)
      .order("confirmed_at", { ascending: true }),
    supabase
      .from("check_ins")
      .select("id, measurements(metric, value)")
      .eq("owner_id", user.id)
      .eq("kind", "baseline")
      .maybeSingle(),
  ])

  const scores = new Map<string, number>(
    ((baselineResult.data?.measurements ?? []) as { metric: string; value: number }[]).map((m) => [m.metric, Number(m.value)])
  )
  const hasBaseline = scores.has("stryvv_score")

  // Which step the sheet shows: the current one while onboarding, or one reopened from home.
  let sheetStep: StepId | null = stepForStage(state.stage)
  const reopened = sheetStep === null && STEPS.includes(requested as StepId)
  if (reopened) sheetStep = requested as StepId
  if (sheetStep === "baseline" && hasBaseline) sheetStep = null
  if (reopened && sheetStep !== null && sheetStep !== "baseline" && state.conversation?.pointer?.step !== sheetStep) {
    sheetStep = null
  }

  let sheetMessages: StoredMessage[] = []
  const pointer = state.conversation?.pointer ?? null
  if (sheetStep && sheetStep !== "baseline" && state.conversation && pointer?.step === sheetStep) {
    const { data } = await supabase
      .from("messages")
      .select("id, role, content")
      .eq("conversation_id", state.conversation.id)
      .order("created_at", { ascending: true })
      .limit(400)
    sheetMessages = messagesForStep((data ?? []) as StoredMessage[], pointer.stepStart)
  }

  const vision = visionResult.data?.rich_life_vision?.trim()

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Logo />
      <header className="flex flex-col gap-4">
        <h1 className="font-sv-display text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-balance">
          {state.firstName ? `Welcome to Stryvv, ${state.firstName}` : "Welcome to Stryvv"}
        </h1>
        <AskBar />
      </header>

      <main className="flex flex-col gap-4">
        <ModuleCard title="What you're working toward">
          {goalsResult.error ? (
            <ModuleError />
          ) : goalsResult.data.length > 0 ? (
            <div className="flex flex-col gap-3">
              {vision ? <p className="text-[15px] leading-[22px] text-sv-ink-muted">{vision}</p> : null}
              <ul className="flex flex-col gap-2">
                {goalsResult.data.map((goal) => {
                  const details = formatGoalDetails({
                    targetAmount: goal.target_amount === null ? null : Number(goal.target_amount),
                    targetDate: goal.target_date,
                  })
                  return (
                    <li key={goal.id} className="flex flex-col rounded-sv-md bg-sv-surface-sunken px-4 py-3">
                      <span className="font-semibold">{goal.title}</span>
                      {details.length > 0 ? <span className="text-sm text-sv-ink-muted">{details.join(" · ")}</span> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <EmptyModule
              text={vision ?? "Name what you want money to help you build, and your first goal."}
              action="Set a goal with Stryvv"
              step="rich"
            />
          )}
        </ModuleCard>

        <ModuleCard title="Your money story">
          {entriesResult.error ? (
            <ModuleError />
          ) : entriesResult.data.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {entriesResult.data.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{entry.title}</span>
                  <span className="flex-none text-xs font-semibold uppercase tracking-[0.08em] text-sv-ink-muted">
                    {KIND_LABELS[entry.kind] ?? entry.kind}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyModule
              text="How you grew up with money shapes what you do with it today. Tell your story to see it here."
              action="Tell your money story"
              step="story"
            />
          )}
        </ModuleCard>

        <ModuleCard title="Your scores">
          {baselineResult.error ? (
            <ModuleError />
          ) : hasBaseline ? (
            <ScoreRings
              total={scores.get("stryvv_score")!}
              parts={{
                security: scores.get("score_security"),
                satisfaction: scores.get("score_satisfaction"),
                alignment: scores.get("score_alignment"),
                unity: scores.get("score_unity"),
              }}
            />
          ) : (
            <EmptyModule
              text="A few quick taps give you your Stryvv Score: where you're starting from."
              action="Take your baseline"
              step="baseline"
            />
          )}
        </ModuleCard>

        <ModuleCard title="Money Moves">
          <p className="text-[15px] leading-[22px] text-sv-ink-muted">You&apos;ll pick your first one after setting a goal.</p>
        </ModuleCard>
      </main>

      <form action={signOut}>
        <Button type="submit" variant="secondary" block>
          Sign out
        </Button>
      </form>

      {sheetStep ? (
        <OnboardingSheet
          key={`${sheetStep}-${state.conversation?.pointer ? `${pointer?.step}:${pointer?.stepStart}` : "none"}`}
          step={sheetStep}
          reopened={reopened}
          conversationId={state.conversation?.id ?? null}
          pointer={pointer ? `${pointer.step}:${pointer.topic}:${pointer.topicStart}:${pointer.stepStart}` : null}
          messages={sheetMessages}
        />
      ) : null}
    </div>
  )
}
