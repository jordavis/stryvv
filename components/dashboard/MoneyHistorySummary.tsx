import { markdownToHtml } from "@/lib/dashboard/markdown"

interface MoneyHistorySummaryProps {
  mySummary: string
  partnerName: string
  partnerSummary: string | null
}

export function MoneyHistorySummary({
  mySummary,
  partnerName,
  partnerSummary,
}: MoneyHistorySummaryProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Money History Summaries</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Understanding each other&apos;s money story is the foundation of financial alignment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Summary */}
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: "#0b2545" }}
            >
              Me
            </div>
            <h2 className="font-semibold text-sm">My Money History</h2>
          </div>
          <div
            className="text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: markdownToHtml(mySummary),
            }}
          />
        </div>

        {/* Partner Summary */}
        <div className="rounded-2xl border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: "#0b2545", opacity: 0.7 }}
            >
              {partnerName ? partnerName[0].toUpperCase() : "P"}
            </div>
            <h2 className="font-semibold text-sm">{partnerName || "Partner"}&apos;s Money History</h2>
          </div>
          {partnerSummary ? (
            <div
              className="text-sm leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: markdownToHtml(partnerSummary),
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {partnerName || "Your partner"} hasn&apos;t completed their money history yet. Once
              they do, their summary will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
