# Phase 2 — Auth (Entra External ID) Runbook

Phase 2 replaces the `localStorage` mock in `app/sign-in` + `app/sign-up` with
real Entra External ID (CIAM — the B2C successor) via MSAL.js, and gates
`/admin/*` + `/api/admin/*` behind the middleware at `middleware.ts`.

The Entra External ID tenant itself is portal-only — there is no stable ARM /
Bicep path to create the tenant. The App Registration + user flow **can**
eventually be created via the `microsoftGraphV1_0` preview Bicep extension,
but most runners don't have it today, so this runbook captures the equivalent
`az cli` steps. The Bicep (`infra/modules/entraExternalId.bicep`) accepts the
resulting tenant ID / domain / client ID as inputs and pipes them into Key
Vault + `azd` outputs.

---

## Summary of changes shipped in the PR

- `infra/modules/entraExternalId.bicep` — pass-through module that accepts
  tenant ID / domain / client ID params, computes the OIDC authority URL, and
  writes `AUTH-CLIENT-ID` + `AUTH-AUTHORITY` to Key Vault.
- `infra/main.bicep` — calls the module; new parameters
  `externalIdTenantId`, `externalIdTenantDomain`, `externalIdClientId`,
  `externalIdUserFlowName`. `AUTH_CLIENT_ID` + `AUTH_AUTHORITY` +
  `AUTH_REDIRECT_URIS` exposed as top-level Bicep outputs.
- `lib/auth/msalConfig.ts`, `lib/auth/AuthProvider.tsx`,
  `lib/auth/useAdminGuard.ts`, `lib/auth/server.ts` — MSAL wiring + fallback.
- `middleware.ts` — redirects / 401s unauthenticated + non-admin requests.
- `app/layout.tsx` wraps in `<AuthProvider>`. `app/sign-in` / `app/sign-up`
  call `signIn()` from `useAuth()` (fallback stays identical when env is
  missing — no design regression).
- `app/api/admin/image-overrides/route.ts` gated via `getSessionFromRequest`.

---

## One-time portal + CLI bootstrap

### 0. Prereqs

```bash
export SUB_ID="$(az account show --query id -o tsv)"
export EXTERNAL_ID_NAME="promoshop"          # tenant name; becomes *.ciamlogin.com
export EXTERNAL_ID_DISPLAY_NAME="PromoShop External ID"
export EXTERNAL_ID_LOCATION="canada"         # data residency; see portal picker
export RG="rg-promoshop-dev"                 # the Phase-0 RG
export APP_NAME="PromoShop Web (dev)"
export PROD_URL="https://www.promoshop.ca"  # or nestdigital.ca equivalent
export SWA_HOSTNAME="$(az staticwebapp show -n <swa-name> -g "$RG" --query defaultHostname -o tsv)"
```

### 1. Create the Entra External ID tenant (portal-only)

1. Open the Azure portal → **Microsoft Entra ID** → **Manage tenants** →
   **Create**.
2. Pick **External** as the tenant type (not "Workforce").
3. Tenant name: `${EXTERNAL_ID_NAME}` (will become
   `${EXTERNAL_ID_NAME}.onmicrosoft.com` + `${EXTERNAL_ID_NAME}.ciamlogin.com`).
4. Data residency: pick the nearest supported region (Canada isn't available
   for External ID today — US or EU are the current options; pick US-EAST
   unless you have a compliance reason to prefer EU).
5. Link to your existing subscription (`$SUB_ID`) so billing consolidates.
6. Wait for provisioning to finish (~2 minutes). Record:
   - **Tenant ID** (GUID) → `$EXTERNAL_ID_TENANT_ID`
   - **Primary domain** → `${EXTERNAL_ID_NAME}.ciamlogin.com` →
     `$EXTERNAL_ID_TENANT_DOMAIN`

There is an undocumented `az rest` preview call that can do the above, but
Microsoft has broken it twice in the last 6 months — do the portal step and
move on.

### 2. Switch `az` context to the new tenant

```bash
az login --tenant "${EXTERNAL_ID_TENANT_ID}"
az account set --subscription "$SUB_ID"
```

### 3. Create the SPA app registration

```bash
export REDIRECTS=(
  "http://localhost:3000"
  "http://localhost:3000/sign-in"
  "http://localhost:3000/sign-up"
  "https://${SWA_HOSTNAME}"
  "https://${SWA_HOSTNAME}/sign-in"
  "https://${SWA_HOSTNAME}/sign-up"
  "${PROD_URL}"
  "${PROD_URL}/sign-in"
  "${PROD_URL}/sign-up"
)

az ad app create \
  --display-name "$APP_NAME" \
  --sign-in-audience "AzureADMyOrg" \
  --enable-id-token-issuance false \
  --enable-access-token-issuance false \
  --web-redirect-uris "" \
  --public-client-redirect-uris ""

# Fetch the app id we just minted:
export EXTERNAL_ID_CLIENT_ID="$(az ad app list --display-name "$APP_NAME" --query '[0].appId' -o tsv)"
export APP_OBJECT_ID="$(az ad app list --display-name "$APP_NAME" --query '[0].id' -o tsv)"

# Patch the SPA redirect URIs (az ad app update doesn't yet support --spa-redirect-uris directly)
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/${APP_OBJECT_ID}" \
  --headers "Content-Type=application/json" \
  --body "{\"spa\": {\"redirectUris\": $(printf '%s\n' "${REDIRECTS[@]}" | jq -R . | jq -s .)}}"
```

