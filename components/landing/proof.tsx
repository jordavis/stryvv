import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "VP of Operations, ScaleUp Inc.",
    initials: "SC",
    quote:
      "We cut our manual reporting time by 85%. Our team now spends that time on strategy instead of spreadsheets. Revenue is up 32% since we started.",
  },
  {
    name: "Marcus Rodriguez",
    role: "Founder, Velocity Labs",
    initials: "MR",
    quote:
      "As a solo founder, Stryvv felt like hiring three employees. I went from struggling to keep up to confidently managing twice the workload.",
  },
  {
    name: "Emily Park",
    role: "Head of Growth, Nextera",
    initials: "EP",
    quote:
      "The automation engine alone saved us $4,200/month in operational costs. Setup took 20 minutes. ROI was positive in the first week.",
  },
]

export function Proof() {
  return (
    <section id="proof" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by high-performers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See what our customers are saying about the results they&apos;re
            getting.
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
