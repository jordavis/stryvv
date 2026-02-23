import { Lock } from "lucide-react"

export function SampleComparisonCard() {
  return (
    <div className="relative rounded-2xl border-2 border-dashed border-muted p-6 overflow-hidden">
      {/* Blurred preview content */}
      <div className="space-y-3 blur-sm opacity-50 select-none pointer-events-none">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Partner Comparison
        </p>
        <div className="flex gap-3">
          <div className="flex-1 bg-primary/10 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">YOU</p>
            <p className="font-bold text-sm">The Optimizer</p>
            <div className="space-y-1.5">
              <div className="h-2 bg-primary rounded-full w-4/5" />
              <div className="h-2 bg-primary/50 rounded-full w-3/5" />
              <div className="h-2 bg-primary/25 rounded-full w-2/5" />
            </div>
          </div>
          <div className="flex-1 bg-orange-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">PARTNER</p>
            <p className="font-bold text-sm">The Dreamer</p>
            <div className="space-y-1.5">
              <div className="h-2 bg-orange-400 rounded-full w-3/5" />
              <div className="h-2 bg-orange-300 rounded-full w-4/5" />
              <div className="h-2 bg-orange-200 rounded-full w-1/2" />
            </div>
          </div>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 space-y-1">
          <p className="font-semibold text-sm">Compatibility Insights</p>
          <p className="text-xs text-muted-foreground">
            Detailed analysis of where you align and where you differ across 6 dimensions…
          </p>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
        <div className="bg-white rounded-2xl border shadow-sm p-6 mx-4 text-center space-y-2 max-w-xs">
          <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="font-semibold text-sm">Partner comparison is locked</p>
          <p className="text-xs text-muted-foreground">
            Create an account and invite your partner to unlock a side-by-side comparison of your
            money personalities.
          </p>
        </div>
      </div>
    </div>
  )
}
