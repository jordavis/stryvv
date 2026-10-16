import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard } from "@/components/app/auth-card"
import { recalledEmail } from "@/lib/auth/remembered-email"
import { VerifyForm } from "./verify-form"

export const metadata: Metadata = { title: "Check your email | Stryvv" }

export default async function VerifyPage() {
  const email = await recalledEmail("pending")

  if (!email) {
    return (
      <AuthCard title="Nothing to verify" subtitle="This code screen has expired, or you opened it in a different browser.">
        <div className="flex flex-col gap-2 text-center text-sm">
          <Link href="/login" className="font-semibold text-sv-teal hover:underline">
            Sign in
          </Link>
          <Link href="/signup" className="font-semibold text-sv-teal hover:underline">
            Create an account
          </Link>
        </div>
      </AuthCard>
    )
  }

  return <VerifyForm email={email} />
}
