"use client"

import Link from "next/link"
import Image from "next/image"
import { useSurvey } from "@/lib/context/survey-context"
import { Button } from "@/components/ui/button"
import { PartnerVennDiagram } from "@/components/snapshot/SampleComparisonCard"
import type { ShapeId } from "@/lib/types/survey"

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

const SHAPE_DATA: Record<ShapeId, { name: string; description: string }> = {
  circle: {
    name: "The Harmony-Seeker",
    description: "Values peace, balance, and emotional connection",
  },
  square: {
    name: "The Planner",
    description: "Structured and reliable, prefers systems and predictability",
  },
  triangle: {
    name: "The Achiever",
    description: "Ambitious and goal-driven, makes decisive financial moves",
  },
  squiggle: {
    name: "The Free Spirit",
    description: "Creative and spontaneous, rigid budgets feel like a cage",
  },
}

export default function SurveyCompletePage() {
  const { state } = useSurvey()
  const myStyle = (state.answers.q12_my_money_style ?? "optimizer") as keyof typeof MONEY_STYLE_DATA
  const styleData = MONEY_STYLE_DATA[myStyle] ?? MONEY_STYLE_DATA.optimizer
  const nickname = state.answers.q5_nickname ?? "you"
  const topShapes = (state.answers.q14_shape_ranking ?? []).slice(0, 2)

  return (
    <div className="space-y-8 pb-12">
      {/* Section 1 — Hero */}
      <div className="text-center space-y-3">
        <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full tracking-wide uppercase">
          Your Money Mindset Snapshot
        </span>
        <h1 className="text-3xl font-bold">Nice work, {nickname}!</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Here&apos;s what we learned about you, and a preview of what unlocks when your partner
          takes the survey too.
        </p>
      </div>

      {/* Section 2 — Money Style Card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card overflow-hidden">
        <div className="h-1.5 bg-primary w-full" />
        <div className="p-6 space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your Money Style
          </p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{styleData.emoji}</span>
            <h2 className="text-2xl font-bold">{styleData.name}</h2>
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
      </div>

      {/* Section 3 — Shape Personality */}
      {topShapes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
            Your Shape Personality
          </p>
          <div className={topShapes.length === 1 ? "flex justify-center" : "grid grid-cols-2 gap-3"}>
            {topShapes.map((shape, i) => {
              const data = SHAPE_DATA[shape]
              return (
                <div
                  key={shape}
                  className="rounded-2xl border border-border bg-card p-4 space-y-2 text-center"
                >
                  <div className="relative mx-auto w-14 h-14">
                    <Image
                      src={`/images/survey/shapes/${shape}.png`}
                      alt={shape}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    #{i + 1}
                  </span>
                  <p className="font-semibold text-sm">{data.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{data.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Section 4 — Partner Venn Diagram */}
      <div className="rounded-2xl border-2 border-dashed border-muted p-6 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
          Your Couples Snapshot
        </p>
        <PartnerVennDiagram styleEmoji={styleData.emoji} />
      </div>

      {/* Section 5 — CTA */}
      {state.inviteCode ? (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-4 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-bold">Your partner is waiting!</h2>
          <p className="text-sm text-muted-foreground">
            Create your free account and we&apos;ll unlock your Couples Alignment Snapshot — a
            side-by-side look at your money personalities and where you align.
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
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 space-y-4">
          <h2 className="text-xl font-bold text-center">Ready to see the full picture?</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-border p-3 space-y-1">
              <p className="text-xs font-bold text-primary">Step 1</p>
              <p className="text-sm font-semibold">Create your account</p>
              <p className="text-xs text-muted-foreground">Save your results for free</p>
            </div>
            <div className="rounded-xl bg-white border border-border p-3 space-y-1">
              <p className="text-xs font-bold text-orange-500">Step 2</p>
              <p className="text-sm font-semibold">Invite your partner</p>
              <p className="text-xs text-muted-foreground">Unlock your Couples Snapshot</p>
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/signup">Create my free account</Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
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
