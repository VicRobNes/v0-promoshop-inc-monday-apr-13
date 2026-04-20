# Azure Architecture

One-page reference for the PromoShop production environment on Azure. All Bicep lives in `infra/`; walkthrough is in `docs/runbooks/production-go-live.md`.

## Topology

```
                                        ┌──────────────────────────────────┐
                                        │  Registrar DNS                   │
                                        │  (Cloudflare / GoDaddy / etc.)   │
                                        │                                  │
                                        │  www.promoshopinc.com  CNAME ────┼──┐
                                        │  asuid.www             TXT       │  │
                                        └──────────────────────────────────┘  │
                                                                              ▼
┌─────────────────────────────── Subscription (client-owned) ──────────────────────────────┐
│                                                                                          │
│  ┌── Consumption budget (opt-in) ──────────────────────────────────────────┐             │
│  │  $ threshold → 50/80/100% email alerts to ops@promoshopinc.com          │             │
│  └─────────────────────────────────────────────────────────────────────────┘             │
│                                                                                          │
│  ┌── Resource group: rg-promoshop-prod (canadacentral) ────────────────────────────────┐ │
│  │                                                                                    │ │
│  │   ┌── Observability ──────────────┐    ┌── Secrets ──────────────────────────┐    │ │
│  │   │ Log Analytics (90d retention) │    │ Key Vault                           │    │ │
│  │   │  └─ App Insights (workspace)  │◀──▶│  AUTH-CLIENT-ID                     │    │ │
│  │   │       └─ Availability test    │    │  AUTH-AUTHORITY                     │    │ │
│  │   │       └─ 5xx + CPU alerts     │    │  (soft-delete 90d, purge protect)   │    │ │
│  │   └───────────────┬───────────────┘    └──────────────────┬──────────────────┘    │ │
│  │                   │                                       │                       │ │
│  │                   │         ┌── Hosting ─────────────────┐│                       │ │
│  │                   └────────▶│ App Service Plan (P0v3,    ││                       │ │
│  │   App Insights conn str     │   Linux)                   ││                       │ │
│  │                             │   └─ App Service Web App   ││                       │ │
│  │  ┌──┐                       │       NODE|22-lts          ││◀── reads Key Vault   │ │
│  │  │  │─ public traffic ─────▶│       `npm start`          ││    refs via MI        │ │
│  │  │  │                       │       HTTPS only, TLS 1.3  ││                       │ │
│  │  │  │      WWW              │       Managed cert on www  ││                       │ │
│  │  └──┘                       │       System + User MI     │└──────────────────────┘ │
│  │   Client                    └─────┬──────┬──────┬────────┘                         │ │
│  │                                   │      │      │                                  │ │
│  │                                   ▼      ▼      ▼                                  │ │
│  │   ┌── Storage Account ─────────┐  │  ┌── Cosmos DB (Core SQL API, Free tier) ─┐   │ │
│  │   │  Blob, shared-key OFF       │◀─┘  │  promoshop database                    │   │ │
│  │   │  5 containers (products,    │     │   ├─ products, brands, imageRegistry   │   │ │
│  │   │    brands, hero, team,      │     │   ├─ quotes, users, healthReports      │   │ │
│  │   │    quotes-archive)          │     │  Periodic backup 4h / 168h / Local     │   │ │
│  │   │  7-day blob soft-delete     │     │  1000 RU/s shared throughput           │   │ │
│  │   │  MI-based user-delegation   │     │  MI data-plane: SQL Data Contributor   │   │ │
│  │   │    SAS minting              │     └────────────────────────────────────────┘   │ │
│  │   └─────────────────────────────┘                                                   │ │
│  │                                                                                     │ │
│  │   ┌── User-assigned Managed Identity ────────────────────────────────────────────┐  │ │
│  │   │  Attached to the App Service. Resource-scoped roles:                          │  │ │
│  │   │   • Key Vault Secrets Officer (Key Vault)                                     │  │ │
│  │   │   • Storage Blob Data Contributor (Storage)                                   │  │ │
│  │   │   • Cosmos SQL Built-in Data Contributor (Cosmos, data-plane)                 │  │ │
│  │   └──────────────────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                                          ▲
                                          │  ms-graph
                                          │
     ┌────────────── External tenant (Entra External ID / CIAM) ──────────────────┐
     │  promoshop.ciamlogin.com                                                   │
     │    • App Registration "promoshop-web-prod" — SPA redirect URIs             │
     │    • User flow  B2C_1_signupsignin                                         │
     │    • App Role   admin                                                      │
     └────────────────────────────────────────────────────────────────────────────┘
```

