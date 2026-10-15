"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#proof", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
]

// While Stryvv is rebuilt there are no accounts, so the header has no sign-in state.
export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[#0b2545]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/">
          <Image src="/logo-white.png" alt="Stryvv" unoptimized width={150} height={36} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild>
            <Link href="/coming-soon">Start stryvving</Link>
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>
                  <Image src="/logo-white.png" alt="Stryvv" unoptimized width={100} height={24} />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 p-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-4 border-t pt-4">
                  <Button asChild className="w-full">
                    <Link href="/coming-soon" onClick={() => setOpen(false)}>
                      Start stryvving
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
