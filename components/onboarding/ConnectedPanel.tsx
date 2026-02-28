"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { sendSurveyAnalysis } from "@/lib/actions/survey-analysis"

interface ConnectedPanelProps {
  firstName: string
  householdId: string
}

export function ConnectedPanel({ firstName, householdId }: ConnectedPanelProps) {
  const [resendState, setResendState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resendError, setResendError] = useState<string | null>(null)

  async function handleResend() {
    setResendState("loading")
    setResendError(null)
    const result = await sendSurveyAnalysis(householdId)
    if (result.success) {
      setResendState("success")
    } else {
      setResendState("error")
      setResendError(result.error ?? "Failed to send analysis")
    }
  }

  return (
    <div className="space-y-8 text-center">
      <Image src="/logo.png" alt="Stryvv" width={120} height={29} unoptimized className="mx-auto" />

      <div className="space-y-2">
        <CheckCircle className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">
          You&apos;re connected{firstName ? `, ${firstName}` : ""}!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your responses are saved and your households are linked. Your full Money Mindset Snapshot
          will be ready once both partners have completed the survey.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4 text-left">
        <h2 className="font-semibold">What happens next</h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">1.</span>
            Both your results are now linked — your Money Mindset Snapshot is being prepared.
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">2.</span>
            You&apos;ll see a side-by-side comparison of your financial personalities, compatibility
            insights, and personalized conversation starters.
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">3.</span>
            Stryvv will guide you both toward shared financial goals.
          </li>
        </ul>
      </div>

      <Button asChild size="lg" className="w-full">
        <Link href="/">Back to home</Link>
      </Button>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resendState === "loading"}
          className="w-full"
        >
          {resendState === "loading" ? "Sending analysis…" : "Resend Analysis"}
        </Button>
        {resendState === "success" && (
          <p className="text-sm text-green-600">Analysis sent successfully.</p>
        )}
        {resendState === "error" && (
          <p className="text-sm text-destructive">{resendError}</p>
        )}
      </div>
    </div>
  )
}