## Design choices (and what they reject)

**Hosting — App Service Linux, not Static Web Apps.** SWA Next.js Hybrid is labeled preview in Microsoft's own docs and there's no explicit Next 16 support statement. App Service Linux runs `next start` directly: GA, SLA-backed, no app-size ceiling, no build-preset mismatch with the `proxy.ts` rename. The cost difference (~$55/mo P0v3 vs ~$9/mo SWA Standard) buys production-grade tier parity and is covered by the client's hosting budget.

**Auth — Entra External ID, not bolted on per-route.** Single CIAM tenant handles sign-up, sign-in, password reset, and role claims. The app reads the JWT; the `proxy.ts` matcher gates `/admin/**` and `/api/admin/**`. No homegrown token logic.

**Data — Cosmos DB free tier + Blob Storage.** Cosmos at 1000 RU/s shared DB throughput is free forever (one free-tier account per subscription). Blob holds everything that isn't hot relational: product images, brand logos, hero photography. Shared-key access is off; the app mints short-lived user-delegation SAS tokens through the managed identity.

**Secrets — Key Vault only.** No env files checked in, no plain-text app settings for credentials. Auth IDs live in Key Vault; App Service resolves them at runtime via `@Microsoft.KeyVault(...)` references backed by the user-assigned MI.

**Observability — workspace-linked App Insights.** One Log Analytics workspace, one App Insights component, one action group, one availability test, 5xx + CPU alerts. Nothing custom. Adding the OpenTelemetry SDK in `app/layout.tsx` is a one-line app change that unlocks request spans — flagged as a follow-up.

**Cost — one budget, three progressive email alerts.** Subscription-scope budget at $150/month, actual spend (not forecast — forecast is noisy on low-utilization accounts). 50% / 80% / 100% alerts. Opt-in via the provision workflow input so non-prod environments don't spam.

**RBAC — least privilege from day 1.** The deploying service principal gets subscription Contributor *only for the initial provision*, then the runbook walks through scoping it down to RG-Contributor + User Access Administrator. The managed identity only holds the three data-plane roles it needs.

## What's deliberately not here

- **Azure Front Door / CDN / WAF.** The app isn't global-traffic heavy; App Service's built-in TLS + HTTP/2 is enough. Revisit if traffic > 10k req/min or if a WAF is required for compliance.
- **Container Registry.** No Docker build in the pipeline. If the app ever moves to Container Apps, re-enable the dormant `modules/containerRegistry.bicep`.
- **Azure Functions.** The Next.js App Router's built-in API routes cover every server endpoint the product needs. Adding a Functions app would split runtime + telemetry across two hosts for no clear win.
- **Cosmos continuous backup / geo redundancy.** Free-tier constraint. Periodic Local is the most aggressive DR this tier supports; customer is aware and accepts.
- **Private endpoints / VNet integration.** The app is public-internet by design (it's a marketing + quote site). Adding VNet now is complexity without a threat-model justification. Revisit if the product ever holds regulated data.

## Cost envelope (approximate, USD/month)

| Resource | Base cost | Notes |
|---|---|---|
| App Service Plan P0v3 | $55 | 24×7. ~$75 on P1v3 if zone redundancy added. |
| Cosmos DB free tier | $0 | First 1000 RU/s + 25 GB free forever. |
| Storage Account | <$1 | Mostly-static assets, LRS. |
| Key Vault | <$1 | Per-operation pricing, rarely exceeds a few cents. |
| Log Analytics | ~$0 | 5 GB/day cap matches always-free quota; overage ~$2.76/GB. |
| App Insights | ~$0 | Inside the Log Analytics quota. |
| Availability test | <$1 | 5 locations × 5 min ping × 30 days. |
| Action group | $0 | Email receivers are free. |
| Budget | $0 | Microsoft.Consumption is free. |
| Managed certificate | $0 | Free for any hostname bound to App Service. |
| **Total** | **~$60/month** | Before custom-domain-level DNS (registrar's fee). |
