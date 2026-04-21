import { BulkOperationType, type OperationInput } from "@azure/cosmos"
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
    try {
      await container.item(slotId, slotId).delete()
    } catch (err) {
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

const BULK_CHUNK = 100 // Cosmos hard limit per bulk request

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Apply a batch of overrides using `executeBulkOperations` — a single
 * Cosmos round-trip that fans out all upserts and deletes atomically within
 * each 100-operation chunk. This replaces N sequential PUTs with a tight
 * bulk call, eliminating partial-apply inconsistency on large admin imports.
 */
export async function bulkApply(args: BulkApplyArgs): Promise<BulkApplyResult> {
  if (shouldUseFallback()) {
    throw new Error("Cannot bulkApply: Cosmos is not configured.")
  }

  const upsertEntries = Object.entries(args.upserts ?? {}).filter(
    ([, v]) => typeof v === "string" && v.length > 0,
  )
  const deleteIds = (args.deletes ?? []).filter(
    (s) => typeof s === "string" && s.length > 0,
  )

  // Build a parallel tracking array so we know which slotId maps to which op.
  const opMeta: Array<{ kind: "upsert" | "delete"; slotId: string }> = [
    ...upsertEntries.map(([slotId]) => ({ kind: "upsert" as const, slotId })),
    ...deleteIds.map((slotId) => ({ kind: "delete" as const, slotId })),
  ]

  const operations: OperationInput[] = [
    ...upsertEntries.map(([slotId, url]): OperationInput => ({
      operationType: BulkOperationType.Upsert,
      partitionKey: slotId,
      resourceBody: {
        id: slotId,
        slotId,
        url,
        updatedAt: new Date().toISOString(),
      },
    })),
    ...deleteIds.map((slotId): OperationInput => ({
      operationType: BulkOperationType.Delete,
      partitionKey: slotId,
      id: slotId,
    })),
  ]

  if (operations.length === 0) {
    return { upserted: 0, deleted: 0, errors: [] }
  }

  const container = await containers.imageRegistry()
  const out: BulkApplyResult = { upserted: 0, deleted: 0, errors: [] }

  // Chunk into ≤100-op batches and run concurrently.
  const chunks = chunk(operations, BULK_CHUNK)
  const metaChunks = chunk(opMeta, BULK_CHUNK)

  await Promise.all(
    chunks.map(async (ops, ci) => {
      const results = await container.items.executeBulkOperations(ops)
      results.forEach((r, i) => {
        const meta = metaChunks[ci][i]
        const statusCode = (r as { statusCode?: number }).statusCode ?? 0
        const succeeded = statusCode >= 200 && statusCode < 300
        if (succeeded) {
          if (meta.kind === "upsert") out.upserted += 1
          else out.deleted += 1
        } else {
          // 404 on delete is acceptable — treat as success.
          if (meta.kind === "delete" && statusCode === 404) {
            out.deleted += 1
          } else {
            out.errors.push({
              slotId: meta.slotId,
              reason: `HTTP ${statusCode}`,
            })
          }
        }
      })
    }),
  )

  return out
}
