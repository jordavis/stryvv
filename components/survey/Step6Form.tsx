"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step6Schema, type Step6Data } from "@/lib/validations/survey"
import { QUESTION_BY_KEY } from "@/lib/constants/survey-questions"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const reflectionOptions = [
  {
    value: "very_positive",
    label: "🌟 Honestly, pretty great",
    desc: "We've got this — and we know it",
  },
  {
    value: "positive",
    label: "😊 Good vibes overall",
    desc: "Not perfect, but we're heading in the right direction",
  },
  {
    value: "neutral",
    label: "🤷 It's complicated",
    desc: "Some wins, some work to do — classic us",
  },
  {
    value: "uneasy",
    label: "😟 A little stressed, not gonna lie",
    desc: "There are things keeping me up at night",
  },
  {
    value: "concerned",
    label: "😰 We really need to talk",
    desc: "This survey just confirmed what I already knew",
  },
]

export function Step6Form() {
  const { state, saveStep } = useSurvey()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      q_reflection_feeling: state.answers.q_reflection_feeling,
      q_discuss_with_partner: state.answers.q_discuss_with_partner ?? "",
    },
  })

  const reflection = watch("q_reflection_feeling")

  const onSubmit = (data: Step6Data) => saveStep(6, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Reflection feeling */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{QUESTION_BY_KEY.q_reflection_feeling}</Label>
        <RadioGroup
          value={reflection}
          onValueChange={(v) =>
            setValue("q_reflection_feeling", v as Step6Data["q_reflection_feeling"], {
              shouldValidate: true,
            })
          }
        >
          <div className="space-y-2">
            {reflectionOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  reflection === opt.value
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
        {errors.q_reflection_feeling && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Discuss with partner */}
      <div className="space-y-2">
        <Label htmlFor="discuss" className="text-base font-semibold">
          {QUESTION_BY_KEY.q_discuss_with_partner}
        </Label>
        <Textarea
          id="discuss"
          placeholder="Something you want to bring up, work through, or celebrate together…"
          rows={4}
          {...register("q_discuss_with_partner")}
          className={errors.q_discuss_with_partner ? "border-destructive" : ""}
        />
        {errors.q_discuss_with_partner && (
          <p className="text-sm text-destructive">{errors.q_discuss_with_partner.message}</p>
        )}
      </div>

<StepNavigation step={6} isSubmitting={isSubmitting} />
    </form>
  )
}
