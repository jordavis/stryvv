"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step6Schema, type Step6Data } from "@/lib/validations/survey"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const reflectionOptions = [
  {
    value: "very_positive",
    label: "Very positive",
    desc: "I feel great about where we are",
  },
  {
    value: "positive",
    label: "Positive",
    desc: "Things are going well overall",
  },
  {
    value: "neutral",
    label: "Neutral",
    desc: "It's a mixed picture",
  },
  {
    value: "uneasy",
    label: "Uneasy",
    desc: "Some things are worrying me",
  },
  {
    value: "concerned",
    label: "Concerned",
    desc: "We have significant work to do",
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
      q_missed_question: state.answers.q_missed_question ?? "",
    },
  })

  const reflection = watch("q_reflection_feeling")

  const onSubmit = (data: Step6Data) => saveStep(6, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Reflection feeling */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Reflecting on your financial life together, how do you feel?
        </Label>
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
          What's one thing you'd most like to discuss with your partner?
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

      {/* Missed question (optional) */}
      <div className="space-y-2">
        <Label htmlFor="missed" className="text-base font-semibold">
          Anything we should have asked but didn&apos;t?{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="missed"
          placeholder="A question, topic, or thought you'd like to share…"
          rows={3}
          {...register("q_missed_question")}
        />
      </div>

      <StepNavigation step={6} isSubmitting={isSubmitting} />
    </form>
  )
}
