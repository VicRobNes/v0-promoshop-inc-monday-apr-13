"use client"

/**
 * AuthProvider — single entry point for client-side auth.
 *
 * Two modes:
 *  1. **Real** — `NEXT_PUBLIC_AUTH_CLIENT_ID` / `_AUTHORITY` / `_REDIRECT_URI`
 *     are all populated. We instantiate `PublicClientApplication` and wrap
 *     children in `MsalProvider`. `useAuth()` projects MSAL state into the
 *     shared shape.
 *  2. **Fallback** — any of the three is empty. We render a plain context
 *     provider backed by localStorage (matches the pre-Phase-2 mock). This
 *     keeps the build green + lets design / dev work continue without an
 *     Azure tenant. A single `console.warn` fires on first mount.
 *
 * Both modes expose the identical `useAuth()` contract so callers don't have
 * to branch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  EventType,
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type EventMessage,
  type IPublicClientApplication,
} from "@azure/msal-browser"
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react"
import {
  buildMsalConfig,
  isAuthConfigured,
  loginRequest,
  readAuthEnv,
  signUpRequest,
} from "./msalConfig"

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface AuthUser {
  /** Stable user id (sub / oid claim in real mode, email in fallback). */
  id: string
  email: string
  firstName: string
  lastName: string
  company: string
}

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  /** True while MSAL is still bootstrapping (real mode only). */
  isLoading: boolean
  roles: string[]
  /** Whether auth is wired to real MSAL or the localStorage mock. */
  mode: "msal" | "fallback"
  signIn: (hint?: "signIn" | "signUp") => Promise<void>
  signOut: () => Promise<void>
  /**
   * Fetch an access token for server calls. Returns `null` in fallback mode
   * (no real token available).
   */
  getAccessToken: (scopes?: string[]) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Fallback storage helpers (localStorage mock)
// ---------------------------------------------------------------------------

const FALLBACK_USER_KEY = "promoshop_user"
const FALLBACK_ROLES_KEY = "promoshop_roles"

interface FallbackStoredUser {
  email?: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
}

function readFallbackUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(FALLBACK_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FallbackStoredUser
    if (!parsed || typeof parsed !== "object") return null
    const email = typeof parsed.email === "string" ? parsed.email : ""
    if (!email) return null
    return {
      id: email,
      email,
      firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
      lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
      company: typeof parsed.company === "string" ? parsed.company : "",
    }
  } catch {
    return null
  }
}

