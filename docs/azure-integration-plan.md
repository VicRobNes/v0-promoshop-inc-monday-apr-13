# PromoShop Inc × Azure Free Services — Integration Sequencing Plan

## Context

You have an Azure account with $200 credit and a long list of "always-free" services. You want every one of them meaningfully integrated into the PromoShop Inc site (v0-promoshop-inc-monday-apr-13, deployed to Vercel, linked to nestdigital.ca) — not as a demo, without breaking the current design, and executed through GitHub Copilot (with Claude acting as the "brain" that drafts the sequencing prompts).

Today the project is a Next.js 16 / React 19 catalog-and-quoting site with **no backend, no database, no real auth, and no email**. Products/brands are hardcoded in `lib/`. Images come from Vercel Blob + GitHub raw + Squarespace CDN. Cart, auth, and admin image overrides all live in `localStorage`. That's the honest starting line — Azure integration here is effectively building the backend the app currently lacks.

## Decisions (from clarifying questions)

1. **Scope:** Integrate **every** free service, even the ones that don't obviously fit. For the "doesn't really fit" services we still provision them and wire a **token integration** so they're actually doing something — not just turned on. I'll flag which ones are purely demo vs. real-user-value so you know where the upkeep lives.
2. **Executor:** VS Code Copilot Chat locally. Each phase below is a single self-contained prompt you paste into Copilot Chat in VS Code (with this repo open as the workspace). Prompts are ordered; later phases assume earlier PRs merged.
3. **Provisioning:** Bicep + `azd` + GitHub Actions. All infra is IaC committed to `infra/`. `azd provision` runs in a workflow on `workflow_dispatch` so it works whether your machine is on or not.

## Service-by-Service Integration Map

Grouped by tier so you know where value is vs. where the upkeep is. **All tiers get provisioned and wired.**

### Tier 1 — Core backend the site is missing today (high ROI)
| Service | Role in PromoShop |
|---|---|
| **Azure Static Web Apps** | Host the Next.js frontend (alternative/complement to Vercel). Gives free custom domain + SSL. |
| **Cosmos DB (free 1000 RU/s)** | Primary store for products, brands, quotes, users, image registry — replaces the hardcoded `lib/products.ts` / `lib/brands.ts`. |
| **Azure SQL Database (serverless)** | Optional relational store for quotes + orders if we want transactional reporting. |
| **Entra ID B2C** | Real customer auth — replaces the `localStorage` mock in `app/sign-in` / `app/sign-up`. |
| **Key Vault** | Store Cosmos keys, Blob connection strings, SendGrid/SMTP creds, B2C secrets. |
| **Azure Functions** | Serverless backend for `/api/quote`, `/api/contact`, `/api/products`, `/api/admin/*`. |
| **Azure Blob Storage** | Canonical home for product + brand + hero images — replaces the mix of Vercel Blob / GitHub raw / Squarespace CDN. |
| **Container Registry + Container Apps** | If we containerize the Next.js app for staging previews. |
| **Application Insights (in Azure Monitor)** | Real observability on the site (page loads, errors, quote funnel). |
| **Azure DevOps (free private repos) / GitHub via Azure** | CI/CD for the Functions + infra-as-code. |

### Tier 2 — Genuine "make it smarter" additions
| Service | Role in PromoShop |
|---|---|
| **Azure AI Search** | Product + brand search/filter on the Studio page — replaces the current in-memory filter loop. |
| **AI Vision + Custom Vision** | Auto-tag product images on upload in Admin Image Manager; detect logo quality for brand uploads. |
| **Document Intelligence** | Extract text from uploaded brand style guides / purchase orders customers attach to quotes. |
| **Content Safety** | Moderate the "project description" free-text field in the quote form before it hits your inbox. |
| **AI Language** | Detect language of contact-form submissions; sentiment-tag quote requests. |
| **Speech to Text + Text to Speech** | "Dictate your quote" option on mobile; read-aloud of product details for accessibility. |
| **Translator / Speech Translator** | Expand the existing EN/FR `LocaleProvider` to real-time translation for other Canadian markets. |
| **AI Immersive Reader** | Accessibility upgrade on product detail pages. |
| **Logic Apps** | "When a quote is submitted → push to Sheets + email team + Slack"-style workflows. |
| **Event Grid + Service Bus** | Event backbone (QuoteSubmitted, ImageUploaded, StockUpdated) between Functions. |
| **API Management** | Public, rate-limited API for brand partners to pull their product feed. |
| **Notification Hubs** | Email/push when a quote status changes. |
| **SignalR / Web PubSub** | Live "someone is viewing this product" + admin real-time quote inbox. |
| **Azure Maps** | Store-locator / service-area map on `/about`. |
| **Content Delivery via Front Door / CDN** | (Not in your free list — skip.) |
| **Data Factory** | Nightly ETL from supplier CSV feeds into Cosmos. |

