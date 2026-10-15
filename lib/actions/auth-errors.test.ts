import { describe, expect, it } from "vitest"
import { AUTH_MESSAGES, mapAuthError } from "./auth-errors"

describe("mapAuthError", () => {
  it("never reveals whether an account exists when signing in", () => {
    // Wrong password and unknown email both come back from Supabase as invalid_credentials.
    expect(mapAuthError({ code: "invalid_credentials" }, "signin")).toEqual({
      kind: "error",
      message: AUTH_MESSAGES.badCredentials,
    })
  })

  it("treats an already-registered email at signup as success", () => {
    expect(mapAuthError({ code: "user_already_exists" }, "signup")).toEqual({ kind: "ok" })
    expect(mapAuthError({ code: "email_exists" }, "signup")).toEqual({ kind: "ok" })
  })

  it("sends an unverified person to verify instead of failing", () => {
    expect(mapAuthError({ code: "email_not_confirmed" }, "signin")).toEqual({ kind: "unverified" })
  })

  it("uses one message for wrong and expired codes, because Supabase can't tell them apart", () => {
    expect(mapAuthError({ code: "otp_expired" }, "verify")).toEqual({
      kind: "error",
      field: "code",
      message: AUTH_MESSAGES.badCode,
    })
  })

  it("asks people to wait when rate limited", () => {
    for (const code of ["over_email_send_rate_limit", "over_request_rate_limit"]) {
      expect(mapAuthError({ code }, "resend")).toEqual({
        kind: "error",
        message: AUTH_MESSAGES.rateLimited,
      })
    }
  })

  it("explains a rejected password", () => {
    expect(mapAuthError({ code: "weak_password" }, "signup")).toEqual({
      kind: "error",
      field: "password",
      message: AUTH_MESSAGES.weakPassword,
    })
  })

  it("never passes Supabase's own message through", () => {
    const mapped = mapAuthError(
      { code: "unexpected_failure", message: "duplicate key value violates unique constraint" },
      "signup"
    )
    expect(mapped).toEqual({ kind: "error", message: AUTH_MESSAGES.generic })
  })

  it("reports success when there is no error", () => {
    expect(mapAuthError(null, "verify")).toEqual({ kind: "ok" })
  })
})
