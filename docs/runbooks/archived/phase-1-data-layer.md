# Phase 1 — Data Layer Runbook

Phase 1 moves product, brand, and image-override data out of hardcoded TypeScript / localStorage and into Cosmos DB. This runbook documents how to seed, verify, and roll back.

## Summary of changes

- New Cosmos client + repository layer under `lib/db/`.
- `lib/products.ts` and `lib/brands.ts` keep their existing sync `PRODUCTS` / `BRANDS` exports (backed by seed data) *and* now expose async `getProducts()` / `getBrands()` helpers that read from Cosmos when configured.
- `lib/image-overrides.ts` still exposes the same sync getter/setter API, but writes are mirrored to `/api/admin/image-overrides` (Cosmos) and reads hydrate from the API on first access.
- `scripts/seed-cosmos.ts` upserts the seed arrays into the `products` + `brands` containers.
- Fallback behaviour: when `COSMOS_ENDPOINT` (or `COSMOS_KEY` / `COSMOS_USE_MI`) is missing, every repository transparently returns seed data and logs a single warning. The site renders identically without any Azure resources — this is what keeps `pnpm build` green in CI.

## Environment variables

Add the following to `.env.local` (or your hosting provider's secret store). The values land in Key Vault during Phase 0 provisioning; pull them via `azd env get-values`.

| Var | Required | Purpose |
|---|---|---|
| `COSMOS_ENDPOINT` | yes | Document endpoint URI, e.g. `https://promoshop-cosmos.documents.azure.com:443/`. |
| `COSMOS_KEY` | yes unless MI | Primary or secondary key from the Cosmos account. |
| `COSMOS_USE_MI` | optional | Set to `true` to use `DefaultAzureCredential` (managed identity) instead of `COSMOS_KEY`. |
| `COSMOS_DATABASE` | optional | Defaults to `promoshop` — matches `infra/modules/cosmos.bicep`. |

When none of these are set, `lib/db/fallback.ts` kicks in and the repos return seed arrays.

## Seeding

### Dry run (no Cosmos calls)

```bash
pnpm exec tsx scripts/seed-cosmos.ts --dry-run
```

Prints the product and brand counts plus a sample, exits 0 without touching any network resource. Use this to confirm the seed script compiles after changes to `lib/db/seed-data/*.seed.ts`.

### Real seed

```bash
# From a machine with the Cosmos env vars set (e.g. `azd env get-values > .env.local && set -a; source .env.local; set +a`)
pnpm exec tsx scripts/seed-cosmos.ts
```

The script is idempotent — reruns upsert by SKU / slug.

## Verifying data landed

1. Open the Azure Portal → your Cosmos account → **Data Explorer**.
2. Expand `promoshop` → `products`. You should see one item per seed SKU (currently 15).
3. Expand `brands`. Count should match the seed (currently 20).
4. For `imageRegistry`, seed is not required — items appear on-demand as admins upload overrides. Exercise the admin panel at `/admin` (or hit `PUT /api/admin/image-overrides` directly) to confirm writes land.

## Rollback

Phase 1 never deletes the seed arrays. To roll back:

1. Revert the PR.
2. `lib/products.ts` / `lib/brands.ts` revert to pre-Phase-1 shapes (sync only).
3. Cosmos data is orthogonal — leaving it in place causes no harm; it will just be stale.

## Known limitations (intentional)

- The `/api/admin/image-overrides` route is **not yet authenticated**. Phase 2 adds the Entra External ID role check. The route is marked with `// PHASE 2: require admin role`.
- `lib/image-registry.ts` is still consumed synchronously by client components — we left it untouched per the Phase 1 scope. A follow-up can move the slot registry itself into Cosmos.
- `FEATURED_BRANDS` (sync) and `getFeaturedBrandsAsync()` (async) coexist until every consumer moves to RSC-driven brand loading.
