// Public surface for brand data.
//
// Phase 1 of the Azure integration plan moves the canonical brand store
// into Cosmos DB. We keep `BRANDS` as a sync export because:
//
//   - `lib/image-registry.ts` (per the Phase 1 constraints: untouched)
//     enumerates brand-logo image slots from BRANDS at module load.
//   - Several client pages (`app/brands/page.tsx`) import BRANDS inside
//     `useMemo`. Converting these to RSC would regress layout.
//
// `getBrands()` / `getBrandBySlugAsync()` are new async accessors that read
// from Cosmos when configured and fall back to the seed array otherwise.
// Server components and API routes should prefer the async variants.

export type { Brand } from "./db/seed-data/brands.seed"

import { BRANDS as SEED_BRANDS } from "./db/seed-data/brands.seed"
import type { Brand } from "./db/seed-data/brands.seed"
import {
  listBrands as listBrandsFromDb,
  getBrandBySlug as getBrandBySlugFromDb,
} from "./db/repositories/brands"

/**
 * Synchronous seed data. Kept for backward compatibility with client
 * components and `lib/image-registry.ts`.
 */
export const BRANDS: Brand[] = SEED_BRANDS

/** Async accessor: Cosmos when configured, seed array as fallback. */
export async function getBrands(): Promise<Brand[]> {
  return listBrandsFromDb()
}

/**
 * Synchronous lookup against the seed array. Preserved for compatibility
 * with existing imports (e.g. `app/brands/[slug]/page.tsx`).
 */
export function getBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.slug === slug)
}

/** Async variant: reads from Cosmos when configured. */
export async function getBrandBySlugAsync(slug: string): Promise<Brand | undefined> {
  return getBrandBySlugFromDb(slug)
}

/** Featured brands — sync derivation from the seed array. */
export function getFeaturedBrands(): Brand[] {
  return BRANDS.filter((b) => b.featured)
}

/** Async variant that filters the Cosmos result. */
export async function getFeaturedBrandsAsync(): Promise<Brand[]> {
  const brands = await getBrands()
  return brands.filter((b) => b.featured)
}
