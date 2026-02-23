"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface StepNavigationProps {
  step: number
  isSubmitting?: boolean
}

export function StepNavigation({ step, isSubmitting }: StepNavigationProps) {
  const router = useRouter()

  const handleBack = () => {
    if (step === 1) {
      router.push("/")
    } else {
      router.push(`/survey/${step - 1}`)
    }
  }

  return (
    <div className="flex items-center justify-between pt-6">
      <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : step === 6 ? "Complete Survey" : "Continue"}
      </Button>
    </div>
  )
}
