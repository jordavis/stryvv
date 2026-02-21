import { AlertTriangle, Clock, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const problems = [
  {
    icon: Clock,
    title: "Drowning in busywork",
    description:
      "You spend 60% of your day on repetitive tasks that don't move the needle. Context-switching kills your focus.",
  },
  {
    icon: TrendingDown,
    title: "Falling behind competitors",
    description:
      "While you're manually crunching numbers, your competitors are automating and scaling. The gap widens every week.",
  },
  {
    icon: AlertTriangle,
    title: "Tools that don't talk",
    description:
      "Your tech stack is a patchwork of disconnected tools. Data lives in silos and nothing syncs properly.",
  },
]

export function Problem() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            These problems cost teams thousands of hours and dollars every year.
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
          We built Stryvv because we lived this pain ourselves. There had to be
          a better way — and now there is.
        </p>
      </div>
    </section>
  )
}
