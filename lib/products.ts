// Public surface for product data.
//
// Phase 1 of the Azure integration plan moves the canonical product store
// into Cosmos DB. To avoid a sweeping rewrite of existing client components
// (ProductCard, AdminImagePanel, ProductDetailModal, etc.) that currently
// import PRODUCTS synchronously, we:
//
//   - Keep `PRODUCTS` as a sync export pointing at the seed array. In
//     production builds this is the fallback when Cosmos env vars aren't
//     present, and it's also used for static generation (generateStaticParams).
//   - Add async `getProducts()` / `getProductBySku()` that read from Cosmos
//     when configured and fall back to the seed array otherwise. Server
//     components (and the API routes we'll add in later phases) should
//     prefer these.
//   - Re-export `Product` / `ProductColour` types from the seed module.
//
// See docs/runbooks/phase-1-data-layer.md for rollout + seeding.

export type { Product, ProductColour } from "./db/seed-data/products.seed"

import { PRODUCTS as SEED_PRODUCTS } from "./db/seed-data/products.seed"
import type { Product } from "./db/seed-data/products.seed"
import {
  listProducts as listProductsFromDb,
  getProductBySku as getProductBySkuFromDb,
} from "./db/repositories/products"

/**
 * Synchronous seed data. Kept for backward compatibility with client
 * components and `lib/image-registry.ts`. Do NOT rely on this for live
 * admin-edited data — use `getProducts()` / an API route instead.
 */
export const PRODUCTS: Product[] = SEED_PRODUCTS

/** Async accessor: Cosmos when configured, seed array as fallback. */
export async function getProducts(): Promise<Product[]> {
  return listProductsFromDb()
}

export async function getProduct(sku: string): Promise<Product | undefined> {
  return getProductBySkuFromDb(sku)
}

// --- Derived view helpers ---------------------------------------------------
// These remain sync for backward compatibility. They derive from the seed
// array by default. Callers that need Cosmos-backed categories should call
// the async variants below.

export function getCategories(): string[] {
  const categories = new Set<string>()
  PRODUCTS.forEach((p) => categories.add(p.category))
  return ["All", ...Array.from(categories)]
}

export function getBrands(): string[] {
  const brands = new Set<string>()
  PRODUCTS.forEach((p) => p.brands.forEach((b) => brands.add(b)))
  return ["All", ...Array.from(brands)]
}

export function getGenders(): string[] {
  return ["All", "Mens", "Womens", "Unisex"]
}

/** Async variants for RSC callers. */
export async function getCategoriesAsync(): Promise<string[]> {
  const products = await getProducts()
  const categories = new Set<string>()
  products.forEach((p) => categories.add(p.category))
  return ["All", ...Array.from(categories)]
}

export async function getBrandsAsync(): Promise<string[]> {
  const products = await getProducts()
  const brands = new Set<string>()
  products.forEach((p) => p.brands.forEach((b) => brands.add(b)))
  return ["All", ...Array.from(brands)]
}
