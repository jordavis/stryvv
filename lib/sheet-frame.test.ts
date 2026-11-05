import { describe, expect, it } from "vitest"
import { isKeyboardOpen, SHEET_GAP, SHEET_GAP_TYPING, sheetFrame } from "./sheet-frame"

describe("sheetFrame", () => {
  it("leaves a gap above the sheet when the keyboard is closed", () => {
    expect(sheetFrame({ height: 844, offsetTop: 0 })).toEqual({ top: SHEET_GAP, height: 844 - SHEET_GAP })
  })

  // iPhone Safari: opening the keyboard shrinks the visible area and scrolls it down the page.
  // The sheet must sit inside what's visible, so the message box stays on screen while typing.
  it("stays inside the visible area when iOS scrolls it for the keyboard", () => {
    const visible = { height: 450, offsetTop: 330 }
    const frame = sheetFrame(visible)
    expect(frame.top).toBeGreaterThanOrEqual(visible.offsetTop)
    expect(frame.top + frame.height).toBeLessThanOrEqual(visible.offsetTop + visible.height)
    expect(frame.height).toBeGreaterThanOrEqual(visible.height - SHEET_GAP)
  })
})

describe("sheetFrame with the keyboard open", () => {
  // The page is 844 tall; the keyboard leaves 450 visible, scrolled 330 down.
  const open = { height: 450, offsetTop: 330, pageHeight: 844 }

  it("knows the keyboard is open when much of the page is hidden", () => {
    expect(isKeyboardOpen(open)).toBe(true)
    expect(isKeyboardOpen({ height: 844, offsetTop: 0, pageHeight: 844 })).toBe(false)
  })

  it("shrinks the gap above the sheet, so the messages get the room", () => {
    expect(sheetFrame(open)).toEqual({ top: 330 + SHEET_GAP_TYPING, height: 450 - SHEET_GAP_TYPING })
  })

  it("doesn't mistake a browser bar resize for the keyboard", () => {
    // Safari's toolbar collapsing changes the height by well under a quarter.
    expect(isKeyboardOpen({ height: 780, offsetTop: 0, pageHeight: 844 })).toBe(false)
    expect(sheetFrame({ height: 780, offsetTop: 0, pageHeight: 844 })).toEqual({ top: SHEET_GAP, height: 780 - SHEET_GAP })
  })
})
