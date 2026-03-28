import { Crosshair } from "lucide-react"

export default function GoalsPage() {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="rounded-2xl border bg-card p-8 max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0b2545" }}>
            <Crosshair className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
            Coming Soon
          </div>
          <h1 className="text-xl font-bold mt-2">Goals</h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Set and track your shared financial goals — from building an emergency fund to saving for
          your dream home. Stryvv will help you stay aligned and celebrate milestones together.
        </p>
      </div>
    </div>
  )
}
