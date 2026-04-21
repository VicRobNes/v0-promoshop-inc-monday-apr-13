import { NextResponse, type NextRequest } from "next/server"
import { getSessionFromRequest, hasRole } from "@/lib/auth/server"

/**
 * Phase 2 — route guard for `/admin/*` + `/api/admin/*`.
 *
 * In Next 16 the `middleware.ts` file convention was renamed to `proxy.ts`;
 * the shape of the exported function and the `config.matcher` are unchanged.
 *
 * Strategy:
 *  1. Browser requests to `/admin/**` → redirect to `/sign-in?redirect=...`
 *     when the session is missing or isn't admin. Prevents the UI flash.
 *  2. API requests to `/api/admin/**` → JSON 401/403 so callers can react
 *     programmatically.
 *
 * Validation is delegated to `getSessionFromRequest` (JWT + JWKS), which
 * honours `x-mock-admin: 1` in non-prod so dev/smoke workflows keep working.
 */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl
  const isApi = pathname.startsWith("/api/admin")
  const isAdmin = pathname.startsWith("/admin") || isApi

  if (!isAdmin) return NextResponse.next()

  const session = await getSessionFromRequest(req)

  if (!session) {
    if (isApi) {
      return NextResponse.json(
        { error: "Unauthorized — sign in with an admin account." },
        { status: 401 },
      )
    }
    const redirectTarget = encodeURIComponent(`${pathname}${search}`)
    const url = req.nextUrl.clone()
    url.pathname = "/sign-in"
    url.search = `?redirect=${redirectTarget}`
    return NextResponse.redirect(url)
  }

  if (!hasRole(session, "admin")) {
    if (isApi) {
      return NextResponse.json(
        { error: "Forbidden — admin role required." },
        { status: 403 },
      )
    }
    const url = req.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
