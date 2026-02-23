"use client"

import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSurvey } from "@/lib/context/survey-context"
import { step3Schema, type Step3Data } from "@/lib/validations/survey"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShapeRanker } from "./ShapeRanker"
import { StepNavigation } from "./StepNavigation"
import { cn } from "@/lib/utils"

const saveVsYoloOptions = [
  { value: "saver", label: "I'm a Saver", desc: "Future-focused, loves planning ahead" },
  { value: "yolo", label: "I'm a YOLOer", desc: "Lives in the moment, enjoys spending" },
  { value: "balance", label: "A little of both", desc: "Somewhere in the middle" },
]

const moneyStyles = [
  { value: "optimizer", label: "The Optimizer", desc: "Spreadsheets, plans, max efficiency" },
  { value: "dreamer", label: "The Dreamer", desc: "Big goals and optimistic outlooks" },
  { value: "worrier", label: "The Worrier", desc: "Anxious about money, prioritizes security" },
  { value: "avoider", label: "The Avoider", desc: "Prefers not to think about finances" },
]

const learningStyles = [
  { value: "visual", label: "Visual", desc: "Charts, graphs, visuals" },
  { value: "auditory", label: "Auditory", desc: "Podcasts, talking it through" },
  { value: "reading_writing", label: "Reading/Writing", desc: "Articles, notes, lists" },
  { value: "kinesthetic", label: "Hands-on", desc: "Doing and experimenting" },
  { value: "idk", label: "Not sure", desc: "Haven't thought about it" },
]

export function Step3Form() {
  const { state, saveStep } = useSurvey()
  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      q11_save_vs_yolo: state.answers.q11_save_vs_yolo ?? "",
      q12_my_money_style: state.answers.q12_my_money_style,
      q13_partner_money_style: state.answers.q13_partner_money_style,
      q14_shape_ranking: state.answers.q14_shape_ranking ?? [],
      q15_learning_style: state.answers.q15_learning_style,
    },
  })

  const saveVsYolo = watch("q11_save_vs_yolo")
  const myStyle = watch("q12_my_money_style")
  const partnerStyle = watch("q13_partner_money_style")
  const learningStyle = watch("q15_learning_style")

  const onSubmit = (data: Step3Data) => saveStep(3, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Save vs YOLO */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">When it comes to spending, which are you?</Label>
        <div className="rounded-xl overflow-hidden border border-border mb-3">
          <Image
            src="/images/survey/save-vs-yolo.png"
            alt="Saver vs YOLO spender"
            width={600}
            height={200}
            className="w-full object-cover"
            unoptimized
          />
        </div>
        <RadioGroup
          value={saveVsYolo}
          onValueChange={(v) => setValue("q11_save_vs_yolo", v, { shouldValidate: true })}
        >
          <div className="space-y-2">
            {saveVsYoloOptions.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  saveVsYolo === opt.value
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
        {errors.q11_save_vs_yolo && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* My money style */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">My money personality is…</Label>
        <RadioGroup
          value={myStyle}
          onValueChange={(v) =>
            setValue("q12_my_money_style", v as Step3Data["q12_my_money_style"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {moneyStyles.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  myStyle === opt.value
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
        {errors.q12_my_money_style && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Partner money style */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">My partner's money personality is…</Label>
        <RadioGroup
          value={partnerStyle}
          onValueChange={(v) =>
            setValue("q13_partner_money_style", v as Step3Data["q13_partner_money_style"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {moneyStyles.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  partnerStyle === opt.value
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
        {errors.q13_partner_money_style && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      {/* Shape ranking */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Rank these shapes from most to least like your personality
        </Label>
        <Controller
          name="q14_shape_ranking"
          control={control}
          render={({ field }) => (
            <ShapeRanker value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.q14_shape_ranking && (
          <p className="text-sm text-destructive">Please rank all 4 shapes</p>
        )}
      </div>

      {/* Learning style */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">How do you best learn new information?</Label>
        <RadioGroup
          value={learningStyle}
          onValueChange={(v) =>
            setValue("q15_learning_style", v as Step3Data["q15_learning_style"], {
              shouldValidate: true,
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            {learningStyles.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col gap-0.5 p-3 rounded-xl border-2 cursor-pointer transition-all",
                  learningStyle === opt.value
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
        {errors.q15_learning_style && (
          <p className="text-sm text-destructive">Please select one</p>
        )}
      </div>

      <StepNavigation step={3} isSubmitting={isSubmitting} />
    </form>
  )
}
