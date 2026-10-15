import type { Metadata } from "next"
import Link from "next/link"
import { AppShell, Logo } from "@/components/app/app-shell"

export const metadata: Metadata = { title: "Terms of Service | Stryvv" }

// Placeholder until the real document is written and reviewed by a lawyer.
export default function Page() {
  return (
    <AppShell className="gap-8">
      <Logo />
      <main className="flex flex-col gap-4">
        <h1 className="font-sv-display text-2xl font-bold">Terms of Service</h1>
        <p className="text-base leading-6 text-sv-ink-muted">
          The full Terms of Service is being finalized and will be published here before Stryvv opens to everyone.
          Questions in the meantime? Email{" "}
          <a href="mailto:support@stryvv.com" className="font-semibold text-sv-teal hover:underline">
            support@stryvv.com
          </a>
          .
        </p>
        <Link href="/" className="text-sm font-semibold text-sv-teal hover:underline">
          Back to the home page
        </Link>
      </main>
    </AppShell>
  )
}
