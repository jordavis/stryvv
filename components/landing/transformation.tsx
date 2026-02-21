const stages = [
  {
    timeframe: "Week 1",
    title: "Quick Win",
    description:
      "Automate your first workflow and reclaim 5+ hours. See results immediately without changing how your team works.",
  },
  {
    timeframe: "Month 1",
    title: "Compound",
    description:
      "Connect your tools, eliminate data silos, and watch your efficiency metrics climb as automations stack.",
  },
  {
    timeframe: "Month 3",
    title: "Advantage",
    description:
      "Your team operates at a level your competitors can't match. Strategic decisions are backed by real-time data.",
  },
  {
    timeframe: "Month 6+",
    title: "10x",
    description:
      "You're doing the work of a team twice your size. Growth is no longer bottlenecked by operations.",
  },
]

export function Transformation() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your path to 10x
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real results compound over time. Here&apos;s the journey our
            customers take.
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
                  <span className="text-sm font-medium text-primary">
                    {stage.timeframe}
                  </span>
                  <h3 className="mt-1 text-xl font-semibold">{stage.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
