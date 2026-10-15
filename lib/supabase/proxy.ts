import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Route rules (spec: docs/work/2026-10-14-signup-email-code/spec.md, requirements 12-14).
// - Public pages anyone can open.
// - Sign-up / sign-in pages: public, but a signed-in person is sent to /welcome.
// - Signed-in pages: need a session, otherwise /login.
// - Anything else (including old links to the survey, dashboard and invites) goes to the holding page.
const PUBLIC_PAGES = ["/", "/coming-soon", "/terms", "/privacy"]
const AUTH_PAGES = ["/signup", "/verify", "/login", "/forgot-password"]
const SIGNED_IN_PAGES = ["/welcome"]
const HOLDING_PAGE = "/coming-soon"
const HOME_WHEN_SIGNED_IN = "/welcome"

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(route + "/"))

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone()
    url.pathname = target
    url.search = ""
    const response = NextResponse.redirect(url)
    // Keep any refreshed session cookies on the redirect.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  // API routes answer for themselves; a removed one returns 404 rather than a redirect.
  if (pathname === "/api" || pathname.startsWith("/api/")) return supabaseResponse

  if (matches(pathname, AUTH_PAGES)) {
    if (user) return redirectTo(HOME_WHEN_SIGNED_IN)
  } else if (matches(pathname, SIGNED_IN_PAGES)) {
    if (!user) return redirectTo("/login")
  } else if (!PUBLIC_PAGES.includes(pathname)) {
    return redirectTo(HOLDING_PAGE)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
