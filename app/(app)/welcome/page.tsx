import { redirect } from "next/navigation"

// The old first signed-in page. Home replaced it; old links still work.
export default function WelcomePage() {
  redirect("/home")
}
