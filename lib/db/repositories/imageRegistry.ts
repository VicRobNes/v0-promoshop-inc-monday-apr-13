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

export interface BulkApplyArgs {
  upserts?: ImageOverrides
  deletes?: string[]
}

export interface BulkApplyResult {
  upserted: number
  deleted: number
  errors: { slotId: string; reason: string }[]
}

/**
 * Apply a batch of overrides in parallel. Replaces N sequential PUT/DELETE
 * round-trips from the admin UI with a single request that fans out
 * Cosmos writes concurrently.
 */
export async function bulkApply(args: BulkApplyArgs): Promise<BulkApplyResult> {
  if (shouldUseFallback()) {
    throw new Error("Cannot bulkApply: Cosmos is not configured.")
  }
  const upserts = Object.entries(args.upserts ?? {}).filter(
    ([, v]) => typeof v === "string" && v.length > 0,
  )
  const deletes = (args.deletes ?? []).filter((s) => typeof s === "string" && s.length > 0)

  const ops = [
    ...upserts.map(([slotId, url]) => ({ kind: "upsert" as const, slotId, url })),
    ...deletes.map((slotId) => ({ kind: "delete" as const, slotId, url: "" })),
  ]

  const results = await Promise.allSettled(
    ops.map((op) => setOverride(op.slotId, op.url)),
  )

  const out: BulkApplyResult = { upserted: 0, deleted: 0, errors: [] }
  results.forEach((r, i) => {
    const op = ops[i]
    if (r.status === "fulfilled") {
      if (op.kind === "upsert") out.upserted += 1
      else out.deleted += 1
    } else {
      out.errors.push({
        slotId: op.slotId,
        reason: r.reason instanceof Error ? r.reason.message : String(r.reason),
      })
    }
  })
  return out
}
