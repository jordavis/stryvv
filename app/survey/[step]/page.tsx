import { notFound } from "next/navigation"
import { SurveyWizard } from "@/components/survey/SurveyWizard"

export default async function SurveyStepPage({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  const { step: stepParam } = await params
  const step = parseInt(stepParam, 10)
  if (isNaN(step) || step < 1 || step > 6) notFound()
  return <SurveyWizard step={step} totalSteps={6} />
}
