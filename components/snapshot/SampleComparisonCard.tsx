import { Lock } from "lucide-react"

export function PartnerVennDiagram({ styleEmoji }: { styleEmoji: string }) {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center gap-6 h-36">
        {/* Left circle — user */}
        <div className="w-32 h-32 rounded-full bg-primary/15 border-2 border-primary/30 flex flex-col items-center justify-center gap-1 shrink-0">
          <span className="text-3xl">{styleEmoji}</span>
          <span className="text-xs font-semibold text-primary">You</span>
        </div>

        {/* Right circle — partner */}
        <div className="w-32 h-32 rounded-full bg-orange-100 border-2 border-orange-200 flex flex-col items-center justify-center gap-1 shrink-0">
          <span className="text-3xl text-orange-400">?</span>
          <span className="text-xs font-semibold text-orange-600">Partner</span>
        </div>

        {/* Overlap badge — sits in the gap, slightly overlapping each circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md border border-border px-2 py-1.5 flex flex-col items-center gap-0.5 w-16 text-center">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-[9px] font-medium text-muted-foreground leading-tight">Alignment Score</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs mx-auto">
        Complete the picture. Invite your partner to take the survey and unlock your{" "}
        <span className="font-semibold text-foreground">Couples Snapshot</span>.
      </p>
    </div>
  )
}

// Keep old export for any other potential references
export function SampleComparisonCard() {
  return <PartnerVennDiagram styleEmoji="📊" />
}
