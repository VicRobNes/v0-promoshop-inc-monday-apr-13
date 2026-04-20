import { containers } from "../cosmos"
import { shouldUseFallback, warnFallbackOnce } from "../fallback"

/**
 * Map of imageSlot id -> override URL (https:// or data:). Empty string
 * or absent means "use the registry default".
 */
export type ImageOverrides = Record<string, string>

/**
 * Cosmos document shape: one doc per slot. `id` mirrors `slotId` so point
 * reads can use `container.item(slotId, slotId)` (partition key is /slotId).
 */
export interface ImageOverrideItem {
  id: string
  slotId: string
  url: string
  updatedAt: string
  _etag?: string
  _ts?: number
}

export async function getAllOverrides(): Promise<ImageOverrides> {
  if (shouldUseFallback()) {
    warnFallbackOnce("getAllOverrides()")
    return {}
  }
  try {
    const container = await containers.imageRegistry()
    const { resources } = await container.items
      .query<ImageOverrideItem>("SELECT c.slotId, c.url FROM c")
      .fetchAll()
    const out: ImageOverrides = {}
    for (const r of resources) {
      if (r.slotId && typeof r.url === "string" && r.url.length > 0) {
        out[r.slotId] = r.url
      }
    }
    return out
  } catch (err) {
    console.error("[lib/db/imageRegistry] getAllOverrides failed:", err)
    return {}
  }
}

export async function getOverride(slotId: string): Promise<string | undefined> {
  if (shouldUseFallback()) {
    warnFallbackOnce("getOverride()")
    return undefined
  }
  try {
    const container = await containers.imageRegistry()
    const { resource } = await container.item(slotId, slotId).read<ImageOverrideItem>()
    return resource?.url && resource.url.length > 0 ? resource.url : undefined
  } catch (err) {
    console.error(`[lib/db/imageRegistry] getOverride(${slotId}) failed:`, err)
    return undefined
  }
}

export async function setOverride(slotId: string, url: string): Promise<void> {
  if (shouldUseFallback()) {
    throw new Error("Cannot setOverride: Cosmos is not configured.")
  }
  const container = await containers.imageRegistry()
  if (!url) {
    // Empty URL = delete the override.
    try {
      await container.item(slotId, slotId).delete()
    } catch (err) {
      // 404 is fine — nothing to delete.
      const statusCode = (err as { code?: number }).code
      if (statusCode !== 404) throw err
    }
    return
  }
  const item: ImageOverrideItem = {
    id: slotId,
    slotId,
    url,
    updatedAt: new Date().toISOString(),
  }
  await container.items.upsert<ImageOverrideItem>(item)
}
