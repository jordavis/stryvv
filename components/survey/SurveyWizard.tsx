"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSurvey } from "@/lib/context/survey-context"
import { SurveyProgress } from "./SurveyProgress"
import { Step1Form } from "./Step1Form"
import { Step2Form } from "./Step2Form"
import { Step3Form } from "./Step3Form"
import { Step4Form } from "./Step4Form"
import { Step5Form } from "./Step5Form"
import { Step6Form } from "./Step6Form"

const stepComponents = {
  1: Step1Form,
  2: Step2Form,
  3: Step3Form,
  4: Step4Form,
  5: Step5Form,
  6: Step6Form,
} as const

interface SurveyWizardProps {
  step: number
  totalSteps: number
}

export function SurveyWizard({ step, totalSteps }: SurveyWizardProps) {
  const { state } = useSurvey()
  const router = useRouter()

  // Guard: don't allow jumping ahead of highest reached step
  useEffect(() => {
    if (step > state.highestStep) {
      router.replace(`/survey/${state.highestStep}`)
    }
  }, [step, state.highestStep, router])

  // Navigate when currentStep advances after saveStep()
  useEffect(() => {
    if (state.currentStep !== step) {
      if (state.currentStep > 6) {
        router.push("/survey/complete")
      } else {
        router.push(`/survey/${state.currentStep}`)
      }
    }
  }, [state.currentStep, step, router])

  const StepForm = stepComponents[step as keyof typeof stepComponents]
  if (!StepForm) return null

  return (
    <div className="space-y-8">
      <SurveyProgress step={step} totalSteps={totalSteps} />
      <StepForm />
    </div>
  )
}
