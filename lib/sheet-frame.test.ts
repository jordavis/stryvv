import { describe, expect, it } from "vitest"
import { SHEET_GAP, sheetFrame } from "./sheet-frame"

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
