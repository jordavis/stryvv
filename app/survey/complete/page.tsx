"use client"

import Link from "next/link"
import { useSurvey } from "@/lib/context/survey-context"
import { Button } from "@/components/ui/button"
import { SampleComparisonCard } from "@/components/snapshot/SampleComparisonCard"

const MONEY_STYLE_DATA = {
  optimizer: {
    emoji: "📊",
    name: "The Optimizer",
    description:
      "You approach money systematically and strategically. You love data, track everything, and are always looking for ways to improve your financial efficiency.",
    traits: [
      "Track spending meticulously",
      "Research before every purchase",
      "Long-term planning focus",
      "Uncomfortable with financial uncertainty",
    ],
  },
  dreamer: {
    emoji: "✨",
    name: "The Dreamer",
    description:
      "You're motivated by big visions and possibilities. Money is a tool to create the life you imagine, and you're inspired by ambitious goals.",
    traits: [
      "Big-picture thinker",
      "Motivated by goals and vision",
      "Sometimes optimistic about income",
      "Energized by new financial ideas",
    ],
  },
  worrier: {
    emoji: "🛡️",
    name: "The Worrier",
    description:
      "You take financial security seriously. You're cautious, careful, and prioritize building safety nets above all else.",
    traits: [
      "Prioritize emergency funds",
      "Conservative with investments",
      "Anxious about unexpected expenses",
      "Prefer predictability over growth",
    ],
  },
  avoider: {
    emoji: "🙈",
    name: "The Avoider",
    description:
      "Money matters feel overwhelming, so you tend to put them off. You know you should engage more, but it's easier to look away.",
    traits: [
      "Delay financial decisions",
      "Uncomfortable with money talks",
      "Prefer to delegate finances",
      "Procrastinate on budgeting",
    ],
  },
} as const

export default function SurveyCompletePage() {
  const { state } = useSurvey()
  const myStyle = (state.answers.q12_my_money_style ?? "optimizer") as keyof typeof MONEY_STYLE_DATA
  const styleData = MONEY_STYLE_DATA[myStyle] ?? MONEY_STYLE_DATA.optimizer
  const nickname = state.answers.q5_nickname ?? "you"

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Nice work, {nickname}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s a preview of your Money Mindset Snapshot.
        </p>
      </div>

      {/* Money style card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Your Money Style
        </p>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{styleData.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold">{styleData.name}</h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{styleData.description}</p>
        <ul className="space-y-2">
          {styleData.traits.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Partner comparison (locked) */}
      <SampleComparisonCard />

      {/* CTA */}
      {state.inviteCode ? (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-4 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-bold">You&apos;re almost there!</h2>
          <p className="text-sm text-muted-foreground">
            Your partner has already completed their survey. Create your free account and we&apos;ll
            generate your Couples Alignment Snapshot — a side-by-side look at your money
            personalities, where you align, and how to build your rich life together.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/signup">Create my account &amp; unlock our snapshot</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-4 text-center">
          <h2 className="text-xl font-bold">Ready to see the full picture?</h2>
          <p className="text-sm text-muted-foreground">
            Create your account to save your results and invite your partner. When they complete the
            survey, you&apos;ll both unlock your combined Money Mindset Snapshot.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href="/signup">Create my account — it&apos;s free</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
