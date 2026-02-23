"use client"

import { useEffect, useState } from "react"
import { saveSurveyResponse } from "@/lib/actions/survey"
import { createHousehold, joinHousehold } from "@/lib/actions/onboarding"
import { InvitePanel } from "./InvitePanel"
import { ConnectedPanel } from "./ConnectedPanel"

const STORAGE_KEY = "stryvv_survey"

interface OnboardingClientProps {
  firstName: string
}

type Mode = "creator" | "joiner"

export function OnboardingClient({ firstName }: OnboardingClientProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("creator")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function run() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const survey = raw ? JSON.parse(raw) : null

        // Save survey answers to DB
        if (survey?.answers && Object.keys(survey.answers).length > 0) {
          await saveSurveyResponse(survey.answers)
        }

        const storedInviteCode: string | null = survey?.inviteCode ?? null

        if (storedInviteCode) {
          // Person 2: join an existing household
          await joinHousehold(storedInviteCode)
          setMode("joiner")
        } else {
          // Person 1: create a new household
          const result = await createHousehold()
          setInviteCode(result.inviteCode)
          setMode("creator")
        }

        localStorage.removeItem(STORAGE_KEY)
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Saving your responses…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {mode === "joiner" ? (
          <ConnectedPanel firstName={firstName} />
        ) : (
          <InvitePanel firstName={firstName} inviteCode={inviteCode ?? ""} />
        )}
      </div>
    </div>
  )
}
