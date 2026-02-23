import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Jordan & Alex M.",
    role: "Together 7 years",
    initials: "JA",
    quote:
      "We'd been arguing about money for years without ever understanding why. Seeing our profiles side-by-side was a lightbulb moment. We finally have language for our differences.",
  },
  {
    name: "Priya & Dev S.",
    role: "Married 3 years",
    initials: "PD",
    quote:
      "I'm an Optimizer, Dev is a Dreamer. Stryvv helped us see how those styles actually complement each other when we're aligned on goals. Game changer for our budget conversations.",
  },
  {
    name: "Taylor & Sam R.",
    role: "Together 12 years",
    initials: "TS",
    quote:
      "We thought we were just 'bad at money talks.' Turns out we just needed a framework. The conversation starters alone were worth it — we've had more productive money talks this month than in years.",
  },
]

export function Proof() {
  return (
    <section id="proof" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Couples who get it
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real couples discovering how to finally talk about money without it turning into a fight.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
