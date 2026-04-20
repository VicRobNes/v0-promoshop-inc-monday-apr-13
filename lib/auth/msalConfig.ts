/**
 * MSAL (Entra External ID) configuration for the browser.
 *
 * All three NEXT_PUBLIC_AUTH_* values are REQUIRED at runtime to talk to a
 * real Entra External ID tenant. When any are missing the AuthProvider falls
 * back to the pre-existing localStorage mock so `pnpm build` stays green and
 * local dev / design work doesn't require an Azure tenant.
 *
 * Source of truth for the portal-side values: docs/runbooks/phase-2-auth.md.
 */
import type { Configuration, RedirectRequest } from "@azure/msal-browser"

/** Read-only snapshot of the three auth-related env vars. */
export interface AuthEnv {
  clientId: string
  authority: string
  redirectUri: string
}

/**
 * Reads env at module load. In the browser `process.env.NEXT_PUBLIC_*` values
 * are inlined by Next.js at build time, so this is effectively a pure read.
 */
export function readAuthEnv(): AuthEnv {
  return {
    clientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? "",
    authority: process.env.NEXT_PUBLIC_AUTH_AUTHORITY ?? "",
    redirectUri:
      process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI ??
      (typeof window !== "undefined" ? window.location.origin : ""),
  }
}

/**
 * True when all three values are populated. The AuthProvider uses this to
 * decide between real MSAL and the localStorage mock.
 */
export function isAuthConfigured(env: AuthEnv = readAuthEnv()): boolean {
  return Boolean(env.clientId && env.authority && env.redirectUri)
}

/**
 * Build a stable MSAL configuration from the env snapshot. Returns a config
 * even when env is missing so construction never throws; the provider guards
 * against instantiating `PublicClientApplication` in that case.
 */
export function buildMsalConfig(env: AuthEnv = readAuthEnv()): Configuration {
  return {
    auth: {
      clientId: env.clientId || "00000000-0000-0000-0000-000000000000",
      authority: env.authority || "https://login.microsoftonline.com/common",
      // Entra External ID authorities aren't on the MSAL well-known list, so
      // the `knownAuthorities` array must include the host. Empty is fine for
      // the fallback placeholder — MSAL never initialises in that path.
      knownAuthorities: env.authority
        ? [new URL(env.authority).host]
        : [],
      redirectUri: env.redirectUri || "http://localhost:3000",
      postLogoutRedirectUri: env.redirectUri || "http://localhost:3000",
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
    // `system.allowNativeBroker` was removed from @azure/msal-browser v4's
    // BrowserSystemOptions — adding it back causes TS2353. WAM/native broker
    // is off by default in SPAs anyway, so no replacement is needed.
  }
}

/** Scopes requested at login. `openid profile` are baked into MSAL already. */
export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "offline_access"],
}

/** Same flow, nudged to start in sign-up mode via OIDC `prompt`. */
export const signUpRequest: RedirectRequest = {
  ...loginRequest,
  // Entra External ID's sign-up/sign-in user flow responds to this hint.
  extraQueryParameters: {
    option: "signup",
  },
}
