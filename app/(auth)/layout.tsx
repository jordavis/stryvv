import { AppShell, Logo } from "@/components/app/app-shell"

// Sign-up, verify, sign-in and forgot-password. The proxy sends signed-in people to /welcome.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell className="items-center gap-6">
      <Logo />
      {children}
    </AppShell>
  )
}
