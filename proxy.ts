import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Supabase Auth Middleware for PromoShop Studio
 *
 * This middleware handles:
 * 1. Session refresh - Keeps Supabase auth cookies fresh on every request
 * 2. Admin route protection - Redirects unauthenticated users to /admin/login
 * 3. Admin role verification - Checks admin_users table for active admin status
 *
 * The updateSession function in @/lib/supabase/middleware.ts handles:
 * - Creating a Supabase server client with cookie management
 * - Refreshing expired sessions automatically
 * - Protecting /admin/* routes (except /admin/login which is public)
 * - Protecting /api/admin/* routes with JSON error responses
 * - Verifying users exist in admin_users table with is_active=true
 *
 * Next.js 16 renamed middleware.ts to proxy.ts (backwards compatible).
 * We export both `middleware` and `proxy` for compatibility.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Next.js 16 compatibility - proxy.ts convention
export const proxy = middleware

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
