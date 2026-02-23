import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { ArrowRight } from "lucide-react"

const avatars = [
  { initials: "JA", color: "bg-blue-100 text-blue-700" },
  { initials: "PD", color: "bg-green-100 text-green-700" },
  { initials: "TR", color: "bg-purple-100 text-purple-700" },
  { initials: "MS", color: "bg-orange-100 text-orange-700" },
  { initials: "CL", color: "bg-pink-100 text-pink-700" },
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
          Ready to understand each other better?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join couples who&apos;ve already taken the survey. It&apos;s free, takes 10 minutes, and
          might just change how you talk about money forever.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/survey">
            Take the free survey
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
