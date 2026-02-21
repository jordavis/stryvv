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
              Now in early access
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
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">See how it works</a>
              </Button>
            </div>
            {/* Trust signals */}
            <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
              <span>No credit card required</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">Free 14-day trial</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">Cancel anytime</span>
            </div>
          </div>

          {/* Right column — placeholder graphic */}
          <div className="relative mx-auto aspect-square w-full max-w-md lg:mx-0">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <div className="absolute inset-4 rounded-2xl border bg-card/50 backdrop-blur" />
            <div className="absolute inset-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary">10x</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Productivity boost
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
