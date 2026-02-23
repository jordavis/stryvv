"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step5Schema, type Step5Data } from "@/lib/validations/survey"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const frequencyOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "occasionally", label: "Occasionally" },
  { value: "rarely", label: "Rarely" },
  { value: "almost_never", label: "Almost never" },
]

const conversationFeelingOptions = [
  { value: "easy_productive", label: "Easy & productive", desc: "We communicate well" },
  {
    value: "somewhat_tense",
    label: "Somewhat tense",
    desc: "Some friction, but we manage",
  },
  {
    value: "one_sided",
    label: "One-sided",
    desc: "One of us drives the conversation",
  },
  {
    value: "emotionally_charged",
    label: "Emotionally charged",
    desc: "Often leads to stress or arguments",
  },
  {
    value: "we_avoid_them",
    label: "We avoid them",
    desc: "We don't really talk about money",
  },
]

export function Step5Form() {
  const { state, saveStep } = useSurvey()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      q18_favorite_treat: state.answers.q18_favorite_treat ?? "",
      q19_joy_spending_moment: state.answers.q19_joy_spending_moment ?? "",
      q20_discussion_frequency: state.answers.q20_discussion_frequency,
      q21_conversation_feeling: state.answers.q21_conversation_feeling,
      q22_biggest_challenge: state.answers.q22_biggest_challenge ?? "",
      q23_biggest_win: state.answers.q23_biggest_win ?? "",
    },
  })

  const frequency = watch("q20_discussion_frequency")
  const feeling = watch("q21_conversation_feeling")

  const onSubmit = (data: Step5Data) => saveStep(5, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Favorite treat */}
      <div className="space-y-2">
        <Label htmlFor="treat" className="text-base font-semibold">
          What's your favorite little treat or splurge?
        </Label>
        <p className="text-sm text-muted-foreground">Something you buy just for the joy of it.</p>
        <Input
          id="treat"
          placeholder="e.g. good coffee, a new book, takeout"
          {...register("q18_favorite_treat")}
          className={errors.q18_favorite_treat ? "border-destructive" : ""}
        />
        {errors.q18_favorite_treat && (
          <p className="text-sm text-destructive">{errors.q18_favorite_treat.message}</p>
        )}
      </div>

      {/* Joy spending moment */}
      <div className="space-y-2">
        <Label htmlFor="joy" className="text-base font-semibold">
          Describe a time spending money brought you real joy
        </Label>
        <Textarea
          id="joy"
          placeholder="Tell us about a purchase or experience that felt genuinely worth it…"
          rows={3}
          {...register("q19_joy_spending_moment")}
          className={errors.q19_joy_spending_moment ? "border-destructive" : ""}
        />
        {errors.q19_joy_spending_moment && (
          <p className="text-sm text-destructive">{errors.q19_joy_spending_moment.message}</p>
        )}
      </div>

      {/* Discussion frequency */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          How often do you talk about money with your partner?
        </Label>
        <RadioGroup
          value={frequency}
          onValueChange={(v) =>
            setValue("q20_discussion_frequency", v as Step5Data["q20_discussion_frequency"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {frequencyOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-sm text-center transition-all",
                  frequency === opt.value
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
        {errors.q20_discussion_frequency && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Conversation feeling */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">How do money conversations usually feel?</Label>
        <RadioGroup
          value={feeling}
          onValueChange={(v) =>
            setValue("q21_conversation_feeling", v as Step5Data["q21_conversation_feeling"], {
              shouldValidate: true,
            })
          }
        >
          <div className="space-y-2">
            {conversationFeelingOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  feeling === opt.value
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
        {errors.q21_conversation_feeling && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Biggest challenge */}
      <div className="space-y-2">
        <Label htmlFor="challenge" className="text-base font-semibold">
          What's your biggest financial challenge as a couple?
        </Label>
        <Textarea
          id="challenge"
          placeholder="e.g. disagreeing on spending, not saving enough, managing debt…"
          rows={3}
          {...register("q22_biggest_challenge")}
          className={errors.q22_biggest_challenge ? "border-destructive" : ""}
        />
        {errors.q22_biggest_challenge && (
          <p className="text-sm text-destructive">{errors.q22_biggest_challenge.message}</p>
        )}
      </div>

      {/* Biggest win */}
      <div className="space-y-2">
        <Label htmlFor="win" className="text-base font-semibold">
          What's your biggest financial win as a couple?
        </Label>
        <Textarea
          id="win"
          placeholder="e.g. paid off a credit card, saved for a vacation, bought our first home…"
          rows={3}
          {...register("q23_biggest_win")}
          className={errors.q23_biggest_win ? "border-destructive" : ""}
        />
        {errors.q23_biggest_win && (
          <p className="text-sm text-destructive">{errors.q23_biggest_win.message}</p>
        )}
      </div>

      <StepNavigation step={5} isSubmitting={isSubmitting} />
    </form>
  )
}
