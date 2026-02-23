import { Progress } from "@/components/ui/progress"

interface SurveyProgressProps {
  step: number
  totalSteps: number
}

const stepLabels = [
  "About You",
  "Your Finances",
  "Money Mindsets",
  "Goals & Priorities",
  "Communication",
  "Reflection",
]

export function SurveyProgress({ step, totalSteps }: SurveyProgressProps) {
  const pct = Math.round((step / totalSteps) * 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{stepLabels[step - 1]}</span>
        <span className="text-muted-foreground">
          Step {step} of {totalSteps}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  )
}
