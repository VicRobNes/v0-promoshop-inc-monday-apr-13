"use client"

// Phase 1 of the Azure integration plan moves image overrides into the
// Cosmos `imageRegistry` container, fronted by `/api/admin/image-overrides`.
//
// The module exports the same getter/setter surface the existing admin UI
// and `useImageSrc` hook call synchronously. To preserve that contract we:
//
//   1. Keep an in-memory cache that's hydrated from `/api/admin/image-overrides`
//      on first access (fire-and-forget fetch).
//   2. Mirror every read/write to localStorage so the user still sees their
//      overrides instantly on page load before the API responds, and so
//      unauthenticated public visitors keep seeing overrides when the API
//      call is blocked by the (future) admin guard.
//   3. Dispatch the existing `promoshop:image-overrides-changed` event on
//      every mutation so subscribers (useImageSrc) stay in sync.

export const IMAGE_OVERRIDES_STORAGE_KEY = "promoshop_image_overrides_v1"
export const IMAGE_OVERRIDES_EVENT = "promoshop:image-overrides-changed"
export const IMAGE_OVERRIDES_API = "/api/admin/image-overrides"

export type ImageOverrides = Record<string, string>

// ---------------------------------------------------------------------------
// Local storage mirror
// ---------------------------------------------------------------------------

function readFromStorage(): ImageOverrides {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(IMAGE_OVERRIDES_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: ImageOverrides = {}
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && v.length > 0) out[k] = v
      }
      return out
    }
    return {}
  } catch {
    return {}
  }
}

function writeToStorage(next: ImageOverrides): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(IMAGE_OVERRIDES_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(IMAGE_OVERRIDES_EVENT))
  } catch {
    // localStorage may be full (data-URL uploads can be large). Swallow.
  }
}

// ---------------------------------------------------------------------------
// In-memory session cache + API sync
// ---------------------------------------------------------------------------

let sessionCache: ImageOverrides | null = null
let hydratePromise: Promise<void> | null = null

function hydrateFromApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (hydratePromise) return hydratePromise
  hydratePromise = (async () => {
    try {
      const res = await fetch(IMAGE_OVERRIDES_API, { credentials: "include" })
      if (!res.ok) {
        // 401/403/etc. — keep the localStorage fallback alive for public
        // visitors. We don't clobber sessionCache.
        return
      }
      const data: unknown = await res.json()
      if (!data || typeof data !== "object" || Array.isArray(data)) return
      const clean: ImageOverrides = {}
      for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
        if (typeof v === "string" && v.length > 0) clean[k] = v
      }
      sessionCache = clean
      writeToStorage(clean)
    } catch {
      // Network failure / API missing — quietly keep local fallback.
    }
  })()
  return hydratePromise
}

function ensureCache(): ImageOverrides {
  if (sessionCache !== null) return sessionCache
  // First call: seed from localStorage synchronously, kick off API hydration.
  sessionCache = readFromStorage()
  if (typeof window !== "undefined") {
    void hydrateFromApi()
  }
  return sessionCache
}

async function putOverrideToApi(id: string, value: string): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const res = await fetch(IMAGE_OVERRIDES_API, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: id, url: value }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API — signatures preserved from the pre-Phase-1 implementation
// ---------------------------------------------------------------------------

export function getAllOverrides(): ImageOverrides {
  return { ...ensureCache() }
}

export function getOverride(id: string): string | undefined {
  return ensureCache()[id]
}

export function setOverride(id: string, value: string): void {
  const cache = ensureCache()
  if (!value) {
    delete cache[id]
  } else {
    cache[id] = value
  }
  writeToStorage(cache)
  sessionCache = cache
  // Fire-and-forget API write. Admin guard lands in Phase 2.
  void putOverrideToApi(id, value)
}

export function clearOverride(id: string): void {
  const cache = ensureCache()
  delete cache[id]
  writeToStorage(cache)
  sessionCache = cache
  void putOverrideToApi(id, "")
}

export function replaceAllOverrides(next: ImageOverrides): void {
  const cleaned: ImageOverrides = {}
  for (const [k, v] of Object.entries(next)) {
    if (typeof v === "string" && v.length > 0) cleaned[k] = v
  }
  sessionCache = cleaned
  writeToStorage(cleaned)
  // Mirror every override to the API. Not atomic — the API route treats each
  // slot as an independent upsert.
  if (typeof window !== "undefined") {
    for (const [k, v] of Object.entries(cleaned)) {
      void putOverrideToApi(k, v)
    }
  }
}

export function resetAllOverrides(): void {
  // Snapshot the current cache so we can delete every slot server-side.
  const current = ensureCache()
  const keys = Object.keys(current)
  sessionCache = {}
  writeToStorage({})
  if (typeof window !== "undefined") {
    for (const k of keys) {
      void putOverrideToApi(k, "")
    }
  }
}
