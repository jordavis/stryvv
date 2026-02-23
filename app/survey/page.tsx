"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSurvey } from "@/lib/context/survey-context"

function SurveyRedirect() {
  const { state, setInviteCode } = useSurvey()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const invite = searchParams.get("invite")
    if (invite) {
      setInviteCode(invite.toUpperCase())
    }
    const step = Math.min(state.currentStep, 6)
    router.replace(`/survey/${step}`)
  }, [state.currentStep, router, searchParams, setInviteCode])

  return null
}

export default function SurveyIndexPage() {
  return (
    <Suspense>
      <SurveyRedirect />
    </Suspense>
  )
}
