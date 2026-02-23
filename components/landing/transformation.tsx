const stages = [
  {
    timeframe: "Day 1",
    title: "Know Yourself",
    description:
      "Take the 10-minute survey and get your Money Mindset profile. Understand your financial personality for the first time — no jargon, no judgment.",
  },
  {
    timeframe: "Day 2",
    title: "Know Each Other",
    description:
      "Invite your partner. When they complete their survey, you both unlock the side-by-side comparison. See where you align and where you differ.",
  },
  {
    timeframe: "Week 1",
    title: "Start Talking",
    description:
      "Use your personalized conversation starters to open up money discussions that actually go somewhere. Turn friction into understanding.",
  },
  {
    timeframe: "Month 1+",
    title: "Build Together",
    description:
      "With a shared language and framework, set goals you both care about and build the financial life you've always wanted — together.",
  },
]

export function Transformation() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From strangers about money to true financial partners — here&apos;s the journey.
          </p>
        </div>
        <div className="relative mt-12">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 hidden h-full w-px bg-border sm:left-1/2 sm:block" />
          <div className="space-y-12">
            {stages.map((stage, i) => (
              <div
                key={stage.title}
                className={`relative flex flex-col gap-4 sm:flex-row sm:gap-8 ${
                  i % 2 === 1 ? "sm:flex-row-reverse" : ""
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-4 top-0 hidden size-3 -translate-x-1/2 rounded-full bg-primary sm:left-1/2 sm:block" />
                <div
                  className={`sm:w-1/2 ${
                    i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12"
                  }`}
                >
                  <span className="text-sm font-medium text-primary">{stage.timeframe}</span>
                  <h3 className="mt-1 text-xl font-semibold">{stage.title}</h3>
                  <p className="mt-2 text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
