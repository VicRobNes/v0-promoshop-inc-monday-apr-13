# PromoShop Inc. — Corporate site

Next.js 16 / React 19 marketing site for PromoShop Inc., deployed to Azure
App Service. Content is editable from an in-browser admin surface that reads
and writes to Cosmos DB (metadata + overrides) and Azure Blob Storage
(binary assets).

---

## Stack

| Layer | Service / tooling |
| --- | --- |
| Runtime | Next.js 16 (App Router) on Node 20 |
| Hosting | Azure App Service (Linux) |
| Auth | Microsoft Entra External ID via MSAL; falls back to a signed-cookie session in dev |
| Data | Azure Cosmos DB (SQL API) — containers: `products`, `brands`, `imageRegistry`, `quotes` |
| Assets | Azure Blob Storage — containers: `products`, `brands`, `hero`, `team`, `quotes-archive` |
| Secrets | Azure Key Vault (App Service reads via managed identity) |
| Observability | Application Insights + Log Analytics |
| IaC | Bicep under `infra/`, orchestrated with `azd` |
| CI/CD | GitHub Actions — `.github/workflows/azure-deploy.yml` (OIDC) |

---

## Local development

```bash
pnpm install
pnpm dev
```

The site runs without any Azure credentials: Cosmos falls back to in-memory
seed data and admin image uploads fall back to localStorage base64 overrides
(capped at 2.5 MB per file). Sign-in uses the fallback session unless MSAL
env vars are set.

### Useful scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` | Production build (runs type-check) |
| `pnpm start` | Serve the built app |
| `pnpm lint` | ESLint |
| `pnpm tsx scripts/seed-cosmos.ts` | Seed brands, products, image registry into a configured Cosmos account |
| `pnpm tsx scripts/migrate-images.ts` | Copy every registry image into Blob Storage and rewrite the Cosmos override URLs |

---

## Environment variables

All values are optional locally; production reads them from Key Vault.

| Name | Purpose |
| --- | --- |
| `AZURE_STORAGE_CONNECTION_STRING` | Shared-key connection string. When set, SAS tokens are signed with the account key (dev / one-shot scripts). |
| `AZURE_STORAGE_ACCOUNT` | Storage account name. Used with managed identity / `DefaultAzureCredential` in production; SAS tokens are minted via a cached user-delegation key. |
| `COSMOS_ENDPOINT` | `https://<account>.documents.azure.com:443/` |
| `COSMOS_KEY` | Primary key (dev only — production uses AAD). |
| `COSMOS_DATABASE` | Defaults to `promoshop`. |
| `ENTRA_TENANT_ID` / `ENTRA_CLIENT_ID` / `ENTRA_CLIENT_SECRET` | MSAL server-side verification. |
| `NEXT_PUBLIC_MSAL_CLIENT_ID` / `NEXT_PUBLIC_MSAL_AUTHORITY` / `NEXT_PUBLIC_MSAL_REDIRECT_URI` | Browser-side MSAL config. |
| `SESSION_SECRET` | HMAC key for the fallback session cookie. |
| `MIGRATE_CONCURRENCY` | Optional — parallelism for `scripts/migrate-images.ts` (default 6). |

If neither storage variable is set, `isBlobConfigured()` returns `false`,
`/api/admin/upload` returns 503, and the admin UI transparently falls back
to base64 overrides in localStorage.

---

## Admin image uploads

Flow for a single upload from the Image Manager panel
(`/admin/images`):

1. Client asks `/api/admin/upload` for a short-lived PUT SAS and a 7-day GET
   SAS. Both tokens are signed from a single cached user-delegation key
   (`lib/storage/blob.ts`) — so the common case is zero extra round-trips
   per upload once the key is warm.
2. Client `PUT`s the file directly to Azure Blob Storage via
   `XMLHttpRequest`, streaming `upload.onprogress` events into a visible
   progress bar next to the file name. One transient-retry with a short
   back-off covers network blips.
3. On success the client writes the returned read-URL to Cosmos through
   `/api/admin/image-overrides` (single PUT) and mirrors it to
   localStorage so the rest of the site sees it instantly.
4. Import / Reset-all use the bulk endpoint
   (`POST /api/admin/image-overrides`) so a 60-slot import is one request
   instead of 60.

Slot → container mapping lives in `CONTAINER_BY_GROUP` in
`lib/storage/blob.ts`. Keep it in sync with the `group` strings declared in
`lib/image-registry.ts` — unmapped groups silently route to `products`.

---

## Deploy

Production deploy is driven by `.github/workflows/azure-deploy.yml`
(OIDC federated credentials; no long-lived secrets). The workflow is a
no-op when the Azure secrets aren't configured on the repo, so PR branches
and forks build cleanly without deploying.

Infrastructure changes go through `azd up` against the Bicep in `infra/`.

---

## Layout

```
app/            Next.js App Router (routes + API handlers)
components/     Client components (admin panels, marketing UI)
docs/           Runbooks, Azure architecture notes, admin guide
hooks/          Shared React hooks
infra/          Bicep + azd configuration
lib/            Server + shared code
  auth/         MSAL + fallback session
  cms/          Static marketing content
  db/           Cosmos client, fallback layer, repositories
  storage/      Blob storage SAS minting
  image-*.ts    Slot registry + override cache
public/         Static assets
scripts/        One-shot migration / seeding utilities
styles/         Tailwind globals
```

See `docs/azure-architecture.md` for the full architecture and
`docs/ADMIN-GUIDE.md` for how content editors use the admin surface.
