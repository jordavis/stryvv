"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { AuthCard, FormMessage } from "@/components/app/auth-card"
import { Button } from "@/components/app/button"
import { TextField } from "@/components/app/text-field"
import { type AuthFormState, signUp } from "@/lib/actions/auth"
import { looksLikePhone } from "@/lib/validation/hints"

const initial: AuthFormState = { status: "idle" }

// Light checks so the button only lights up when the form could succeed.
// The server re-checks everything (lib/validation/auth.ts).
function looksComplete(f: { firstName: string; lastName: string; email: string; phone: string; password: string; terms: boolean }) {
  return (
    f.firstName.trim() !== "" &&
    f.lastName.trim() !== "" &&
    /^\S+@\S+\.\S+$/.test(f.email.trim()) &&
    looksLikePhone(f.phone) &&
    f.password.length >= 8 &&
    f.terms
  )
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial)
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    terms: false,
  })
  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: key === "terms" ? e.target.checked : e.target.value }))
  const errors = state.fieldErrors ?? {}

  return (
    <>
      <AuthCard title="Create your account" subtitle="Take your first steps toward a rich life. It takes about 5 minutes.">
        <form action={action} className="flex flex-col gap-3" noValidate>
          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              value={fields.firstName}
              onChange={set("firstName")}
              error={errors.firstName}
              maxLength={100}
            />
            <TextField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              value={fields.lastName}
              onChange={set("lastName")}
              error={errors.lastName}
              maxLength={100}
            />
          </div>
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={fields.email}
            onChange={set("email")}
            error={errors.email}
          />
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="(201) 555-0123"
            value={fields.phone}
            onChange={set("phone")}
            error={errors.phone}
            hint="For sign-in help and reminders later. We never share it."
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={fields.password}
            onChange={set("password")}
            error={errors.password}
            hint="At least 8 characters."
          />

          <div className="flex flex-col gap-1.5 py-1">
            <label htmlFor="terms" className="flex items-start gap-2.5 text-[13px] leading-[18px] text-sv-ink-muted">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={fields.terms}
                onChange={set("terms")}
                aria-invalid={errors.terms ? true : undefined}
                className="mt-px size-5 flex-none accent-[var(--sv-teal)]"
              />
              <span>
                I&apos;m 18 or older and agree to the{" "}
                <Link href="/terms" className="font-medium text-sv-teal underline-offset-2 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-sv-teal underline-offset-2 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.terms ? <p className="text-xs font-medium text-sv-danger">{errors.terms}</p> : null}
          </div>

          {state.status === "error" && state.message ? <FormMessage>{state.message}</FormMessage> : null}

          <Button type="submit" block pending={pending} pendingLabel="Creating account…" disabled={!looksComplete(fields)}>
            Create account
          </Button>
        </form>
      </AuthCard>

      <p className="text-sm text-sv-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-sv-teal hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
