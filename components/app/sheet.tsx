"use client"

import { Dialog } from "radix-ui"
import { useEffect, useState } from "react"
import { figtree, manrope } from "@/lib/fonts"
import { sheetFrame } from "@/lib/sheet-frame"
import { cn } from "@/lib/utils"

/**
 * A sheet over the page. On a phone it fills the visible area below a 40px gap that shows the page
 * behind it, and follows the on-screen keyboard so the message box stays in view. On a wider screen
 * it's a centred panel up to 560px wide.
 *
 * It renders in a portal, outside AppShell, so it carries the design-system tokens and fonts itself.
 * It can't be dismissed by tapping outside or pressing Escape: the content offers its own way out.
 */
export function Sheet({ open, title, children }: { open: boolean; title: string; children: React.ReactNode }) {
  const frame = useSheetFrame()

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        {/* Dim and blur the page behind, so nothing behind the sheet reads as part of it (in dark mode a
            plain tint barely shows against the dark page). */}
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(4,14,28,0.62)] backdrop-blur-[3px]" />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          // CSS variables, not top/height, so the desktop (sm:) classes below still win on wide screens.
          style={
            frame
              ? ({ "--sv-sheet-top": `${frame.top}px`, "--sv-sheet-height": `${frame.height}px` } as React.CSSProperties)
              : undefined
          }
          className={cn(
            "stryvv-app",
            manrope.variable,
            figtree.variable,
            "fixed inset-x-0 top-[var(--sv-sheet-top,40px)] z-50 flex h-[var(--sv-sheet-height,calc(100dvh-40px))] flex-col overflow-hidden",
            "rounded-t-sv-lg border border-sv-border shadow-sv-card outline-none",
            "sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:h-[min(780px,calc(100dvh-64px))] sm:w-[min(560px,calc(100vw-32px))]",
            "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sv-lg"
          )}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * The sheet's place on a phone, from the visible part of the page. iPhone Safari doesn't resize the
 * page for the keyboard: it shrinks the visible area and scrolls it (both reported by visualViewport,
 * through "resize" and "scroll"), so the sheet has to follow both.
 */
function useSheetFrame(): { top: number; height: number } | null {
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => setFrame(sheetFrame({ height: viewport.height, offsetTop: viewport.offsetTop }))
    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])
  return frame
}