### Tier 3 — Governance / ops (turn on, forget, benefit)
Advisor, Cost Management, Azure Policy, Security Center / Defender for Cloud Free, Azure Arc, Automanage, Update Manager, Resource Manager, Resource Mover, Storage Mover, Migrate, Lighthouse, Attestation, Private Link, VPN Gateway, Network Watcher, Virtual Network, Load Balancer, Bandwidth allowance. These are "provision once, configure alerts, move on." Worth doing, cheap to maintain.

### Tier 4 — "Integrate anyway" (you asked for every service, here's how each earns its slot)
| Service | Minimum meaningful integration |
|---|---|
| **AI Bot Service** | "PromoBot" concierge on the site: answers "what's the MOQ on this?" / "do you have it in navy?" using product data from Cosmos. |
| **Health Bot** | Internal-only bot on the admin dashboard that answers "ergonomic break" / workplace-wellness prompts for the team. Demo-flavoured but real. |
| **Health Data Services** | Store anonymized "wellness product" category telemetry (e.g. branded water-bottle category) in FHIR format — justifies B2B healthcare-client pitches. |
| **Face** | Opt-in face verification on the Admin sign-in for high-privilege image/brand edits (layered on top of Entra External ID). |
| **Speaker Recognition** | Voice-signature second factor for admin console (opt-in; same dashboard as Face). |
| **IoT Hub** | Single simulated "storefront sensor" device that reports a heartbeat + footfall count feeding a `store-activity` metric on `/about`. |
| **IoT Edge** | Runtime installed on one edge device (or simulated via container) that runs the footfall counter locally. |
| **Open Datasets** | Pull a public holiday calendar dataset → show "holiday-themed promo suggestions" banner on `/studio` in December/July. |
| **Azure Machine Learning** | Workspace provisioned; one registered model: "quote-value predictor" trained on seeded synthetic quote data, called from `submitQuote` to show expected turnaround estimate. |
| **DevTest Labs** | Lab that spins up preview VMs for each PR branch (optional — replaces Vercel preview deploys for heavier testing). |
| **Data Catalog** | Register Cosmos containers + Blob containers so the data estate is documented. |
| **Batch** | Nightly image-optimization batch job (resize/compress every product image to WebP). |
| **Service Fabric** | Host one micro-service (the `quote-value predictor` caller) on Service Fabric instead of Functions — justifies provisioning. |
| **AKS** | Cluster hosting a containerized build of the Next.js app as a DR/failover target behind Front Door-style routing (or just DNS). |
| **Archive Storage** | Monthly archive of quotes older than 1 year → Archive tier. |
| **Database Migration Service** | One-shot migration job that imports `lib/products.ts` seed into Cosmos — documents the "there used to be hardcoded data" history. |
| **SQL Managed Instance** | Reporting replica of quotes + orders for BI (Power BI connects here). |
| **Azure Files** | Shared store for admin-uploaded brand style guides (PDFs), mounted by the Function app. |
| **Service Bus** | Already in Tier 2; here we also add a "dead-letter quotes" queue for retryable failures. |
| **VPN Gateway** | Point-to-site config for admin-only access to Cosmos private endpoint. |
| **Private Link** | Private endpoints for Cosmos, Blob, Key Vault so production traffic never hits public internet. |

**Heads-up on upkeep:** Tier 4 services that simulate devices (IoT Hub/Edge) or need training data (ML, Custom Vision) will silently rot if you don't babysit them. Plan includes a "cron health check" Function that pings each Tier-4 integration weekly and emails you when something's decayed, so you don't discover dead demos months later.

