import { parsePhoneNumberFromString } from "libphonenumber-js/min"
import { z } from "zod"

// Field rules for sign-up, sign-in and password reset. The browser does light checks for
// a nicer form; these are the ones that count, run on the server in lib/actions/auth.ts.
// Import this only from server code: it pulls in phone-number metadata that pages don't need.

export const MESSAGES = {
  firstName: "Add your first name.",
  lastName: "Add your last name.",
  nameTooLong: "Keep it under 100 characters.",
  email: "Add a full email address, like name@example.com.",
  phone: "Add a mobile number we can reach, like (201) 555-0123.",
  password: "Use at least 8 characters.",
  passwordTooLong: "Use 72 characters or fewer.",
  passwordMissing: "Add your password.",
  terms: "Please confirm you're 18 or older and agree to the terms.",
  code: "Enter the 6-digit code from the email.",
} as const

/** Returns the number in international format (+15555550100), or null if it isn't a usable number. US by default. */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || /[a-z]/i.test(trimmed)) return null
  const parsed = parsePhoneNumberFromString(trimmed, "US")
  if (!parsed || !parsed.isValid()) return null
  return parsed.number
}

export const emailSchema = z
  .string({ error: MESSAGES.email })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: MESSAGES.email }))

// 72 is bcrypt's limit, which Supabase Auth uses.
export const newPasswordSchema = z
  .string({ error: MESSAGES.password })
  .min(8, { error: MESSAGES.password })
  .max(72, { error: MESSAGES.passwordTooLong })

const nameSchema = (missing: string) =>
  z
    .string({ error: missing })
    .trim()
    .min(1, { error: missing })
    .max(100, { error: MESSAGES.nameTooLong })

export const signUpSchema = z.object({
  firstName: nameSchema(MESSAGES.firstName),
  lastName: nameSchema(MESSAGES.lastName),
  email: emailSchema,
  phone: z
    .string({ error: MESSAGES.phone })
    .transform((value, ctx) => {
      const normalized = normalizePhone(value)
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: MESSAGES.phone })
        return z.NEVER
      }
      return normalized
    }),
  password: newPasswordSchema,
  // A checkbox posts "on" when ticked and nothing when not.
  terms: z.literal("on", { error: MESSAGES.terms }),
})

export type SignUpInput = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ error: MESSAGES.passwordMissing }).min(1, { error: MESSAGES.passwordMissing }),
})

export const codeSchema = z
  .string({ error: MESSAGES.code })
  .transform((value) => value.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, { error: MESSAGES.code }))
