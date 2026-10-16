import { cookies } from "next/headers"
import { emailSchema } from "@/lib/validation/auth"

// Carries the address from sign-up (or sign-in, or forgot-password) to the code screen, so it
// never appears in a URL. Readable only by the server, and it expires with the code.
// Server code only. Deliberately not a "use server" file: everything exported from one of those
// becomes an action anyone can call.

const COOKIES = { pending: "sv_pending_email", reset: "sv_reset_email" } as const
type Kind = keyof typeof COOKIES

export async function rememberEmail(kind: Kind, email: string) {
  const jar = await cookies()
  jar.set(COOKIES[kind], email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  })
}

export async function recalledEmail(kind: Kind): Promise<string | null> {
  const jar = await cookies()
  const parsed = emailSchema.safeParse(jar.get(COOKIES[kind])?.value)
  return parsed.success ? parsed.data : null
}

export async function forgetEmail(kind: Kind) {
  const jar = await cookies()
  jar.delete(COOKIES[kind])
}
