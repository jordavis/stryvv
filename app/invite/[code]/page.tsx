import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const supabase = await createClient()

  // Validate invite code
  const { data: household } = await supabase
    .from("households")
    .select("id, invite_code")
    .eq("invite_code", code.toUpperCase())
    .single()

  if (!household) notFound()

  // Find who invited them (first partner in this household)
  const { data: partner } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("household_id", household.id)
    .single()

  const partnerName = partner?.first_name ?? "Your partner"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-12 space-y-8 text-center">
        <Image
          src="/logo.png"
          alt="Stryvv"
          width={120}
          height={29}
          unoptimized
          className="mx-auto"
        />

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{partnerName} invited you to Stryvv</h1>
          <p className="text-muted-foreground">
            Take a quick survey about your money mindset, then see how your financial personalities
            compare — and discover how to build your rich life together.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-4 text-left">
          <h2 className="font-semibold">Here&apos;s how it works:</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="text-primary font-bold shrink-0">1.</span>
              Answer 6 quick sections about your money mindset
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold shrink-0">2.</span>
              Create your free account (takes 30 seconds)
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold shrink-0">3.</span>
              Get your Money Mindset Snapshot side-by-side with {partnerName}
            </li>
          </ul>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={`/survey?invite=${code.toUpperCase()}`}>Start my survey</Link>
        </Button>

        <p className="text-xs text-muted-foreground">Free to use. No credit card required.</p>
      </div>
    </div>
  )
}
