# Phase 0 — Bootstrap Runbook

This runbook walks through the one-time manual setup required before
`azure-provision.yml` can run. After completing it once per environment
you can re-provision Phase 0 infrastructure at any time by clicking
**Run workflow** on the `Azure Provision (azd)` action.

Target repo: `v0-promoshop-inc-monday-apr-13`
Target environment name: `dev` (or `staging`, `prod` — pick one; these steps work per-env).

---

## Prerequisites

- `az` CLI version `>= 2.55.0` (`az version`)
- Logged in: `az login`
- The subscription you want to use: `az account set --subscription "<SUB_ID>"`
- Owner or User Access Administrator on the subscription (required to grant RBAC roles)
- `gh` CLI installed and authenticated (`gh auth status`) for setting repo secrets

Export a few variables you will reuse below:

```bash
export SUB_ID="$(az account show --query id -o tsv)"
export TENANT_ID="$(az account show --query tenantId -o tsv)"
export GH_REPO="<your-org>/v0-promoshop-inc-monday-apr-13"   # adjust
export APP_NAME="promoshop-gha-oidc"
export ENV_NAME="dev"                                          # or staging / prod
export LOCATION="canadacentral"
```

---

## (a) Create an App Registration with a federated credential for GitHub Actions OIDC

This is the identity GitHub Actions will assume via OIDC — no client secret
is ever issued or stored.

### 1. Create the App Registration and service principal

```bash
APP_ID="$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)"
az ad sp create --id "$APP_ID" >/dev/null
SP_OBJECT_ID="$(az ad sp show --id "$APP_ID" --query id -o tsv)"
echo "AZURE_CLIENT_ID=$APP_ID"
echo "SP_OBJECT_ID=$SP_OBJECT_ID"
```

### 2. Add a federated credential for the `main` branch

Used by `workflow_dispatch` runs initiated from `main`:

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "$(cat <<EOF
{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GH_REPO}:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"],
  "description": "GitHub Actions OIDC for main branch"
}
EOF
)"
```

### 3. Add a federated credential for the current feature branch (optional)

If you want to run `azure-provision` from the `claude/explore-azure-portal-ry6hx` branch before merging:

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "$(cat <<EOF
{
  "name": "github-claude-explore-branch",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GH_REPO}:ref:refs/heads/claude/explore-azure-portal-ry6hx",
  "audiences": ["api://AzureADTokenExchange"],
  "description": "GitHub Actions OIDC for phase-0 exploration branch"
}
EOF
)"
```

### 4. (Optional) Federated credential for Pull Requests

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "$(cat <<EOF
{
  "name": "github-pr",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:${GH_REPO}:pull_request",
  "audiences": ["api://AzureADTokenExchange"],
  "description": "GitHub Actions OIDC for pull requests"
}
EOF
)"
```

---

## (b) Assign Contributor + User Access Administrator on the subscription

`azd provision` creates the resource group and assigns RBAC, so the
identity needs both roles at the subscription scope. Run these once:

```bash
# Contributor — create/modify all resources
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "Contributor" \
  --scope "/subscriptions/$SUB_ID"

# User Access Administrator — required because the Bicep creates role assignments
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --assignee-principal-type ServicePrincipal \
  --role "User Access Administrator" \
  --scope "/subscriptions/$SUB_ID"
