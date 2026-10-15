"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { AuthCard, FormMessage } from "@/components/app/auth-card"
import { Button } from "@/components/app/button"
import { CodeInput } from "@/components/app/code-input"
import { TextField } from "@/components/app/text-field"
import { type AuthFormState, requestPasswordReset, resetPassword } from "@/lib/actions/auth"

const initial: AuthFormState = { status: "idle" }

export function ForgotForm({ rememberedEmail }: { rememberedEmail: string | null }) {
  const [requestState, request, requesting] = useActionState(requestPasswordReset, initial)
  const [resetState, reset, resetting] = useActionState(resetPassword, initial)
  const [email, setEmail] = useState(rememberedEmail ?? "")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")

  // Step 2 (code + new password) once a code has been requested.
  if (requestState.status === "sent" || resetState.status === "sent") {
    const errors = resetState.fieldErrors ?? {}
    return (
      <AuthCard
        title="Set a new password"
        subtitle="If there's an account for that email, we've sent a 6-digit code. Enter it with your new password."
      >
        <form action={reset} className="flex flex-col gap-4" noValidate>
          <CodeInput
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
            error={errors.code}
            autoFocus
          />
          <TextField
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters."
          />
          {resetState.message ? <FormMessage>{resetState.message}</FormMessage> : null}
          <Button
            type="submit"
            block
            pending={resetting}
            pendingLabel="Saving…"
            disabled={code.replace(/\s/g, "").length !== 6 || password.length < 8}
          >
            Save new password
          </Button>
        </form>
        <p className="text-center text-[13px] leading-[18px] text-sv-ink-muted">
          No code? Check your spam folder, or{" "}
          <Link href="/forgot-password" className="font-semibold text-sv-teal hover:underline" prefetch={false}>
            start again
          </Link>
          .
        </p>
      </AuthCard>
    )
  }

  return (
    <>
      <AuthCard title="Reset your password" subtitle="Enter your email and we'll send you a 6-digit code.">
        <form action={request} className="flex flex-col gap-3" noValidate>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={requestState.fieldErrors?.email}
          />
          {requestState.status === "error" && requestState.message ? (
            <FormMessage>{requestState.message}</FormMessage>
          ) : null}
          <Button type="submit" block pending={requesting} pendingLabel="Sending…" disabled={!email.trim()}>
            Send code
          </Button>
        </form>
      </AuthCard>
      <p className="text-sm text-sv-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-sv-teal hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
