import { describe, expect, it } from "vitest"
import {
  codeSchema,
  emailSchema,
  newPasswordSchema,
  normalizePhone,
  signInSchema,
  signUpSchema,
} from "./auth"

const validSignUp = {
  firstName: "Jordan",
  lastName: "Davis",
  email: "jordan@example.com",
  phone: "(201) 555-0100",
  password: "longenough",
  terms: "on",
}

describe("normalizePhone", () => {
  it("formats a US number entered without a country code", () => {
    expect(normalizePhone("(201) 555-0123")).toBe("+12015550123")
    expect(normalizePhone("201.555.0123")).toBe("+12015550123")
  })

  it("keeps an international number entered with +", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958")
  })

  it("rejects letters, short numbers and empty input", () => {
    expect(normalizePhone("call me")).toBeNull()
    expect(normalizePhone("555-01")).toBeNull()
    expect(normalizePhone("")).toBeNull()
  })
})

describe("signUpSchema", () => {
  it("accepts a valid form and returns cleaned values", () => {
    const result = signUpSchema.safeParse({
      ...validSignUp,
      firstName: "  Jordan ",
      email: " Jordan@Example.com ",
      phone: "(201) 555-0123",
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.firstName).toBe("Jordan")
    expect(result.data.email).toBe("jordan@example.com")
    expect(result.data.phone).toBe("+12015550123")
  })

  it("requires both names, trimmed, up to 100 characters", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, firstName: "   " }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...validSignUp, lastName: "x".repeat(101) }).success).toBe(false)
  })

  it("requires a valid email", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, email: "jordan@" }).success).toBe(false)
  })

  it("requires a password of at least 8 characters", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, password: "short12" }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...validSignUp, password: "exactly8" }).success).toBe(true)
  })

  it("requires a valid phone number", () => {
    const result = signUpSchema.safeParse({ ...validSignUp, phone: "12" })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0].path).toEqual(["phone"])
  })

  it("requires the terms box to be ticked", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, terms: undefined }).success).toBe(false)
    expect(signUpSchema.safeParse({ ...validSignUp, terms: "off" }).success).toBe(false)
  })
})

describe("codeSchema", () => {
  it("accepts exactly six digits, ignoring spaces", () => {
    expect(codeSchema.parse("482 913")).toBe("482913")
    expect(codeSchema.safeParse("48291").success).toBe(false)
    expect(codeSchema.safeParse("4829134").success).toBe(false)
    expect(codeSchema.safeParse("48a913").success).toBe(false)
  })
})

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Me@Example.COM ")).toBe("me@example.com")
  })
})

describe("newPasswordSchema", () => {
  it("needs 8 to 72 characters", () => {
    expect(newPasswordSchema.safeParse("1234567").success).toBe(false)
    expect(newPasswordSchema.safeParse("12345678").success).toBe(true)
    expect(newPasswordSchema.safeParse("x".repeat(73)).success).toBe(false)
  })
})

describe("signInSchema", () => {
  it("needs an email and any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "me@example.com", password: "x" }).success).toBe(true)
    expect(signInSchema.safeParse({ email: "me@example.com", password: "" }).success).toBe(false)
  })
})
