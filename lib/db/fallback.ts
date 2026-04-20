import { hasCosmosConfig } from "./cosmos"

let warned = false

/**
 * When Cosmos isn't configured yet (local dev, CI without Azure bootstrap),
 * the repositories fall back to the seed arrays so the site keeps rendering
 * identically. We log exactly once per process so logs stay quiet.
 */
export function warnFallbackOnce(context: string): void {
  if (warned) return
  warned = true
  // Using console.warn (not throw) so `pnpm build` + preview envs succeed.
  console.warn(
    `[lib/db] Cosmos env vars not set — using in-memory seed data for ${context}. ` +
      `Set COSMOS_ENDPOINT + COSMOS_KEY (or COSMOS_USE_MI=true) to read from Cosmos.`,
  )
}

export function shouldUseFallback(): boolean {
  return !hasCosmosConfig()
}
