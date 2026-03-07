"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface InvitePanelProps {
  firstName: string
  inviteCode: string
}

export function InvitePanel({ firstName, inviteCode }: InvitePanelProps) {
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : `https://stryvv.com/invite/${inviteCode}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 text-center">
      <Image src="/logo-green.png" alt="Stryvv" width={120} height={29} unoptimized className="mx-auto" />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">You&apos;re all set{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your Money Mindset Snapshot is being prepared. Now invite your partner to take the survey
          too — then you'll both unlock the full side-by-side comparison.
        </p>
      </div>

      {/* Invite code card */}
      <div className="rounded-2xl border-2 border-primary/20 bg-card p-6 space-y-4">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Your Partner&apos;s Invite Code
        </p>
        <div className="flex items-center justify-center">
          <span className="text-4xl font-bold tracking-[0.2em] text-primary">{inviteCode}</span>
        </div>
        <p className="text-xs text-muted-foreground">stryvv.com/invite/{inviteCode}</p>
        <Button onClick={copyLink} className="w-full" variant="outline">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" /> Copy invite link
            </>
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Once your partner completes their survey, you&apos;ll both get access to your full Money
        Mindset Snapshot.
      </p>
    </div>
  )
}
