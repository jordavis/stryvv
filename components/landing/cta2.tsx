import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { ArrowRight } from "lucide-react"

const avatars = [
  { initials: "SC", color: "bg-blue-100 text-blue-700" },
  { initials: "MR", color: "bg-green-100 text-green-700" },
  { initials: "EP", color: "bg-purple-100 text-purple-700" },
  { initials: "JT", color: "bg-orange-100 text-orange-700" },
  { initials: "AK", color: "bg-pink-100 text-pink-700" },
]

export function CTA2() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <AvatarGroup className="justify-center">
          {avatars.map((a) => (
            <Avatar key={a.initials}>
              <AvatarFallback className={a.color}>{a.initials}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        <h2 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to 10x your output?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join thousands of high-performers who&apos;ve transformed how they
          work. Start your free trial today — no credit card required.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/signup">
            Yes, let&apos;s go
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
