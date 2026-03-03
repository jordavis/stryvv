import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Love &amp; Money, Finally in Sync
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Build your Rich Life.
              <span className="text-primary"> Together.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Personal finance is more personal than financial, especially in a
              relationship. Stryvv turns financial strife into meaningful
              striving toward shared goals.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/survey">
                  Take the free survey
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">See how it works</a>
              </Button>
            </div>
            {/* Trust signals */}
            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span>Free — no credit card</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">Takes about 10 minutes</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">Results stay private</span>
            </div>
          </div>

          {/* Right column — snapshot preview */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-1">
              <div className="rounded-2xl bg-card border p-6 space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Money Mindset Snapshot
                </p>
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-primary/10 p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">YOU</p>
                    <p className="font-bold text-sm">The Optimizer</p>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-primary w-4/5" />
                      <div className="h-2 rounded-full bg-primary/50 w-3/5" />
                      <div className="h-2 rounded-full bg-primary/25 w-2/5" />
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl bg-orange-100 p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">PARTNER</p>
                    <p className="font-bold text-sm">The Dreamer</p>
                    <div className="space-y-1.5">
                      <div className="h-2 rounded-full bg-orange-400 w-3/5" />
                      <div className="h-2 rounded-full bg-orange-300 w-4/5" />
                      <div className="h-2 rounded-full bg-orange-200 w-1/2" />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 space-y-1.5">
                  <p className="text-sm font-semibold">Where you align</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      Goal setting & long-term planning
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      Emergency fund priority
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                      Day-to-day spending decisions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
