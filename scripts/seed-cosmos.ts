#!/usr/bin/env tsx
/**
 * Seed the Cosmos `products` + `brands` containers from the in-repo seed
 * arrays. Safe to re-run — uses upserts keyed by SKU / slug.
 *
 * Usage:
 *   pnpm exec tsx scripts/seed-cosmos.ts            # actually write
 *   pnpm exec tsx scripts/seed-cosmos.ts --dry-run  # report what would happen
 *
 * Required env (omit for --dry-run):
 *   COSMOS_ENDPOINT          https://<acct>.documents.azure.com:443/
 *   COSMOS_KEY               primary or secondary key
 *   COSMOS_DATABASE          (optional) default "promoshop"
 *   COSMOS_USE_MI=true       (optional) use Managed Identity instead of key
 */

import { PRODUCTS } from "../lib/db/seed-data/products.seed"
import { BRANDS } from "../lib/db/seed-data/brands.seed"

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has("--dry-run") || args.has("-n")

async function main(): Promise<void> {
  console.log("=".repeat(60))
  console.log("Cosmos seed")
  console.log("=".repeat(60))
  console.log(`Products in seed: ${PRODUCTS.length}`)
  console.log(`Brands in seed:   ${BRANDS.length}`)
  console.log(`Dry run:          ${DRY_RUN ? "YES (no Cosmos calls)" : "NO"}`)
  console.log()

  if (DRY_RUN) {
    console.log("Sample product SKUs:")
    for (const p of PRODUCTS.slice(0, 5)) console.log(`  ${p.sku} — ${p.name}`)
    if (PRODUCTS.length > 5) console.log(`  … and ${PRODUCTS.length - 5} more`)
    console.log()
    console.log("Sample brand slugs:")
    for (const b of BRANDS.slice(0, 5)) console.log(`  ${b.slug} — ${b.name}`)
    if (BRANDS.length > 5) console.log(`  … and ${BRANDS.length - 5} more`)
    console.log()
    console.log("Dry run complete — no Cosmos calls were made.")
    return
  }

  // Lazy-require so dry-run works without the Azure SDKs installed locally.
  const { containers, readCosmosEnv } = await import("../lib/db/cosmos")
  const env = readCosmosEnv()
  if (!env) {
    console.error(
      "ERROR: Cosmos env vars not set. Set COSMOS_ENDPOINT + COSMOS_KEY " +
        "(or COSMOS_USE_MI=true) and try again, or pass --dry-run.",
    )
    process.exit(1)
  }
  console.log(`Endpoint: ${env.endpoint}`)
  console.log(`Database: ${env.databaseName}`)
  console.log(`Auth:     ${env.useManagedIdentity ? "Managed Identity" : "Key"}`)
  console.log()

  // --- Products ------------------------------------------------------------
  const productsContainer = await containers.products()
  let pUpserts = 0
  for (const p of PRODUCTS) {
    await productsContainer.items.upsert({ ...p, id: p.sku })
    pUpserts += 1
    if (pUpserts % 5 === 0) {
      console.log(`  products upserted: ${pUpserts}/${PRODUCTS.length}`)
    }
  }
  console.log(`  products upserted: ${pUpserts}/${PRODUCTS.length}`)

  // --- Brands --------------------------------------------------------------
  const brandsContainer = await containers.brands()
  let bUpserts = 0
  for (const b of BRANDS) {
    await brandsContainer.items.upsert({ ...b, id: b.slug })
    bUpserts += 1
  }
  console.log(`  brands upserted:   ${bUpserts}/${BRANDS.length}`)

  console.log()
  console.log("Seed complete.")
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
