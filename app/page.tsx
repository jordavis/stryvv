import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { Success } from "@/components/landing/success"
import { Problem } from "@/components/landing/problem"
import { Value } from "@/components/landing/value"
import { Proof } from "@/components/landing/proof"
import { Transformation } from "@/components/landing/transformation"
import { Features } from "@/components/landing/features"
import { CTA2 } from "@/components/landing/cta2"
import { Footer } from "@/components/landing/footer"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <Header user={user ? { email: user.email } : null} />
      <Hero />
      <Success />
      <Problem />
      <Value />
      <Proof />
      <Transformation />
      <Features />
      <CTA2 />
      <Footer />
    </div>
  )
}
