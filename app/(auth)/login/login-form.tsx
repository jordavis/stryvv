"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { AuthCard, FormMessage } from "@/components/app/auth-card"
import { Button } from "@/components/app/button"
import { TextField } from "@/components/app/text-field"
import { type AuthFormState, signIn } from "@/lib/actions/auth"

const initial: AuthFormState = { status: "idle" }

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const errors = state.fieldErrors ?? {}

  return (
    <>
      <AuthCard title="Welcome back" subtitle="Sign in to pick up where you left off.">
        <form action={action} className="flex flex-col gap-3" noValidate>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Link href="/forgot-password" className="self-end text-sm font-semibold text-sv-teal hover:underline">
            Forgot password?
          </Link>
          {state.status === "error" && state.message ? <FormMessage>{state.message}</FormMessage> : null}
          <Button type="submit" block pending={pending} pendingLabel="Signing in…" disabled={!email.trim() || !password}>
            Sign in
          </Button>
        </form>
      </AuthCard>

      <p className="text-sm text-sv-ink-muted">
        New to Stryvv?{" "}
        <Link href="/signup" className="font-semibold text-sv-teal hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}
