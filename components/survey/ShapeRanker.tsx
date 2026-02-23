"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ShapeId } from "@/lib/types/survey"

const shapes: { id: ShapeId; label: string; src: string }[] = [
  { id: "circle", label: "Circle", src: "/images/survey/shapes/circle.png" },
  { id: "square", label: "Square", src: "/images/survey/shapes/square.png" },
  { id: "triangle", label: "Triangle", src: "/images/survey/shapes/triangle.png" },
  { id: "squiggle", label: "Squiggle", src: "/images/survey/shapes/squiggle.png" },
]

interface ShapeRankerProps {
  value: ShapeId[]
  onChange: (value: ShapeId[]) => void
}

export function ShapeRanker({ value, onChange }: ShapeRankerProps) {
  const rankOf = (id: ShapeId): number | null => {
    const idx = value.indexOf(id)
    return idx === -1 ? null : idx + 1
  }

  const handleClick = (id: ShapeId) => {
    const idx = value.indexOf(id)
    if (idx !== -1) {
      // Already ranked — remove it and everything after
      onChange(value.slice(0, idx))
    } else if (value.length < 4) {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click each shape in order from most to least like you (1 = most like you). Click again to deselect.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {shapes.map((shape) => {
          const rank = rankOf(shape.id)
          const ranked = rank !== null
          return (
            <button
              key={shape.id}
              type="button"
              onClick={() => handleClick(shape.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                ranked
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-white"
              )}
            >
              <div className="relative w-16 h-16">
                <Image
                  src={shape.src}
                  alt={shape.label}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="text-xs text-muted-foreground">{shape.label}</span>
              {ranked && (
                <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
                  {rank}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {value.length > 0 && value.length < 4 && (
        <p className="text-sm text-muted-foreground">{4 - value.length} more to rank…</p>
      )}
      {value.length === 4 && (
        <p className="text-sm text-green-600 font-medium">All shapes ranked!</p>
      )}
    </div>
  )
}
