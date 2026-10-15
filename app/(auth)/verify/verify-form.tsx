"use client"

import { useActionState, useEffect, useState } from "react"
import { AuthCard, FormMessage } from "@/components/app/auth-card"
import { Button } from "@/components/app/button"
import { CodeInput } from "@/components/app/code-input"
import { type AuthFormState, resendCode, startOver, verifyCode } from "@/lib/actions/auth"

const initial: AuthFormState = { status: "idle" }
const RESEND_WAIT_SECONDS = 60

export function VerifyForm({ email }: { email: string }) {
  const [state, verify, verifying] = useActionState(verifyCode, initial)
  const [code, setCode] = useState("")
  // "Resend code" unlocks 60 seconds after the last send (the first send happened at sign-up).
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_WAIT_SECONDS * 1000)
  const [now, setNow] = useState(() => Date.now())
  const [resendState, resend, resending] = useActionState(async () => {
    const result = await resendCode()
    if (result.status === "sent") setResendAt(Date.now() + RESEND_WAIT_SECONDS * 1000)
    return result
  }, initial)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const formError = state.status === "error" ? state.message : undefined
  const resendError = resendState.status === "error" ? resendState.message : undefined

  return (
    <AuthCard
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <strong className="font-semibold text-sv-ink break-all">{email}</strong>. Enter it below
          to continue.
        </>
      }
    >
      <form action={verify} className="flex flex-col gap-4">
        <CodeInput
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
          error={state.fieldErrors?.code}
          autoFocus
        />
        {formError ? <FormMessage>{formError}</FormMessage> : null}
        <Button
          type="submit"
          block
          pending={verifying}
          pendingLabel="Checking…"
          disabled={code.replace(/\s/g, "").length !== 6}
        >
          Verify
        </Button>
      </form>

      <form action={resend} className="flex flex-col items-center gap-2 text-sm text-sv-ink-muted">
        {resendState.status === "sent" ? <FormMessage tone="info">{resendState.message}</FormMessage> : null}
        {resendError ? <FormMessage>{resendError}</FormMessage> : null}
        <p>
          Didn&apos;t get it?{" "}
          <button
            type="submit"
            disabled={wait > 0 || resending}
            className="font-semibold text-sv-teal underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-sv-ink-faint disabled:no-underline"
          >
            {resending ? "Sending…" : wait > 0 ? `Resend code in ${wait}s` : "Resend code"}
          </button>
        </p>
        <p className="text-center text-[13px] leading-[18px]">
          Can&apos;t find it? Check your spam or promotions folder. The code works for 1 hour.
        </p>
      </form>

      <form action={startOver} className="text-center">
        <button type="submit" className="text-sm font-semibold text-sv-teal hover:underline">
          Use a different email
        </button>
      </form>
    </AuthCard>
  )
}
