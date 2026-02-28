"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step1Schema, type Step1Data } from "@/lib/validations/survey"
import { QUESTION_BY_KEY } from "@/lib/constants/survey-questions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const partnerOptions = [
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
]

const durationOptions = [
  { value: "less_than_1yr", label: "Less than 1 year" },
  { value: "1_to_3yr", label: "1–3 years" },
  { value: "4_to_7yr", label: "4–7 years" },
  { value: "8_to_15yr", label: "8–15 years" },
  { value: "16_to_25yr", label: "16–25 years" },
  { value: "25_plus_yr", label: "25+ years" },
]

export function Step1Form() {
  const { state, saveStep } = useSurvey()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      q5_nickname: state.answers.q5_nickname ?? "",
      q6_partner_type: state.answers.q6_partner_type,
      q7_relationship_duration: state.answers.q7_relationship_duration,
    },
  })

  const partnerType = watch("q6_partner_type")
  const duration = watch("q7_relationship_duration")

  const onSubmit = (data: Step1Data) => saveStep(1, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-base font-semibold">
          {QUESTION_BY_KEY.q5_nickname}
        </Label>
        <Input
          id="nickname"
          placeholder="e.g. Alex"
          {...register("q5_nickname")}
          className={errors.q5_nickname ? "border-destructive" : ""}
        />
        {errors.q5_nickname && (
          <p className="text-sm text-destructive">{errors.q5_nickname.message}</p>
        )}
      </div>

      {/* Partner type */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q6_partner_type}</Label>
        <RadioGroup
          value={partnerType}
          onValueChange={(v) =>
            setValue("q6_partner_type", v as Step1Data["q6_partner_type"], { shouldValidate: true })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {partnerOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium",
                  partnerType === opt.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                )}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </RadioGroup>
        {errors.q6_partner_type && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Relationship duration */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q7_relationship_duration}</Label>
        <RadioGroup
          value={duration}
          onValueChange={(v) =>
            setValue("q7_relationship_duration", v as Step1Data["q7_relationship_duration"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {durationOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all text-sm",
                  duration === opt.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-primary/40"
                )}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </RadioGroup>
        {errors.q7_relationship_duration && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      <StepNavigation step={1} isSubmitting={isSubmitting} />
    </form>
  )
}
