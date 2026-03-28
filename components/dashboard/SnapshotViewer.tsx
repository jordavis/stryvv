"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markdownToHtml } from "@/lib/dashboard/markdown"
import { sendSurveyAnalysis } from "@/lib/actions/survey-analysis"

interface SnapshotViewerProps {
  content: string | null
  surveyCount: number
  householdId: string
}

export function SnapshotViewer({ content, surveyCount, householdId }: SnapshotViewerProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setGenError(null)
    const result = await sendSurveyAnalysis(householdId)
    if (result.success) {
      router.refresh()
    } else {
      setGenError(result.error ?? "Something went wrong. Please try again.")
      setGenerating(false)
    }
  }

  if (!content) {
    const heading =
      surveyCount === 0
        ? "Survey Not Completed"
        : surveyCount === 1
          ? "Waiting on Your Partner"
          : "Ready to Generate"

    const body =
      surveyCount === 0
        ? "Complete the onboarding survey to get started. Once both of you finish, your Couples Alignment Snapshot will be generated here."
        : surveyCount === 1
          ? "You're done — now invite your partner to complete the survey. Your Couples Alignment Snapshot will appear here as soon as they finish."
          : "Both surveys are complete. Generate your Couples Alignment Snapshot to see how your money personalities compare."

    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#0b2545" }}
        >
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="text-muted-foreground text-sm max-w-sm">{body}</p>
        {surveyCount >= 2 && (
          <div className="space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              style={{ backgroundColor: "#0b2545" }}
            >
              {generating ? "Generating…" : "Generate Our Snapshot"}
            </Button>
            {genError && <p className="text-destructive text-xs">{genError}</p>}
          </div>
        )}
      </div>
    )
  }

  const html = markdownToHtml(content)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Couples Alignment Snapshot</h1>
        <p className="text-muted-foreground text-sm mt-1">
          A personalized summary of your financial personalities and alignment as a couple.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6 md:p-8">
        <div
          className="prose prose-sm max-w-none text-foreground [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_ul]:my-2 [&_li]:my-0.5 [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
