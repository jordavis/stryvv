"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TERMS_VERSION } from "@/lib/terms"
import { codeSchema, emailSchema, newPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth"
import { AUTH_MESSAGES, mapAuthError } from "./auth-errors"

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

// Carries the address from sign-up (or sign-in, or forgot-password) to the code screen, so it
// never appears in a URL. Readable only by the server, and it expires with the code.
const PENDING_EMAIL = "sv_pending_email"
const RESET_EMAIL = "sv_reset_email"

async function rememberEmail(name: string, email: string) {
  const jar = await cookies()
  jar.set(name, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  })
}

async function recalledEmail(name: string): Promise<string | null> {
  const jar = await cookies()
  const parsed = emailSchema.safeParse(jar.get(name)?.value)
  return parsed.success ? parsed.data : null
}

async function forget(name: string) {
  const jar = await cookies()
  jar.delete(name)
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

/** For the verify screen: the address the code went to, if this browser has one. */
export async function getPendingEmail() {
  return recalledEmail(PENDING_EMAIL)
}

export async function getResetEmail() {
  return recalledEmail(RESET_EMAIL)
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

  await rememberEmail(PENDING_EMAIL, email)
  redirect("/verify")
}

export async function verifyCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await recalledEmail(PENDING_EMAIL)
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
  const { error: termsError } = await supabase.rpc("accept_terms", { _version: TERMS_VERSION })
  logAuthError("accept_terms", termsError)

  await forget(PENDING_EMAIL)
  redirect("/welcome")
}

export async function resendCode(): Promise<AuthFormState> {
  const email = await recalledEmail(PENDING_EMAIL)
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
  await forget(PENDING_EMAIL)
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
    logAuthError("resend after unverified sign-in", resendError)
    await rememberEmail(PENDING_EMAIL, parsed.data.email)
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
  const outcome = mapAuthError(error, "reset_request")
  // Only a rate limit is worth telling someone about; anything else must look like success
  // so the form can't be used to check whether an account exists.
  if (outcome.kind === "error" && outcome.message === AUTH_MESSAGES.rateLimited) {
    return { status: "error", message: outcome.message, values }
  }
  logAuthError("resetPasswordForEmail", error)

  await rememberEmail(RESET_EMAIL, parsed.data)
  return { status: "sent", message: "If there's an account for that email, we've sent a 6-digit code.", values }
}

export async function resetPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = await recalledEmail(RESET_EMAIL)
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

  const { error: updateError } = await supabase.auth.updateUser({ password: password.data })
  const updated = mapAuthError(updateError, "reset")
  if (updated.kind === "error") {
    logAuthError("updateUser password", updateError)
    return {
      status: "sent",
      fieldErrors: updated.field === "password" ? { password: updated.message } : undefined,
      message: updated.field === "password" ? undefined : updated.message,
    }
  }

  await forget(RESET_EMAIL)
  redirect("/welcome")
}

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  logAuthError("signOut", error)
  redirect("/login")
}
