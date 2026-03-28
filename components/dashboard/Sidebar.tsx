"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, BarChart2, Archive, Crosshair, Navigation, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SidebarProps {
  firstName: string
}

const NAV_ITEMS: { label: string; icon: LucideIcon; href: string; comingSoon?: boolean }[] = [
  { label: "AI Coach",      icon: MessageCircle, href: "/dashboard/chat" },
  { label: "Our Snapshot",  icon: BarChart2,     href: "/dashboard/snapshot" },
  { label: "Money History", icon: Archive,       href: "/dashboard/money-history" },
  { label: "Goals",         icon: Crosshair,     href: "/dashboard/goals",       comingSoon: true },
  { label: "Dream Board",   icon: Navigation,    href: "/dashboard/dream-board", comingSoon: true },
  { label: "Prompts",       icon: Users,         href: "/dashboard/prompts",     comingSoon: true },
]

export function Sidebar({ firstName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col w-[220px] shrink-0 h-full border-r border-border bg-white"
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 py-4 border-b border-border"
        style={{ backgroundColor: "#0b2545" }}
      >
        <Link href="/dashboard/chat">
          <Image
            src="/logo-white.png"
            alt="Stryvv"
            width={90}
            height={22}
            unoptimized
            className="h-6 w-auto"
          />
        </Link>
      </div>

      {/* Greeting */}
      {firstName && (
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs text-muted-foreground">
            Hi, <span className="font-medium text-foreground">{firstName}</span>
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "text-white font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  style={isActive ? { backgroundColor: "#0b2545" } : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.comingSoon && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium shrink-0">
                      Soon
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-[11px] text-muted-foreground text-center">Stryvv &copy; 2026</p>
      </div>
    </aside>
  )
}
