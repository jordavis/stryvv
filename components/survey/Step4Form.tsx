"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step4Schema, type Step4Data } from "@/lib/validations/survey"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const goalAlignmentOptions = [
  {
    value: "very_aligned",
    label: "Very aligned",
    desc: "We agree on almost everything financially",
  },
  {
    value: "mostly_aligned",
    label: "Mostly aligned",
    desc: "We agree on the big things",
  },
  {
    value: "somewhat_aligned",
    label: "Somewhat aligned",
    desc: "We agree on some things but not others",
  },
  {
    value: "rarely_aligned",
    label: "Rarely aligned",
    desc: "We often see things differently",
  },
  {
    value: "not_at_all",
    label: "Not aligned at all",
    desc: "We have very different money views",
  },
]

const priorityOptions = [
  { value: "pay_off_debt", label: "Pay off debt" },
  { value: "build_emergency_fund", label: "Build emergency fund" },
  { value: "save_for_home", label: "Save for a home" },
  { value: "invest_for_retirement", label: "Invest for retirement" },
  { value: "grow_wealth", label: "Grow wealth / invest" },
  { value: "save_for_family", label: "Save for family / kids" },
  { value: "travel_experiences", label: "Travel & experiences" },
  { value: "financial_freedom", label: "Financial freedom" },
]

export function Step4Form() {
  const { state, saveStep } = useSurvey()
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      q16_goal_alignment: state.answers.q16_goal_alignment,
      q17_financial_priority: state.answers.q17_financial_priority,
    },
  })

  const alignment = watch("q16_goal_alignment")
  const priority = watch("q17_financial_priority")

  const onSubmit = (data: Step4Data) => saveStep(4, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Goal alignment */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          How aligned are you and your partner on financial goals?
        </Label>
        <RadioGroup
          value={alignment}
          onValueChange={(v) =>
            setValue("q16_goal_alignment", v as Step4Data["q16_goal_alignment"], {
              shouldValidate: true,
            })
          }
        >
          <div className="space-y-2">
            {goalAlignmentOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  alignment === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </label>
            ))}
          </div>
        </RadioGroup>
        {errors.q16_goal_alignment && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Financial priority */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          What's your biggest financial priority right now?
        </Label>
        <RadioGroup
          value={priority}
          onValueChange={(v) =>
            setValue("q17_financial_priority", v as Step4Data["q17_financial_priority"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {priorityOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-sm text-center transition-all",
                  priority === opt.value
                    ? "border-primary bg-primary/5 font-medium text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </RadioGroup>
        {errors.q17_financial_priority && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      <StepNavigation step={4} isSubmitting={isSubmitting} />
    </form>
  )
}