```

> Security note: `User Access Administrator` is powerful. If you prefer tighter
> scope, assign it only on the resource group *after* the first provision
> succeeds at subscription scope, and drop the subscription-level grant.

---

## (c) Set the required GitHub Actions secrets

```bash
gh secret set AZURE_CLIENT_ID        --repo "$GH_REPO" --body "$APP_ID"
gh secret set AZURE_TENANT_ID        --repo "$GH_REPO" --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID  --repo "$GH_REPO" --body "$SUB_ID"
gh secret set AZURE_ENV_NAME         --repo "$GH_REPO" --body "$ENV_NAME"
gh secret set AZURE_LOCATION         --repo "$GH_REPO" --body "$LOCATION"
```

Verify:

```bash
gh secret list --repo "$GH_REPO"
```

You should see `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`,
`AZURE_ENV_NAME`, `AZURE_LOCATION`. (The `AZURE_STATIC_WEB_APPS_API_TOKEN`
secret is added in step (e) after the provision run.)

---

## (d) Run the provision workflow

Either via the GitHub UI: **Actions → Azure Provision (azd) → Run workflow**,
selecting the branch and filling in `environmentName` (e.g. `dev`).

Or via CLI:

```bash
gh workflow run azure-provision.yml \
  --repo "$GH_REPO" \
  --ref main \
  -f environmentName="$ENV_NAME" \
  -f location="$LOCATION"
```

Watch it:

```bash
gh run watch --repo "$GH_REPO"
```

The job step **Emit deployment outputs** prints every `azd` env value,
including `STATIC_WEB_APP_NAME`, `COSMOS_DOCUMENT_ENDPOINT`, `KEY_VAULT_URI`,
`MANAGED_IDENTITY_CLIENT_ID`, etc.

Expected resources (after success) in `rg-promoshop-${ENV_NAME}`:

- Log Analytics workspace
- Application Insights (workspace-based)
- Key Vault (RBAC, purge protection on)
- Storage Account with blob containers `products`, `brands`, `hero`, `team`,
  `quotes-archive` and file share `brand-style-guides`
- Cosmos DB account (free tier, serverless) with database `promoshop` and
  containers `products`, `brands`, `quotes`, `users`, `imageRegistry`, `healthReports`
- Static Web App (Free tier)
- Container Registry (Basic)
- User-assigned Managed Identity with RBAC on Key Vault, Storage, and Cosmos

---

## (e) Capture the Static Web App deployment token

The deployment token is not emitted by Bicep (Azure does not expose it as an
ARM output). Fetch it with `az` after provisioning:

```bash
SWA_NAME="$(az staticwebapp list \
  --resource-group "rg-promoshop-${ENV_NAME}" \
  --query "[0].name" -o tsv)"

SWA_TOKEN="$(az staticwebapp secrets list \
  --name "$SWA_NAME" \
  --resource-group "rg-promoshop-${ENV_NAME}" \
  --query "properties.apiKey" -o tsv)"

# Stash as a repo secret so azure-deploy.yml can use it
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN \
  --repo "$GH_REPO" \
  --body "$SWA_TOKEN"

unset SWA_TOKEN   # do not leave this in your shell history
```

Verify:

```bash
gh secret list --repo "$GH_REPO" | grep AZURE_STATIC_WEB_APPS_API_TOKEN
```

From this point, any push to `main` triggers `azure-deploy.yml`, which
builds the Next.js app and ships it to the Static Web App.

---

## Teardown (when you want to free the $200 credit back up)

```bash
az group delete --name "rg-promoshop-${ENV_NAME}" --yes --no-wait
# Key Vault and Cosmos free-tier are both subscription-scoped resources that
# require purging if you want to re-use the name:
az keyvault purge --name "<the-kv-name-from-outputs>"
```

Re-running `azure-provision` after a delete re-creates everything cleanly.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `AADSTS70021: No matching federated identity record found` | Subject mismatch — the federated credential's `subject` must match `repo:<org>/<repo>:ref:refs/heads/<branch>` exactly for the branch you're running from. |
| `Cannot create more than 1 free tier Cosmos DB account in this subscription` | Set `enableFreeTier: false` in `infra/modules/cosmos.bicep` for this env, or delete the existing free-tier account first. |
| `Key Vault name already exists (soft-deleted)` | Purge the soft-deleted vault: `az keyvault purge --name <name>`. |
| `AuthorizationFailed` on role assignment step | The SP is missing `User Access Administrator` at subscription scope — re-run step (b). |
| Static Web App region rejected | SWA is only in a subset of regions. `main.bicep` hardcodes `centralus` for the SWA; don't override unless you know the region supports Free tier SWA. |