function readFallbackRoles(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(FALLBACK_ROLES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((r): r is string => typeof r === "string")
    }
    return []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// MSAL-backed implementation
// ---------------------------------------------------------------------------

interface MsalClaims {
  sub?: string
  oid?: string
  email?: string
  emails?: string[]
  preferred_username?: string
  given_name?: string
  family_name?: string
  extension_Company?: string
  roles?: string[]
  [key: string]: unknown
}

function accountToUser(account: AccountInfo | null): AuthUser | null {
  if (!account) return null
  const claims = (account.idTokenClaims ?? {}) as MsalClaims
  const email =
    claims.email ||
    (Array.isArray(claims.emails) && claims.emails.length > 0
      ? claims.emails[0]
      : "") ||
    claims.preferred_username ||
    account.username ||
    ""
  return {
    id: claims.oid || claims.sub || account.homeAccountId,
    email,
    firstName:
      claims.given_name ||
      (account.name ? account.name.split(" ")[0] ?? "" : ""),
    lastName:
      claims.family_name ||
      (account.name
        ? account.name.split(" ").slice(1).join(" ")
        : ""),
    company: claims.extension_Company || "",
  }
}

function accountToRoles(account: AccountInfo | null): string[] {
  if (!account) return []
  const claims = (account.idTokenClaims ?? {}) as MsalClaims
  return Array.isArray(claims.roles)
    ? claims.roles.filter((r): r is string => typeof r === "string")
    : []
}

function MsalBackedContext({ children }: { children: ReactNode }): ReactNode {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const account = accounts[0] ?? null
  const user = useMemo(() => accountToUser(account), [account])
  const roles = useMemo(() => accountToRoles(account), [account])

  const signIn = useCallback(
    async (hint: "signIn" | "signUp" = "signIn") => {
      const request = hint === "signUp" ? signUpRequest : loginRequest
      await instance.loginRedirect(request)
    },
    [instance],
  )

  const signOut = useCallback(async () => {
    await instance.logoutRedirect()
  }, [instance])

  const getAccessToken = useCallback(
    async (scopes: string[] = loginRequest.scopes ?? []) => {
      if (!account) return null
      try {
        const result: AuthenticationResult = await instance.acquireTokenSilent(
          {
            scopes,
            account,
          },
        )
        return result.accessToken || result.idToken || null
      } catch {
        return null
      }
    },
    [instance, account],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading: inProgress !== "none",
      roles,
      mode: "msal",
      signIn,
      signOut,
      getAccessToken,
    }),
    [user, isAuthenticated, inProgress, roles, signIn, signOut, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Fallback-backed implementation
// ---------------------------------------------------------------------------

function FallbackAuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    setUser(readFallbackUser())
    setRoles(readFallbackRoles())
    const sync = () => {
      setUser(readFallbackUser())
      setRoles(readFallbackRoles())
    }
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [])

  const signIn = useCallback(async () => {
    // Fallback has no real sign-in flow — callers typically render their own
    // local form, then call `setFallbackUser` via writing to localStorage.
    // We intentionally don't redirect; sign-in / sign-up pages handle the UX.
  }, [])

  const signOut = useCallback(async () => {
    if (typeof window === "undefined") return
    window.localStorage.removeItem(FALLBACK_USER_KEY)
    window.localStorage.removeItem(FALLBACK_ROLES_KEY)
    setUser(null)
    setRoles([])
  }, [])

  const getAccessToken = useCallback(async () => null, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
      roles,
      mode: "fallback",
      signIn,
      signOut,
      getAccessToken,
    }),
    [user, roles, signIn, signOut, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Top-level provider
// ---------------------------------------------------------------------------

let warnedAboutFallback = false

/**
 * Lazily-created MSAL instance. Kept module-scoped because MSAL stores its
 * own cache internally and double-initialising in React 19 strict-mode
 * re-renders triggers a noisy warning.
 */
let msalInstance: PublicClientApplication | null = null

function getOrCreateMsalInstance(): PublicClientApplication {
  if (msalInstance) return msalInstance
  msalInstance = new PublicClientApplication(buildMsalConfig())
  return msalInstance
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const env = readAuthEnv()
  const configured = isAuthConfigured(env)
  const instanceRef = useRef<IPublicClientApplication | null>(null)
  const [initialized, setInitialized] = useState(!configured)

  useEffect(() => {
    if (!configured) {
      if (!warnedAboutFallback) {
        warnedAboutFallback = true

        console.warn(
          "[auth] NEXT_PUBLIC_AUTH_* env vars not set — running in localStorage fallback mode. See docs/runbooks/phase-2-auth.md.",
        )
      }
      return
    }
    const instance = getOrCreateMsalInstance()
    instanceRef.current = instance

    let cancelled = false
    void instance.initialize().then(() => {
      if (cancelled) return
      // Process the redirect response (if this mount is the post-login hop).
      void instance.handleRedirectPromise().then((result) => {
        if (result?.account) {
          instance.setActiveAccount(result.account)
        } else {
          const first = instance.getAllAccounts()[0]
          if (first) instance.setActiveAccount(first)
        }
        setInitialized(true)
      })
    })

    const cbId = instance.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS &&
        event.payload &&
        "account" in event.payload
      ) {
        const payload = event.payload as { account?: AccountInfo }
        if (payload.account) instance.setActiveAccount(payload.account)
      }
    })

    return () => {
      cancelled = true
      if (cbId) instance.removeEventCallback(cbId)
    }
  }, [configured])

  if (!configured) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>
  }

  if (!initialized || !instanceRef.current) {
    // MSAL hasn't finished bootstrapping yet — render a fallback context so
    // children that read `useAuth()` don't crash. This window is typically
    // sub-100ms.
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>
  }

  return (
    <MsalProvider instance={instanceRef.current}>
      <MsalBackedContext>{children}</MsalBackedContext>
    </MsalProvider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    // Render-time fallback: if a consumer ends up outside a provider (very
    // unlikely given we wrap the root layout) return a static no-op so we
    // never crash the page. This mirrors the "design can't regress" constraint.
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      roles: [],
      mode: "fallback",
      signIn: async () => {},
      signOut: async () => {},
      getAccessToken: async () => null,
    }
  }
  return ctx
}

/**
 * Helper used by sign-in / sign-up pages to persist the fallback user record
 * so the rest of the app sees them as "signed in". Only affects fallback mode
 * — in real MSAL mode the identity comes from the token.
 */
export function setFallbackUser(user: {
  email: string
  firstName: string
  lastName?: string
  company?: string
  phone?: string
}): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    FALLBACK_USER_KEY,
    JSON.stringify({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName ?? "",
      company: user.company ?? "",
      phone: user.phone ?? "",
    }),
  )
  // Kick the storage listener so other tabs / the provider re-read.
  window.dispatchEvent(new StorageEvent("storage", { key: FALLBACK_USER_KEY }))
}
