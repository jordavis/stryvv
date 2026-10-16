import type { Metadata } from "next"
import { SignUpForm } from "./signup-form"

export const metadata: Metadata = { title: "Create your account | Stryvv" }

export default function SignUpPage() {
  return <SignUpForm />
}