## Execution Model

1. **Claude (this session / plan file)** produces the sequenced prompt pack below.
2. **You** open this repo in VS Code, open Copilot Chat (`Ctrl+Alt+I`), paste each phase prompt verbatim. One phase = one feature branch = one PR. Wait for each PR to merge before the next phase.
3. **Infra** is Bicep under `infra/`, run by `.github/workflows/azure-provision.yml` via `azd provision` on `workflow_dispatch`. It runs whether your PC is on or off — GitHub Actions is the durable executor.
4. **Portal-only steps** (Entra External ID tenant create, Azure DevOps org create, Health Data Services workspace accept-ToS) are called out explicitly in each phase. For those you either click in portal once, or trigger Claude Browser Use from claude.ai to do it on your behalf.
5. **Secrets** live in Key Vault from Phase 0. Never committed. GitHub Actions pulls via OIDC federated identity — no long-lived service principal secrets.

## Sequenced Prompt Pack for VS Code Copilot Chat

Each phase below is a single prompt. Workflow per phase:
1. `git checkout -b phase-N-<slug>` off `claude/explore-azure-portal-ry6hx`.
2. Paste the phase prompt into Copilot Chat (VS Code, workspace = this repo).
3. Review Copilot's diff, run `pnpm build`, push, open PR → merge.
4. Trigger `azure-provision` workflow if the phase added Bicep.

### Phase 0 — Foundation (infra-as-code, no runtime changes yet)
**P0.1** Create `infra/main.bicep` + `infra/modules/*.bicep` + `azure.yaml` (azd) provisioning: resource group, Key Vault, Storage Account (blob + files), Cosmos DB (free tier), Application Insights, Log Analytics, Static Web App, Container Registry. Wire outputs to GitHub Actions via OIDC federated creds. No app code changes.
**P0.2** Add `.github/workflows/azure-provision.yml` that runs `azd provision` on `workflow_dispatch`. Add `.github/workflows/azure-deploy.yml` for Static Web Apps deploy.

### Phase 1 — Data layer (replace hardcoded `lib/`)
**P1.1** Add `lib/db/cosmos.ts` Cosmos client. Create `products`, `brands`, `quotes`, `users`, `imageRegistry` containers with partition keys. Seed script `scripts/seed-cosmos.ts` that imports the current `lib/products.ts` + `lib/brands.ts`.
**P1.2** Refactor `lib/products.ts` and `lib/brands.ts` to async `getProducts()` / `getBrands()` that hit Cosmos with React Server Component caching. Keep identical return shapes so `ProductCard` / brand pages don't change.
**P1.3** Move `lib/image-overrides.ts` from localStorage to Cosmos `imageRegistry` container. Admin panel writes through a new Function.

