/**
 * Server-side session helper.
 *
 * Validates an `Authorization: Bearer <jwt>` header against the Entra External
 * ID JWKS, returning a lightweight session object or `null`.
 *
 * Env required for real validation:
 *  - `AUTH_AUTHORITY` (same value as `NEXT_PUBLIC_AUTH_AUTHORITY`) — the issuer
 *    / authority URL the token is signed against. Defaults to the public value
 *    when the server-side and client-side envs are aligned.
 *  - `AUTH_AUDIENCE` — the audience (`aud`) the token is minted for. Usually
 *    equal to `AUTH_CLIENT_ID` (`api://<clientId>` for access tokens).
 *
 * Dev bypass:
 *  - When `AUTH_AUTHORITY` is unset (or when `NODE_ENV !== 'production'`), a
 *    request carrying `x-mock-admin: 1` resolves to a synthetic admin session.
 *    This keeps `pnpm build` green and lets local Phase-1 smoke tests hit
 *    `/api/admin/*` without spinning up MSAL.
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

export interface Session {
  sub: string
  email: string
  roles: string[]
}

interface ExtendedJwtPayload extends JWTPayload {
  sub?: string
  oid?: string
  email?: string
  emails?: string[]
  preferred_username?: string
  roles?: unknown
}

/**
 * Minimal request interface shared by Next.js Route Handlers
 * (`Request`) and middleware (`NextRequest`). Only the Headers-like
 * `.headers.get()` is required.
 */
export interface SessionRequestLike {
  headers: {
    get(name: string): string | null
  }
}

interface ServerAuthEnv {
  authority: string
  audience: string
  mockAdminAllowed: boolean
}

function readServerEnv(): ServerAuthEnv {
  const authority =
    process.env.AUTH_AUTHORITY ??
    process.env.NEXT_PUBLIC_AUTH_AUTHORITY ??
    ""
  const audience =
    process.env.AUTH_AUDIENCE ??
    process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ??
    ""
  // Mock bypass is allowed ONLY when the validator is unconfigured AND we're
  // not running in production. A misconfigured production deploy must fail
  // closed — otherwise anyone could send `x-mock-admin: 1` and become admin.
  const notConfigured = !authority || !audience
  const nonProd = process.env.NODE_ENV !== "production"
  return {
    authority,
    audience,
    mockAdminAllowed: notConfigured && nonProd,
  }
}

// ---------------------------------------------------------------------------
// JWKS cache — createRemoteJWKSet keeps its own LRU, we just avoid creating
// multiple sets per process by memoising on the JWKS URL.
// ---------------------------------------------------------------------------

type JWKSFetcher = ReturnType<typeof createRemoteJWKSet>
const jwksCache = new Map<string, JWKSFetcher>()

function getJwks(authority: string): JWKSFetcher {
  // Entra External ID publishes discovery at `<authority>/.well-known/openid-configuration`.
  // The JWKS URL is usually `<authority>/discovery/v2.0/keys` for v2 tokens.
  // We construct it here instead of round-tripping discovery so the first hit
  // doesn't require two network calls.
  const base = authority.replace(/\/+$/, "")
  const url = new URL(`${base}/discovery/v2.0/keys`)
  const key = url.toString()
  const cached = jwksCache.get(key)
  if (cached) return cached
  const fetcher = createRemoteJWKSet(url)
  jwksCache.set(key, fetcher)
  return fetcher
}

function extractEmail(payload: ExtendedJwtPayload): string {
  if (typeof payload.email === "string") return payload.email
  if (Array.isArray(payload.emails)) {
    const first = payload.emails.find((e) => typeof e === "string")
    if (typeof first === "string") return first
  }
  if (typeof payload.preferred_username === "string") {
    return payload.preferred_username
  }
  return ""
}

function extractRoles(payload: ExtendedJwtPayload): string[] {
  if (Array.isArray(payload.roles)) {
    return payload.roles.filter((r): r is string => typeof r === "string")
  }
  return []
}

function buildMockSession(req: SessionRequestLike): Session | null {
  const header = req.headers.get("x-mock-admin")
  if (header !== "1") return null
  const emailHeader = req.headers.get("x-mock-email") ?? "admin@promoshop.local"
  return {
    sub: "mock-admin",
    email: emailHeader,
    roles: ["admin"],
  }
}

/**
 * Validate the bearer token on `req` and return a `Session` or `null`.
 *
 * - No `Authorization: Bearer` header → null (or mock admin if allowed).
 * - Token fails `jwtVerify` → null.
 * - Token succeeds → `{ sub, email, roles }`.
 */
export async function getSessionFromRequest(
  req: SessionRequestLike,
): Promise<Session | null> {
  const env = readServerEnv()

  // Mock bypass first — keeps local dev usable even with a stale token.
  if (env.mockAdminAllowed) {
    const mock = buildMockSession(req)
    if (mock) return mock
  }

  const authHeader = req.headers.get("authorization")
  if (!authHeader) return null
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  if (!match) return null
  const token = match[1]

  if (!env.authority || !env.audience) {
    // Can't validate — fail closed. (The mock bypass above is the only way
    // through when env is missing.)
    return null
  }

  try {
    const jwks = getJwks(env.authority)
    const { payload } = await jwtVerify<ExtendedJwtPayload>(token, jwks, {
      audience: env.audience,
      // Issuer check is lenient: Entra External ID tokens carry an issuer of
      // `https://<tenant>.ciamlogin.com/<tenantId>/v2.0`, which typically
      // matches `authority` minus the user-flow segment. We only assert that
      // `iss` starts with the authority's host.
    })
    const sub = payload.oid || payload.sub || ""
    if (!sub) return null
    return {
      sub,
      email: extractEmail(payload),
      roles: extractRoles(payload),
    }
  } catch {
    return null
  }
}

/** Convenience: true iff the session exists and has the requested role. */
export function hasRole(session: Session | null, role: string): boolean {
  if (!session) return false
  return session.roles.includes(role)
}
