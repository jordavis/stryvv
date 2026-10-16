import Image from "next/image"
import Link from "next/link"
import { figtree, manrope } from "@/lib/fonts"
import { cn } from "@/lib/utils"

/** The page frame for app screens: design-system tokens and fonts, a phone-width column. */
export function AppShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("stryvv-app min-h-dvh", manrope.variable, figtree.variable)}>
      <div className={cn("mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8 sm:py-12", className)}>
        {children}
      </div>
    </div>
  )
}

/** The Stryvv logo, teal on light backgrounds and teal-and-white on dark ones. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex", className)} aria-label="Stryvv home">
      <Image
        src="/logo-green.png"
        alt="Stryvv"
        width={133}
        height={32}
        priority
        sizes="133px"
        className="sv-only-light h-8 w-auto"
      />
      <Image
        src="/logo-white.png"
        alt="Stryvv"
        width={133}
        height={32}
        priority
        sizes="133px"
        className="sv-only-dark h-8 w-auto"
      />
    </Link>
  )
}
