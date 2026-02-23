import { CheckCircle } from "lucide-react"

const deliverables = [
  "Your personal Money Mindset profile — know your financial personality",
  "Side-by-side comparison with your partner's results",
  "Compatibility insights across 6 financial dimensions",
  "Personalized conversation starters to bridge your money differences",
]

export function Success() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <CheckCircle className="mx-auto size-12 text-primary" />
        <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Here&apos;s what you&apos;ll get
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Your Money Mindset Snapshot — a clear picture of how you and your partner relate to money,
          and how to work better together.
        </p>
        <ul className="mt-8 space-y-4 text-left">
          {deliverables.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-base">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
