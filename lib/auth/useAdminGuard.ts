"use client"

/**
 * Client-side admin-guard hook.
 *
 * Redirects to `/sign-in?redirect=<current>` when the session isn't admin.
 * The middleware at the repo root performs the same check server-side to
 * prevent a UI flash; this hook is the belt-and-braces for client-navigated
 * transitions and for any page that opts out of middleware (e.g. static
 * export).
 *
 * In localStorage-fallback mode we look for `promoshop_roles` including
 * "admin" — matches the behaviour of `lib/auth/AuthProvider.tsx`.
 */
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "./AuthProvider"

export interface AdminGuardOptions {
  /** Role required — defaults to "admin". */
  role?: string
  /** Where to redirect when the guard fails. Defaults to `/sign-in`. */
  redirectTo?: string
}

export interface AdminGuardState {
  /** True once we've confirmed the current user has the required role. */
  isAllowed: boolean
  /** True while auth is still bootstrapping. Render a skeleton during this. */
  isChecking: boolean
}

export function useAdminGuard(
  options: AdminGuardOptions = {},
): AdminGuardState {
  const { role = "admin", redirectTo = "/sign-in" } = options
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, roles } = useAuth()

  const hasRole = roles.includes(role)
  const isAllowed = isAuthenticated && hasRole

  useEffect(() => {
    if (isLoading) return
    if (isAllowed) return
    const target = pathname ? `${redirectTo}?redirect=${encodeURIComponent(pathname)}` : redirectTo
    router.replace(target)
  }, [isLoading, isAllowed, pathname, redirectTo, router])

  return {
    isAllowed,
    isChecking: isLoading,
  }
}
