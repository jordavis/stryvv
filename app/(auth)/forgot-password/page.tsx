import type { Metadata } from "next"
import { ForgotForm } from "./forgot-form"

export const metadata: Metadata = { title: "Reset your password | Stryvv" }

export default function ForgotPasswordPage() {
  return <ForgotForm rememberedEmail={null} />
}
