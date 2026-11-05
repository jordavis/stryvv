// Where the bottom sheet sits on a phone, given the part of the page the person can see.

/** The gap above the sheet that shows the page behind it. */
export const SHEET_GAP = 40
/** A smaller gap while typing: with the keyboard open, every line counts. */
export const SHEET_GAP_TYPING = 8

/**
 * The visible part of the page (window.visualViewport): its height and how far iOS has scrolled it.
 * `pageHeight` is the full page height (window.innerHeight), used to tell when the keyboard is open.
 */
export type VisibleArea = { height: number; offsetTop: number; pageHeight?: number }

/**
 * The keyboard is open when it hides more than a quarter of the page. Safari's toolbar collapsing or
 * expanding changes the visible height by much less, so it doesn't count.
 */
export function isKeyboardOpen(visible: VisibleArea): boolean {
  if (!visible.pageHeight) return false
  return visible.height < visible.pageHeight * 0.75
}

/**
 * Places the sheet inside the visible area. On iPhone, opening the keyboard both shrinks the visible
 * area and scrolls it down the page (offsetTop), so a sheet pinned to the top of the page would end
 * up above the screen. Following offsetTop keeps the message box in view while typing.
 */
export function sheetFrame(visible: VisibleArea): { top: number; height: number } {
  const gap = isKeyboardOpen(visible) ? SHEET_GAP_TYPING : SHEET_GAP
  return { top: Math.max(0, visible.offsetTop) + gap, height: Math.max(0, visible.height - gap) }
}
