import { Figtree, Manrope } from "next/font/google"

// The Stryvv Design System's two typefaces: Manrope for headings and numbers, Figtree for text.
export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

export const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree",
  display: "swap",
})
