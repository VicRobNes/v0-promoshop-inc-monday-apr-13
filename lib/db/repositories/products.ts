import { cache } from "react"
import { containers } from "../cosmos"
import { shouldUseFallback, warnFallbackOnce } from "../fallback"
import { PRODUCTS as SEED_PRODUCTS } from "../seed-data/products.seed"

// Re-export shared types so callers can `import type { Product } from "lib/db/repositories/products"`.
export type { Product, ProductColour } from "../seed-data/products.seed"

import type { Product } from "../seed-data/products.seed"

/**
 * Shape of a product document as it lives in Cosmos. We store exactly the
 * same fields as the Product type, plus Cosmos bookkeeping. `id` is equal to
 * `sku` — we use SKU both as id and partition key for easy point reads.
 */
export interface ProductItem extends Product {
  id: string
  _etag?: string
  _ts?: number
}

function toItem(p: Product): ProductItem {
  return { ...p, id: p.sku }
}

function fromItem(item: ProductItem): Product {
  // Strip Cosmos bookkeeping so callers get the pristine Product shape.
  const { id: _id, _etag: _etag, _ts: _ts, ...rest } = item
  void _id
  void _etag
  void _ts
  return rest
}

async function loadFromCosmos(): Promise<Product[]> {
  const container = await containers.products()
  const { resources } = await container.items
    .query<ProductItem>("SELECT * FROM c")
    .fetchAll()
  return resources.map(fromItem)
}

/**
 * RSC-friendly: `React.cache` memoizes within a single React render.
 * Route Handlers / client fetches hit this fresh each time, which is what
 * we want — they should see the latest Cosmos state.
 */
export const listProducts = cache(async (): Promise<Product[]> => {
  if (shouldUseFallback()) {
    warnFallbackOnce("listProducts()")
    return SEED_PRODUCTS
  }
  try {
    return await loadFromCosmos()
  } catch (err) {
    console.error("[lib/db/products] Cosmos read failed, returning seed data:", err)
    return SEED_PRODUCTS
  }
})

export const getProductBySku = cache(async (sku: string): Promise<Product | undefined> => {
  if (shouldUseFallback()) {
    warnFallbackOnce("getProductBySku()")
    return SEED_PRODUCTS.find((p) => p.sku === sku)
  }
  try {
    const container = await containers.products()
    const { resource } = await container.item(sku, sku).read<ProductItem>()
    return resource ? fromItem(resource) : undefined
  } catch (err) {
    console.error(`[lib/db/products] getProductBySku(${sku}) failed:`, err)
    return SEED_PRODUCTS.find((p) => p.sku === sku)
  }
})

export async function upsertProduct(product: Product): Promise<Product> {
  if (shouldUseFallback()) {
    throw new Error("Cannot upsertProduct: Cosmos is not configured.")
  }
  const container = await containers.products()
  const { resource } = await container.items.upsert<ProductItem>(toItem(product))
  if (!resource) throw new Error("Cosmos upsert returned no resource.")
  return fromItem(resource)
}
