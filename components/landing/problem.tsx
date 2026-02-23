import { AlertTriangle, MessageSquareOff, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const problems = [
  {
    icon: MessageSquareOff,
    title: "You avoid money talks",
    description:
      "Conversations about money feel loaded — someone always ends up defensive, dismissed, or just done. So you stop having them.",
  },
  {
    icon: TrendingDown,
    title: "You're not on the same page",
    description:
      "One of you is a saver, one's a spender. One tracks every dollar, the other doesn't look at the account. Small differences compound into real friction.",
  },
  {
    icon: AlertTriangle,
    title: "You have goals but no system",
    description:
      "You both want financial security — maybe even the same things. But without a shared framework, you drift instead of build.",
  },
]

export function Problem() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sound familiar?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Money is the #1 source of conflict in relationships. Not because couples are bad with
            money — but because they&apos;ve never been given the tools to understand each other.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-destructive/20">
              <CardHeader>
                <problem.icon className="size-8 text-destructive" />
                <CardTitle className="mt-2">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-medium">
          Stryvv helps couples understand their financial personalities — so they can stop fighting
          about money and start building together.
        </p>
      </div>
    </section>
  )
}
