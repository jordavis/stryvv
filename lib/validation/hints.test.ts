import { describe, expect, it } from "vitest"
import { looksLikePhone } from "./hints"

describe("looksLikePhone", () => {
  it("accepts US numbers", () => {
    expect(looksLikePhone("(201) 555-0123")).toBe(true)
  })

  it("accepts short international numbers the server allows", () => {
    // Niue: country code plus a 4-digit number.
    expect(looksLikePhone("+683 4002")).toBe(true)
    // Iceland: country code plus a 7-digit number.
    expect(looksLikePhone("+354 611 1234")).toBe(true)
  })

  it("rejects numbers too short or too long to be real", () => {
    expect(looksLikePhone("555")).toBe(false)
    expect(looksLikePhone("+1 2345 6789 0123 4567")).toBe(false)
  })
})
