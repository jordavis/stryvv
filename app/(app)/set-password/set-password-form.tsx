"use client"

import { useActionState, useState } from "react"
import { AuthCard, FormMessage } from "@/components/app/auth-card"
import { Button } from "@/components/app/button"
import { TextField } from "@/components/app/text-field"
import { type AuthFormState, setNewPassword } from "@/lib/actions/auth"

const initial: AuthFormState = { status: "idle" }

export function SetPasswordForm({ subtitle }: { subtitle: string }) {
  const [state, action, pending] = useActionState(setNewPassword, initial)
  const [password, setPassword] = useState("")

  return (
    <AuthCard title="Choose a new password" subtitle={subtitle}>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.password}
          hint="At least 8 characters."
          autoFocus
        />
        {state.status === "error" && state.message ? <FormMessage>{state.message}</FormMessage> : null}
        <Button type="submit" block pending={pending} pendingLabel="Saving…" disabled={password.length < 8}>
          Save new password
        </Button>
      </form>
    </AuthCard>
  )
}
