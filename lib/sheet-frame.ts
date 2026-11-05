// Where the bottom sheet sits on a phone, given the part of the page the person can see.

/** The gap above the sheet that shows the page behind it. */
export const SHEET_GAP = 40

/** The visible part of the page (window.visualViewport): its height and how far iOS has scrolled it. */
export type VisibleArea = { height: number; offsetTop: number }

export function sheetFrame(visible: VisibleArea): { top: number; height: number } {
  return { top: SHEET_GAP, height: visible.height - SHEET_GAP }
}