### 4. Create the sign-up / sign-in user flow

Entra External ID merges sign-up and sign-in into a single user flow.

Portal path (no stable CLI today):

1. In the External ID tenant → **External Identities** → **User flows**.
2. **New user flow** → pick **Sign up and sign in** → next.
3. Name: `B2C_1_signupsignin` (matches `externalIdUserFlowName` default).
4. Identity providers: enable **Email with password**.
5. User attributes to collect on sign-up: `Email`, `Given Name`, `Surname`,
   `Company Name`.
6. Claims to return in the token: same four, plus **User's Object ID**,
   **Email Addresses**, and **Roles**.
7. Save.

### 5. Add an `admin` app role (so `roles` claim can mean something)

```bash
az rest --method PATCH \
  --uri "https://graph.microsoft.com/v1.0/applications/${APP_OBJECT_ID}" \
  --headers "Content-Type=application/json" \
  --body '{"appRoles":[{"allowedMemberTypes":["User"],"description":"PromoShop admin — can manage images + quotes.","displayName":"Admin","id":"3eb3a5b3-e3e3-4d41-af1d-1f6b9e4a1111","isEnabled":true,"value":"admin"}]}'
```

Assign the role to your own account via portal → **Enterprise applications**
→ the app → **Users and groups** → **Add user/group** → pick yourself → role
`Admin`.

### 6. Re-run `azd provision` with the new values

```bash
azd env set EXTERNAL_ID_TENANT_ID       "$EXTERNAL_ID_TENANT_ID"
azd env set EXTERNAL_ID_TENANT_DOMAIN   "${EXTERNAL_ID_NAME}.ciamlogin.com"
azd env set EXTERNAL_ID_CLIENT_ID       "$EXTERNAL_ID_CLIENT_ID"
azd env set EXTERNAL_ID_USER_FLOW_NAME  "B2C_1_signupsignin"
azd provision
```

`azd provision` will write `AUTH-CLIENT-ID` + `AUTH-AUTHORITY` secrets into
Key Vault and surface the same values as Bicep outputs.

### 7. Wire the three `NEXT_PUBLIC_AUTH_*` variables

**Local (`.env.local`)**:

```bash
NEXT_PUBLIC_AUTH_CLIENT_ID=<EXTERNAL_ID_CLIENT_ID>
NEXT_PUBLIC_AUTH_AUTHORITY=https://<tenant>.ciamlogin.com/<EXTERNAL_ID_TENANT_ID>/B2C_1_signupsignin
NEXT_PUBLIC_AUTH_REDIRECT_URI=http://localhost:3000
# Server-side JWT validation (no NEXT_PUBLIC_ prefix):
AUTH_AUTHORITY=https://<tenant>.ciamlogin.com/<EXTERNAL_ID_TENANT_ID>/B2C_1_signupsignin
AUTH_AUDIENCE=<EXTERNAL_ID_CLIENT_ID>
```

**GitHub Actions** (the SWA build pulls from Key Vault, but we set these
directly on the build job to keep the deploy step simple):

```bash
gh secret set NEXT_PUBLIC_AUTH_CLIENT_ID     --body "$EXTERNAL_ID_CLIENT_ID"
gh secret set NEXT_PUBLIC_AUTH_AUTHORITY     --body "https://${EXTERNAL_ID_NAME}.ciamlogin.com/${EXTERNAL_ID_TENANT_ID}/B2C_1_signupsignin"
gh secret set NEXT_PUBLIC_AUTH_REDIRECT_URI  --body "${PROD_URL}"
gh secret set AUTH_AUTHORITY                 --body "https://${EXTERNAL_ID_NAME}.ciamlogin.com/${EXTERNAL_ID_TENANT_ID}/B2C_1_signupsignin"
gh secret set AUTH_AUDIENCE                  --body "$EXTERNAL_ID_CLIENT_ID"
```

**Vercel** — set the same three `NEXT_PUBLIC_*` values under **Project
Settings → Environment Variables**.

### 8. Smoke test

```bash
pnpm dev
# Browser: http://localhost:3000/sign-in → "Sign in" → Entra flow → land at /my-quote
# curl smoke (admin API):
curl -H "x-mock-admin: 1" http://localhost:3000/api/admin/image-overrides  # should 200
curl -H "Authorization: Bearer <real-token>" http://localhost:3000/api/admin/image-overrides  # should 200 when the token carries `roles: ["admin"]`
```

---

## Fallback / dev mode

When any of the three `NEXT_PUBLIC_AUTH_*` values are missing,
`lib/auth/AuthProvider.tsx` falls back to the pre-Phase-2 localStorage mock.
The sign-in / sign-up UI is **pixel-identical** — only the "sign in" button
handler changes. This is the path `pnpm build` takes in CI until the runbook
above has been walked.

For admin-area dev without MSAL, hit any `/api/admin/*` endpoint with
`-H 'x-mock-admin: 1'`. The mock bypass is allowed whenever `AUTH_AUTHORITY`
is unset OR `NODE_ENV !== 'production'`. It is **disabled** on any
production build with the env vars set.

---

## Rollback

Phase 2 is strictly additive:

1. Revert the PR.
2. `app/sign-in/page.tsx` + `app/sign-up/page.tsx` revert to the pre-Phase-2
   localStorage writes. No data migration required.
3. The Entra tenant + app registration are orthogonal; leaving them running
   costs nothing (External ID has a free 50k-MAU tier). Delete via portal if
   you don't want them.