### Phase 2 — Auth
**P2.1** Provision Entra External ID (B2C's successor) tenant via Bicep. Configure sign-in, sign-up, password-reset user flows. Store tenant ID + client ID in Key Vault.
**P2.2** Replace the mock localStorage auth in `app/sign-in/page.tsx` + `app/sign-up/page.tsx` with `@azure/msal-react`. Add `middleware.ts` protecting `/admin/*`.

### Phase 3 — Storage & Media
**P3.1** Provision Blob containers: `products`, `brands`, `hero`, `team`. Add `lib/storage/blob.ts` + Function `uploadImage` with SAS token issuance. Migrate existing image URLs from GitHub raw + Squarespace + Vercel Blob into Azure Blob via a one-time `scripts/migrate-images.ts`.
**P3.2** Hook Admin Image Panel (`components/admin/AdminImagePanel.tsx`) to the new upload endpoint. Preserve current UX.

### Phase 4 — APIs & Quotes
**P4.1** Create Azure Functions app under `api/`: `submitQuote`, `getProduct`, `listProducts`, `listBrands`, `uploadImage`, `registerImage`. Wire `lib/quote-context.tsx` `submitQuote()` to POST to `/api/submitQuote`.
**P4.2** Wire Event Grid: `QuoteSubmitted` event → Logic App that emails the team + writes to a `quotes-archive` blob. Include Content Safety pre-check on the free-text fields.

### Phase 5 — Search & Discovery
**P5.1** Provision Azure AI Search. Index `products` + `brands` containers via Change Feed. Replace client-side filters in `app/studio/page.tsx` + `app/brands/page.tsx` with `/api/search?q=` calls.
**P5.2** Add "did you mean" + faceted filters backed by Search.

### Phase 6 — AI Enhancements
**P6.1** On image upload, Function pipeline: AI Vision (tags, captions) → Custom Vision (brand logo quality) → write tags into the product record. Surface tags as filter chips in Studio.
**P6.2** Add Translator on locale switch to cover more than EN/FR. Add Immersive Reader button on product detail modal. Add Speech-to-Text on the quote-form "Project Description" field.

### Phase 7 — Realtime & Eventing
**P7.1** Add SignalR/Web PubSub to the admin dashboard: live quote inbox, "someone just viewed X" counters on the home page.
**P7.2** Add Service Bus queue between `submitQuote` Function and downstream handlers (email, archive, CRM push) for retry safety.

### Phase 8 — Observability & Governance
**P8.1** Wire Application Insights SDK in `app/layout.tsx`. Add custom events: `product_view`, `quote_started`, `quote_submitted`. Dashboard in Azure Monitor.
**P8.2** Enable Defender for Cloud Free, Advisor recommendations, Cost Management budget alert at $150 of the $200 credit, Azure Policy baseline (tag enforcement, allowed regions).

### Phase 9 — Enrichments (Tier 2 leftovers)
**P9.1** Azure Maps service-area map on `/about`.
**P9.2** API Management fronting the public product API for partner brands.
**P9.3** Data Factory nightly supplier-CSV → Cosmos pipeline (skeleton + one mock supplier).
**P9.4** Notification Hubs for quote-status push notifications (email + web push).

### Phase 10 — Tier-4 "earn their slot" integrations
**P10.1 — Conversational & voice biometrics.** Provision AI Bot Service ("PromoBot") + Health Bot (admin-only wellness bot). Wire PromoBot into the site footer as a chat widget sourcing product data from Cosmos. Provision Face + Speaker Recognition; add opt-in biometric 2FA on `/admin/*` layered over Entra External ID.
**P10.2 — IoT + edge.** Provision IoT Hub with one simulated "storefront sensor" device (container-hosted simulator under `edge/storefront-sim/`). Deploy IoT Edge runtime to the same container. Surface a live `store-activity` counter card on `/about`.
**P10.3 — ML + batch + containerized compute.** Provision Azure ML workspace; register a `quote-value-predictor` model trained on seeded synthetic data; call it from `submitQuote` Function to return an expected turnaround estimate. Provision Batch for a nightly WebP image-optimization job over the Blob `products` container. Provision Service Fabric hosting the model-caller microservice. Provision AKS as a containerized DR target for the Next.js app.
**P10.4 — Data estate & long-term storage.** Provision Archive Storage tier + lifecycle policy (quotes > 1yr → archive). Provision Azure Files for admin-uploaded brand style guides, mounted by the Functions app. Provision Data Catalog and register Cosmos + Blob + SQL as assets. Provision SQL Managed Instance as a read replica for BI/Power BI. Provision Database Migration Service and document it as the "hardcoded → Cosmos" migration job.
**P10.5 — Network hardening & governance.** Provision Virtual Network, VPN Gateway (P2S), Private Link endpoints for Cosmos/Blob/Key Vault, Network Watcher, Load Balancer. Lock production traffic to private endpoints. Enable Azure Policy baseline, Defender for Cloud Free, Advisor, Cost Management budget ($150 alert on $200 credit), Azure Lighthouse delegation (for nestdigital.ca as MSP), Automanage + Update Manager on any VMs, Attestation, Arc-enable any on-prem/edge box, Resource Mover + Storage Mover + Migrate as configured (even if unused, assessments run). Provision DevTest Labs with one per-PR VM template.
**P10.6 — Open datasets + integration polish.** Wire Open Datasets holiday calendar → "holiday-themed promo" banner on `/studio`. Wire Immersive Reader button on product detail modal. Wire Web PubSub live counters on home. Finalize Logic Apps orchestration: QuoteSubmitted → Teams/Email/Sheets/Service Bus fan-out.

### Phase 11 — Tier-4 health watch (so demos don't silently rot)
**P11.1** Add `api/healthcheck` Timer-triggered Function running weekly that pings every Tier-3/4 resource (IoT device heartbeat, ML endpoint, Bot reply, Face API, Speaker API, Batch last-run, AKS cluster, Service Fabric app, Archive retrieval test, SQL MI ping, Data Factory last pipeline). Writes a status doc to Cosmos `health-reports` and emails you a summary via Logic Apps. Dashboard tile in Azure Monitor + App Insights.

## Critical Files to Modify

- `lib/products.ts`, `lib/brands.ts` — become async data-access wrappers (Phase 1)
- `lib/quote-context.tsx` — `submitQuote` posts to a real endpoint (Phase 4)
- `lib/image-overrides.ts` — replace localStorage with Cosmos-backed registry (Phase 1.3)
- `app/sign-in/page.tsx`, `app/sign-up/page.tsx` — real MSAL auth (Phase 2)
- `components/admin/AdminImagePanel.tsx` — upload via Blob SAS (Phase 3.2)
- `app/studio/page.tsx`, `app/brands/page.tsx` — server-side search via Azure AI Search (Phase 5)
- `app/layout.tsx` — App Insights init (Phase 8)
- New: `infra/*.bicep`, `azure.yaml`, `api/` (Azure Functions), `middleware.ts`, `.github/workflows/azure-*.yml`

## Reuse, Don't Rebuild

- `lib/quote-context.tsx` already encapsulates cart state — only swap the network call.
- `lib/image-registry.ts` already enumerates every image slot; feed that list to the migration script.
- `lib/cms/*.ts` shape is already keyed and locale-aware → maps directly onto Cosmos documents.
- `components/ui/*` (Radix) stays untouched — **no design changes**.

## Hard Limits to Flag

- I can't read your email, your personal Google Drive, v0.dev project history, or nestdigital.ca backing data from this session. To pull "latest v0 version" changes in, you either: (a) sync the v0 export into this repo yourself and re-run the plan, or (b) give me file paths/URLs I can read.
- Portal-only bootstraps (no stable CLI): Entra External ID tenant create, Azure DevOps organization create, Health Data Services workspace ToS acceptance, Face/Speaker Recognition responsible-AI attestation form. Each phase flags these explicitly.
- $200 credit burn rate: SQL Managed Instance + AKS + Service Fabric + VPN Gateway are the expensive-when-left-on items. Phase 10 provisions them with aggressive auto-pause / minimum SKU / start-stop schedules, plus a budget alert at $150. If credit projections exceed $200 before end of trial, the `azure-provision` workflow halts and emails you.
- Tier 4 services are being provisioned because you asked for every free service. The plan spends effort making each one do *something real* instead of sitting idle, but some (IoT, Health Bot, Speaker/Face) are honestly garnish on this app. Phase 11's health watch exists so a dead demo doesn't embarrass you later.

## Verification

- **Per phase:** `pnpm build` locally → push branch → PR preview URL (Static Web App) → manual smoke of the feature the phase added → merge.
- **Design regression guard:** visual diff of `/`, `/studio`, `/brands`, `/my-quote`, `/about`, `/admin` against `main` after every phase. No pixel movement on the existing surfaces is the success bar. Any Tier-4 additions ship as net-new surfaces (widget, admin tab, /about card) so they can't regress existing layouts.
- **End-to-end smoke after Phase 4 and again after Phase 10:** add product to quote → sign in (B2C) → submit quote → verify Cosmos doc + Logic Apps email + App Insights event + Service Bus message + predicted-turnaround from ML model (Phase 10+).
- **Cost:** Cost Management budget alert at $150. `azure-provision` workflow fails closed if projected spend > $200. Weekly cost digest emailed from Logic Apps.
- **Health watch (Phase 11):** weekly Timer Function confirms every Tier-4 integration is alive; failing checks email you.

## First Action (once you approve)

1. Create branch `claude/explore-azure-portal-ry6hx` locally (already the designated feature branch).
2. Save this plan file into the repo at `docs/azure-integration-plan.md` so it travels with the code.
3. Execute **Phase 0 prompt** in VS Code Copilot Chat.
