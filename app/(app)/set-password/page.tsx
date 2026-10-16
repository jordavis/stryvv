import type { Metadata } from "next"
import { Logo } from "@/components/app/app-shell"
import { SetPasswordForm } from "./set-password-form"

export const metadata: Metadata = { title: "Choose a new password | Stryvv" }

// Signed-in. Where a password reset finishes if the code worked but the new password couldn't
// be saved: the code is used up by then, so the person can't retry on the forgot-password page.
export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ problem?: string }> }) {
  const { problem } = await searchParams
  const subtitle =
    problem === "weak"
      ? "Your code worked and you're signed in, but we couldn't use that password. Choose a different one."
      : problem === "failed"
        ? "Your code worked and you're signed in, but we couldn't save your new password. Please try again."
        : "Choose a new password for your account."
  return (
    <div className="flex flex-col items-center gap-6">
      <Logo />
      <SetPasswordForm subtitle={subtitle} />
    </div>
  )
}
