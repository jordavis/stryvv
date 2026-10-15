// Turns Supabase Auth errors into what a person sees. One place, unit-tested, so the rules
// that stop the forms revealing who has an account can't quietly drift.
// Supabase's own error text is never shown: it can leak internals.

export const AUTH_MESSAGES = {
  badCredentials: "That email and password don't match.",
  badCode: "That code isn't right or has expired. Check the email, or send a new code.",
  rateLimited: "Too many tries. Wait a minute, then try again.",
  weakPassword: "Choose a different password with at least 8 characters.",
  generic: "Something went wrong on our side. Please try again.",
} as const

export type AuthContext = "signup" | "signin" | "verify" | "resend" | "reset_request" | "reset"

export type AuthOutcome =
  | { kind: "ok" }
  | { kind: "unverified" }
  | { kind: "error"; message: string; field?: "password" | "code" | "email" }

type AuthErrorLike = { code?: string | null; message?: string; status?: number } | null | undefined

export function mapAuthError(error: AuthErrorLike, context: AuthContext): AuthOutcome {
  if (!error) return { kind: "ok" }
  const code = error.code ?? ""

  switch (code) {
    // Signing up with an email that already has an account must look like success.
    case "user_already_exists":
    case "email_exists":
      return context === "signup" ? { kind: "ok" } : { kind: "error", message: AUTH_MESSAGES.generic }

    case "invalid_credentials":
    case "user_not_found":
      return { kind: "error", message: AUTH_MESSAGES.badCredentials }

    case "email_not_confirmed":
      return { kind: "unverified" }

    // Supabase returns otp_expired for both a wrong code and an expired one.
    case "otp_expired":
    case "otp_disabled":
      return { kind: "error", field: "code", message: AUTH_MESSAGES.badCode }

    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return { kind: "error", message: AUTH_MESSAGES.rateLimited }

    case "weak_password":
    case "same_password":
      return { kind: "error", field: "password", message: AUTH_MESSAGES.weakPassword }

    default:
      return { kind: "error", message: AUTH_MESSAGES.generic }
  }
}
