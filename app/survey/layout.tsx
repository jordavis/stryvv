import Link from "next/link"
import Image from "next/image"
import { SurveyProvider } from "@/lib/context/survey-context"

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <SurveyProvider>
      <div className="min-h-screen bg-background">
        {/* Minimal header */}
        <header className="border-b bg-[#0b2545]">
          <div className="mx-auto flex h-18 max-w-2xl items-center px-4">
            <Link href="/">
              <Image
                src="/logo-white.png"
                alt="Stryvv"
                width={130}
                height={31}
                unoptimized
                priority
              />
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">{children}</div>
      </div>
    </SurveyProvider>
  )
}
