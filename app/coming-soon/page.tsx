import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Coming soon | Stryvv",
  description: "We're rebuilding Stryvv. It will be back soon.",
}

// The holding page while Stryvv is rebuilt. Every page other than the landing page redirects here
// (see lib/supabase/proxy.ts). It collects nothing.
export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/logo-green.png"
            alt="Stryvv"
            unoptimized
            width={140}
            height={34}
            priority
            className="mx-auto h-auto w-[140px]"
          />
        </Link>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-[#0b2545] text-balance">
            We&apos;re rebuilding Stryvv
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            A new Stryvv is on the way: a money coach you talk to, that helps you understand your
            money story and build better habits, on your own or with your partner.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            It will be back soon.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/">Back to the home page</Link>
        </Button>
      </div>
    </main>
  )
}
