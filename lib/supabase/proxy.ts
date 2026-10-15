import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// While Stryvv is rebuilt, the live site is the landing page plus a holding page.
// Every other page (including old links to the survey, dashboard and invites) goes to the holding page.
const publicRoutes = ["/", "/coming-soon"]
const HOLDING_PAGE = "/coming-soon"

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

  // Refreshes the session cookie. Nothing reads the user yet; the new signup will.
  await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(pathname)
  // API routes answer for themselves; a removed one returns 404 rather than a redirect.
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/")

  if (!isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = HOLDING_PAGE
    url.search = ""
    return NextResponse.redirect(url)
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
