// Where the bottom sheet sits on a phone, given the part of the page the person can see.

/** The gap above the sheet that shows the page behind it. */
export const SHEET_GAP = 40

/** The visible part of the page (window.visualViewport): its height and how far iOS has scrolled it. */
export type VisibleArea = { height: number; offsetTop: number }

/**
 * Places the sheet inside the visible area. On iPhone, opening the keyboard both shrinks the visible
 * area and scrolls it down the page (offsetTop), so a sheet pinned to the top of the page would end
 * up above the screen. Following offsetTop keeps the message box in view while typing.
 */
export function sheetFrame(visible: VisibleArea): { top: number; height: number } {
  return { top: Math.max(0, visible.offsetTop) + SHEET_GAP, height: Math.max(0, visible.height - SHEET_GAP) }
}
