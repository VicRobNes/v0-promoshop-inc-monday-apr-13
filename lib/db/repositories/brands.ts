import { cache } from "react"
import { containers } from "../cosmos"
import { shouldUseFallback, warnFallbackOnce } from "../fallback"
import { BRANDS as SEED_BRANDS } from "../seed-data/brands.seed"

export type { Brand } from "../seed-data/brands.seed"

import type { Brand } from "../seed-data/brands.seed"

export interface BrandItem extends Brand {
  // `id` in Cosmos duplicates the slug; partition key is /slug so point
  // reads can use `container.item(slug, slug)`.
  _etag?: string
  _ts?: number
}

function toItem(b: Brand): BrandItem {
  return { ...b }
}

function fromItem(item: BrandItem): Brand {
  const { _etag: _etag, _ts: _ts, ...rest } = item
  void _etag
  void _ts
  return rest
}

async function loadFromCosmos(): Promise<Brand[]> {
  const container = await containers.brands()
  const { resources } = await container.items
    .query<BrandItem>("SELECT * FROM c")
    .fetchAll()
  return resources.map(fromItem)
}

export const listBrands = cache(async (): Promise<Brand[]> => {
  if (shouldUseFallback()) {
    warnFallbackOnce("listBrands()")
    return SEED_BRANDS
  }
  try {
    return await loadFromCosmos()
  } catch (err) {
    console.error("[lib/db/brands] Cosmos read failed, returning seed data:", err)
    return SEED_BRANDS
  }
})

export const getBrandBySlug = cache(async (slug: string): Promise<Brand | undefined> => {
  if (shouldUseFallback()) {
    warnFallbackOnce("getBrandBySlug()")
    return SEED_BRANDS.find((b) => b.slug === slug)
  }
  try {
    const container = await containers.brands()
    const { resource } = await container.item(slug, slug).read<BrandItem>()
    return resource ? fromItem(resource) : undefined
  } catch (err) {
    console.error(`[lib/db/brands] getBrandBySlug(${slug}) failed:`, err)
    return SEED_BRANDS.find((b) => b.slug === slug)
  }
})

export async function upsertBrand(brand: Brand): Promise<Brand> {
  if (shouldUseFallback()) {
    throw new Error("Cannot upsertBrand: Cosmos is not configured.")
  }
  const container = await containers.brands()
  // Ensure /id path exists so Cosmos accepts the document — we use slug.
  const item: BrandItem & { id: string } = { ...toItem(brand), id: brand.slug }
  const { resource } = await container.items.upsert<BrandItem & { id: string }>(item)
  if (!resource) throw new Error("Cosmos upsert returned no resource.")
  return fromItem(resource)
}
