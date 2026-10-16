"use server"

import { redirect } from "next/navigation"
import { forgetEmail, recalledEmail, rememberEmail } from "@/lib/auth/remembered-email"
import { createClient } from "@/lib/supabase/server"
import { TERMS_VERSION } from "@/lib/terms"
import { codeSchema, emailSchema, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth"
import { AUTH_MESSAGES, mapAuthError, mapResetRequestError } from "./auth-errors"

// Sign-up, verification, sign-in, password reset and sign-out.
// Every action validates on the server and uses the session client, so RLS applies.
// Nothing here logs names, emails or phone numbers: errors are logged by code only.

export type AuthFormState = {
  status: "idle" | "error" | "sent"
  message?: string
  fieldErrors?: Partial<Record<string, string>>
  /** Values to put back in the form after an error. Never includes passwords or codes. */
  values?: Record<string, string>
}

function firstErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form")
    out[key] ??= issue.message
  }
  return out
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

function logAuthError(step: string, error: { code?: string | null; status?: number } | null) {
  if (error) console.error(`[auth] ${step} failed`, { code: error.code ?? "unknown", status: error.status })
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = {
    firstName: text(formData, "firstName") ?? "",
    lastName: text(formData, "lastName") ?? "",
    email: text(formData, "email") ?? "",
    phone: text(formData, "phone") ?? "",
  }
  const parsed = signUpSchema.safeParse({
    ...values,
    password: text(formData, "password"),
    terms: text(formData, "terms"),
  })
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors(parsed.error.issues), values }
  }

  const { firstName, lastName, email, phone, password } = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    // Copied into the profile by the on_auth_user_created trigger.
    options: { data: { first_name: firstName, last_name: lastName, phone } },
  })

  // An email that already has an account maps to "ok": the person sees the same next step.
  const outcome = mapAuthError(error, "signup")
  if (outcome.kind === "error") {
    logAuthError("signUp", error)
    const fieldErrors = outcome.field ? { [outcome.field]: outcome.message } : undefined
    return { status: "error", message: outcome.field ? undefined : outcome.message, fieldErrors, values }
  }

  await rememberEmail("pending", email)
  redirect("/verify")
}

export async function verifyCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await recalledEmail("pending")
  if (!email) {
    return { status: "error", message: "This code screen has expired. Sign in or sign up again to get a new code." }
  }

  const code = codeSchema.safeParse(text(formData, "code"))
  if (!code.success) {
    return { status: "error", fieldErrors: { code: code.error.issues[0].message } }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token: code.data, type: "email" })
  const outcome = mapAuthError(error, "verify")
  if (outcome.kind === "error") {
    logAuthError("verifyOtp", error)
    return outcome.field === "code"
      ? { status: "error", fieldErrors: { code: outcome.message } }
      : { status: "error", message: outcome.message }
  }

  // Everyone who reaches a code ticked the terms box at sign-up; record which version, server-side.
  // If this fails, the signed-in layout records it on the next page (recordTermsIfMissing).
  const { error: termsError } = await supabase.rpc("accept_terms", { _version: TERMS_VERSION })
  logAuthError("accept_terms", termsError)

  await forgetEmail("pending")
  redirect("/welcome")
}

export async function resendCode(): Promise<AuthFormState> {
  const email = await recalledEmail("pending")
  if (!email) {
    return { status: "error", message: "This code screen has expired. Sign in or sign up again to get a new code." }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: "signup", email })
  const outcome = mapAuthError(error, "resend")
  if (outcome.kind === "error") {
    logAuthError("resend", error)
    return { status: "error", message: outcome.message }
  }
  return { status: "sent", message: "We sent a new code." }
}

export async function startOver() {
  await forgetEmail("pending")
  redirect("/signup")
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: text(formData, "email") ?? "" }
  const parsed = signInSchema.safeParse({ email: values.email, password: text(formData, "password") })
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors(parsed.error.issues), values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  const outcome = mapAuthError(error, "signin")

  if (outcome.kind === "unverified") {
    // They signed up but never entered the code: send a fresh one and take them there.
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: parsed.data.email })
    const resent = mapAuthError(resendError, "resend")
    if (resent.kind === "error") {
      // The code screen says "we sent a code", so don't go there unless we did.
      logAuthError("resend after unverified sign-in", resendError)
      return { status: "error", message: resent.message, values }
    }
    await rememberEmail("pending", parsed.data.email)
    redirect("/verify")
  }
  if (outcome.kind === "error") {
    logAuthError("signInWithPassword", error)
    return { status: "error", message: outcome.message, values }
  }

  redirect("/welcome")
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: text(formData, "email") ?? "" }
  const parsed = emailSchema.safeParse(values.email)
  if (!parsed.success) {
    return { status: "error", fieldErrors: { email: parsed.error.issues[0].message }, values }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data)
  logAuthError("resetPasswordForEmail", error)
  // Only a rate limit or an outage is shown; anything else looks like success (see mapResetRequestError).
  const outcome = mapResetRequestError(error)
  if (outcome.kind === "error") {
    return { status: "error", message: outcome.message, values }
  }

  await rememberEmail("reset", parsed.data)
  return { status: "sent", message: "If there's an account for that email, we've sent a 6-digit code.", values }
}

export async function resetPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await recalledEmail("reset")
  if (!email) {
    return { status: "error", message: "This reset has expired. Ask for a new code." }
  }
  const code = codeSchema.safeParse(text(formData, "code"))
  const password = newPasswordSchema.safeParse(text(formData, "password"))
  if (!code.success || !password.success) {
    return {
      status: "sent",
      fieldErrors: {
        ...(code.success ? {} : { code: code.error.issues[0].message }),
        ...(password.success ? {} : { password: password.error.issues[0].message }),
      },
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token: code.data, type: "recovery" })
  const verified = mapAuthError(error, "reset")
  if (verified.kind === "error") {
    logAuthError("verifyOtp recovery", error)
    // Stay on the code-and-password step.
    return { status: "sent", fieldErrors: { code: AUTH_MESSAGES.badCode } }
  }

  // The code is used up now and this browser is signed in, so a retry here would fail (and the
  // proxy sends signed-in people away from this page). If the password can't be saved, finish on
  // the signed-in "choose a new password" page instead.
  await forgetEmail("reset")
  const { error: updateError } = await supabase.auth.updateUser({ password: password.data })
  const updated = mapAuthError(updateError, "reset")
  if (updated.kind === "error") {
    logAuthError("updateUser password", updateError)
    redirect(updated.field === "password" ? "/set-password?problem=weak" : "/set-password?problem=failed")
  }

  redirect("/welcome")
}

/** The signed-in "choose a new password" page. */
export async function setNewPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = newPasswordSchema.safeParse(text(formData, "password"))
  if (!password.success) {
    return { status: "error", fieldErrors: { password: password.error.issues[0].message } }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: password.data })
  const updated = mapAuthError(error, "reset")
  if (updated.kind === "error") {
    logAuthError("updateUser password", error)
    return updated.field === "password"
      ? { status: "error", fieldErrors: { password: updated.message } }
      : { status: "error", message: updated.message }
  }

  redirect("/welcome")
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  logAuthError("signOut", error)
  redirect("/login")
}
