import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const tiers = [
  {
    title: "Money Mindset Profiles",
    value: "Free",
    description:
      "Both partners get their full personality profile — Optimizer, Dreamer, Worrier, or Avoider.",
  },
  {
    title: "Couples Comparison",
    value: "Free",
    description:
      "Side-by-side breakdown of your financial personalities across all 6 survey dimensions.",
  },
  {
    title: "Compatibility Insights",
    value: "Free",
    description:
      "A plain-language report on where you align, where you clash, and why — no jargon.",
  },
  {
    title: "Conversation Starters",
    value: "Free",
    description:
      "Personalized prompts to open up money talks that lead somewhere productive.",
  },
]

export function Value() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything included, completely free
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We&apos;re in early access. Your Money Mindset Snapshot — and everything that comes with
            it — is free for founding couples.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tier.title}</CardTitle>
                  <span className="text-sm font-semibold text-primary">{tier.value}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center space-y-2">
          <p className="text-3xl font-bold text-primary">Free for early access</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" />
            <span>No credit card required</span>
            <span>&bull;</span>
            <span>Takes 10 minutes</span>
            <span>&bull;</span>
            <span>Both partners included</span>
          </div>
        </div>
      </div>
    </section>
  )
}
