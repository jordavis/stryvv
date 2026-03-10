"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step2Schema, type Step2Data } from "@/lib/validations/survey"
import { QUESTION_BY_KEY } from "@/lib/constants/survey-questions"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const structureOptions = [
  {
    value: "fully_joint",
    label: "Fully joint",
    desc: "All income and expenses are shared",
  },
  {
    value: "partially",
    label: "Partially combined",
    desc: "Some shared accounts, some separate",
  },
  {
    value: "separate",
    label: "Fully separate",
    desc: "We each manage our own money",
  },
]

const managerOptions = [
  { value: "i_do", label: "I do" },
  { value: "partner", label: "My partner" },
  { value: "share_equally", label: "We share equally" },
  { value: "not_defined", label: "Not really defined" },
]

const satisfactionLabels = ["Yikes 😬", "Meh 😐", "Getting there 🙂", "Pretty good 😊", "Crushing it 🎉"]

export function Step2Form() {
  const { state, saveStep } = useSurvey()
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      q8_finance_structure: state.answers.q8_finance_structure,
      q9_finance_manager: state.answers.q9_finance_manager,
      q10_satisfaction: state.answers.q10_satisfaction,
    },
  })

  const structure = watch("q8_finance_structure")
  const manager = watch("q9_finance_manager")
  const satisfaction = watch("q10_satisfaction")

  const onSubmit = (data: Step2Data) => saveStep(2, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Finance structure */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q8_finance_structure}</Label>
        <RadioGroup
          value={structure}
          onValueChange={(v) =>
            setValue("q8_finance_structure", v as Step2Data["q8_finance_structure"], {
              shouldValidate: true,
            })
          }
        >
          <div className="space-y-2">
            {structureOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  structure === opt.value
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
        {errors.q8_finance_structure && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Finance manager */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q9_finance_manager}</Label>
        <RadioGroup
          value={manager}
          onValueChange={(v) =>
            setValue("q9_finance_manager", v as Step2Data["q9_finance_manager"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {managerOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-sm text-center transition-all",
                  manager === opt.value
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
        {errors.q9_finance_manager && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Satisfaction rating */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q10_satisfaction}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setValue("q10_satisfaction", n, { shouldValidate: true })}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                satisfaction === n
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span className="text-lg font-bold">{n}</span>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {satisfactionLabels[n - 1]}
              </span>
            </button>
          ))}
        </div>
        {errors.q10_satisfaction && (
          <p className="text-sm text-destructive">Please select a rating</p>
        )}
      </div>

      <StepNavigation step={2} isSubmitting={isSubmitting} />
    </form>
  )
}
