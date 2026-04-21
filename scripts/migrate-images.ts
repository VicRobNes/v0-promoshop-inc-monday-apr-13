/**
 * Phase 3 migration: rehome every default image referenced in
 * `lib/image-registry.ts` into Azure Blob Storage, and persist the blob URL
 * as the override in Cosmos `imageRegistry` container.
 *
 * Run once after Phase 0 + Phase 3 provision, with:
 *   AZURE_STORAGE_CONNECTION_STRING=... \
 *   COSMOS_ENDPOINT=... \
 *   pnpm tsx scripts/migrate-images.ts
 *
 * Idempotent: if the override already points to a blob URL on our storage
 * account, the slot is skipped. Re-runnable after adding new slots.
 */
import "dotenv/config"

import { IMAGE_REGISTRY } from "@/lib/image-registry"
import {
  BLOB_CONTAINERS,
  containerForSlotGroup,
  isBlobConfigured,
  mintWriteSas,
} from "@/lib/storage/blob"
import {
  getAllOverrides,
  setOverride,
} from "@/lib/db/repositories/imageRegistry"

interface Report {
  slotId: string
  status: "migrated" | "skipped-already-blob" | "skipped-no-default" | "failed"
  reason?: string
  sourceUrl?: string
  blobUrl?: string
}

function looksLikeOurBlob(url: string): boolean {
  const account = process.env.AZURE_STORAGE_ACCOUNT
  if (!account) return url.includes(".blob.core.windows.net/")
  return url.includes(`${account}.blob.core.windows.net/`)
}

async function fetchBytes(url: string): Promise<{ buf: Uint8Array; type: string }> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Source fetch ${res.status}: ${url}`)
  }
  const type = res.headers.get("content-type") ?? "application/octet-stream"
  const ab = await res.arrayBuffer()
  return { buf: new Uint8Array(ab), type }
}

const CONCURRENCY = Math.max(1, Number(process.env.MIGRATE_CONCURRENCY) || 6)

async function migrateSlot(
  slot: { id: string; group: string; defaultSrc: string },
  existing: Record<string, string>,
): Promise<Report> {
  const slotId = slot.id
  const source = existing[slotId] || slot.defaultSrc
  if (!source) {
    return { slotId, status: "skipped-no-default" }
  }
  if (looksLikeOurBlob(source)) {
    return { slotId, status: "skipped-already-blob", sourceUrl: source }
  }

  try {
    const { buf, type } = await fetchBytes(source)
    const ext = (() => {
      const m = source.match(/\.([a-zA-Z0-9]{2,5})(\?|$)/)
      if (m) return m[1].toLowerCase()
      if (type.includes("png")) return "png"
      if (type.includes("svg")) return "svg"
      if (type.includes("webp")) return "webp"
      return "jpg"
    })()

    const container = containerForSlotGroup(slot.group)
    const blobPath = `${slotId}/migrated-${Date.now().toString(36)}.${ext}`
    const sas = await mintWriteSas({
      container,
      blobPath,
      contentType: type,
      uploadTtlMinutes: 5,
    })

    const putRes = await fetch(sas.uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "content-type": type,
      },
      body: buf,
    })
    if (!putRes.ok) {
      throw new Error(`Blob PUT ${putRes.status} ${putRes.statusText}`)
    }

    await setOverride(slotId, sas.readUrl)
    console.log(`[migrate-images] ✅ ${slotId} → ${container}/${blobPath}`)
    return {
      slotId,
      status: "migrated",
      sourceUrl: source,
      blobUrl: sas.readUrl,
    }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.warn(`[migrate-images] ❌ ${slotId}: ${reason}`)
    return { slotId, status: "failed", sourceUrl: source, reason }
  }
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await worker(items[i])
    }
  })
  await Promise.all(runners)
  return results
}

async function main(): Promise<void> {
  if (!isBlobConfigured()) {
    console.error(
      "Blob storage not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT.",
    )
    process.exit(1)
  }

  console.log(`[migrate-images] containers available: ${BLOB_CONTAINERS.join(", ")}`)
  console.log(`[migrate-images] concurrency: ${CONCURRENCY}`)
  const existing = await getAllOverrides().catch((err: unknown) => {
    console.warn("[migrate-images] couldn't read existing overrides:", err)
    return {} as Record<string, string>
  })

  const reports = await runPool(IMAGE_REGISTRY, CONCURRENCY, (slot) =>
    migrateSlot(slot, existing),
  )

  const summary = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  console.log("\n[migrate-images] summary:")
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`)
  const failures = reports.filter((r) => r.status === "failed")
  if (failures.length > 0) {
    console.log("\nFailures:")
    for (const f of failures) console.log(`  - ${f.slotId}: ${f.reason}`)
    process.exit(2)
  }
}

main().catch((err) => {
  console.error("[migrate-images] fatal:", err)
  process.exit(1)
})
