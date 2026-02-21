import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const tiers = [
  {
    title: "Workflow Automation Engine",
    value: "$2,400/yr",
    description: "Automate repetitive tasks and save 10+ hours every week.",
  },
  {
    title: "Real-Time Analytics Suite",
    value: "$1,800/yr",
    description: "Track every metric that matters with live dashboards.",
  },
  {
    title: "Team Collaboration Hub",
    value: "$1,200/yr",
    description: "Keep your entire team aligned with shared workspaces.",
  },
  {
    title: "Priority Expert Support",
    value: "$600/yr",
    description: "Get help from our team whenever you need it.",
  },
]

export function Value() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything included, one simple price
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Here&apos;s what you&apos;d pay if you assembled this yourself.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {tiers.map((tier) => (
            <Card key={tier.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tier.title}</CardTitle>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {tier.value}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground">
            Total value:{" "}
            <span className="font-semibold line-through">$6,000/yr</span>
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            Yours for $49/mo
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-primary" />
            <span>14-day free trial</span>
            <span>&bull;</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  )
}
