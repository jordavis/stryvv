import { CheckCircle } from "lucide-react"

const deliverables = [
  "A clear view of your current alignment as a couple",
  "Insight into the history shaping your money dynamics",
  "Alignment on your individual and collective rich life dreams",
  "Guidance on shaping your habits and patterns to achieve your goals",
  "A proven system for finding harmony with money as a couple",
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
          Most couples do not want to obsess over money. Stryvv helps you manage your money so it
          does not manage you.
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
