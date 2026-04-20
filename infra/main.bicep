// Production infrastructure for PromoShop on Azure.
//
// Single resource group, managed-identity-centric. Hosting is App Service
// Linux running `next start` directly (SWA Next.js hybrid is still labeled
// preview in Microsoft's docs and the Next 16 `proxy.ts` convention isn't
// in SWA's build-preset; we don't take that tail risk for a production
// client deploy).
//
// Topology:
//
//   rg-promoshop-${env}
//     ├─ Log Analytics workspace  (90-day retention, 5 GB/day ingest cap)
//     ├─ Application Insights     (workspace-linked)
//     ├─ Key Vault                (soft-delete 90d + purge protect, RBAC auth)
//     ├─ Storage Account          (shared-key OFF, blob public OFF, TLS 1.2)
//     ├─ Cosmos DB                (free tier, 1000 RU/s shared, 7-day backup)
//     ├─ User-assigned MI         (KV Secrets Officer, Blob Data Contributor,
//     │                             Cosmos SQL Data Contributor)
//     ├─ App Service Plan (Linux, P0v3) + Web App (Node 22, next start)
//     ├─ Action Group + availability test + metric alerts      (opt-in)
//     ├─ Custom domain binding + managed cert                  (opt-in)
//     └─ (Entra External ID: portal-bootstrapped; IDs pushed to Key Vault)
//
//   subscription/
//     └─ Consumption budget ($ amount, 50/80/100% alerts)      (opt-in)
//
// Opt-in knobs (all optional; module is not instantiated when empty):
//   - `budgetContactEmails`  → enables budget
//   - `alertContactEmails`   → enables alerts
//   - `customDomainName`     → enables domain binding + managed cert
//   - `grantDeployPrincipalRgContributor` → grants RG-Contributor to
//     `principalId` (default false — follows least-privilege even for dev).

targetScope = 'subscription'

// ---------- Core parameters ------------------------------------------------
@description('Short environment name (e.g. dev, staging, prod). Forms part of resource names + drives alwaysOn + hosting SKU defaults.')
@minLength(1)
@maxLength(16)
param environmentName string

@description('Azure region for non-App-Service resources. Defaults to Canada Central.')
param location string = 'canadacentral'

@description('Azure region for the App Service. Canada Central is supported as of 2024; keep in sync with `location` unless the client needs a specific region.')
param appServiceLocation string = 'canadacentral'

@description('AAD object ID of the human or SP running azd. Only receives RBAC when `grantDeployPrincipalRgContributor` is true. Empty to skip.')
param principalId string = ''

@description('Type of the deploying principal.')
@allowed([
  'User'
  'Group'
  'ServicePrincipal'
])
param principalType string = 'User'

@description('Explicit opt-in to grant the deploying principal Contributor on the RG. Default false for least privilege — production deploys should rely on resource-scoped roles assigned out-of-band.')
param grantDeployPrincipalRgContributor bool = false

// ---------- Hosting SKU knob ----------------------------------------------
@description('App Service Plan SKU. P0v3 is the smallest production-grade tier (SLA + zone redundancy option). Use B1 only for non-prod smoke tests.')
@allowed([
  'B1'
  'P0v3'
  'P1v3'
  'P2v3'
])
param appServiceSkuName string = 'P0v3'

// ---------- Phase 2: Entra External ID -----------------------------------
@description('Phase 2 — Tenant ID of the Entra External ID (CIAM) tenant. Portal-only bootstrap; leave empty until docs/runbooks/phase-2-auth.md is walked.')
param externalIdTenantId string = ''

@description('Phase 2 — Domain of the External ID tenant (e.g. promoshop.ciamlogin.com).')
param externalIdTenantDomain string = ''

@description('Phase 2 — App (client) ID of the SPA App Registration.')
param externalIdClientId string = ''

@description('Phase 2 — Name of the sign-in/sign-up user flow.')
param externalIdUserFlowName string = 'B2C_1_signupsignin'

// ---------- Observability + cost-control opt-ins --------------------------
@description('Email addresses that receive budget alerts (50/80/100%). Leave empty to skip budget creation.')
param budgetContactEmails array = []

@description('Monthly budget ceiling in USD. Fires a 100% alert before it is exceeded.')
@minValue(10)
@maxValue(100000)
param budgetAmountUsd int = 150

@description('Email addresses that receive App Insights alerts (availability, 5xx, CPU). Leave empty to skip.')
param alertContactEmails array = []

// ---------- Custom-domain opt-ins -----------------------------------------
@description('Custom domain to bind to the App Service, e.g. `www.promoshop.com`. Leave empty to skip. Requires the registrar-side CNAME + (for apex domains) TXT verification record to be in place BEFORE `azd provision`; see production-go-live runbook.')
param customDomainName string = ''

// ---------- Shared values -------------------------------------------------
var abbrs = loadJsonContent('abbreviations.json')
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

var tags = {
  'azd-env-name': environmentName
  project: 'promoshop'
  environment: environmentName
  managedBy: 'azd'
}

// ---------- Resource group ------------------------------------------------
resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: 'rg-promoshop-${environmentName}'
  location: location
  tags: tags
}

// ---------- Observability -------------------------------------------------
module logAnalytics 'modules/logAnalytics.bicep' = {
  name: 'logAnalytics'
  scope: resourceGroup
  params: {
    name: '${abbrs.operationalInsightsWorkspaces}promoshop-${environmentName}-${resourceToken}'
    location: location
    tags: tags
  }
}

module appInsights 'modules/appInsights.bicep' = {
  name: 'appInsights'
  scope: resourceGroup
  params: {
    name: '${abbrs.insightsComponents}promoshop-${environmentName}-${resourceToken}'
    location: location
    tags: tags
    workspaceId: logAnalytics.outputs.id
  }
}

// ---------- Secrets -------------------------------------------------------
module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  scope: resourceGroup
  params: {
    name: take('${abbrs.keyVaultVaults}pshop-${environmentName}-${resourceToken}', 24)
    location: location
    tags: tags
  }
}

// ---------- Storage -------------------------------------------------------
module storage 'modules/storage.bicep' = {
  name: 'storage'
  scope: resourceGroup
  params: {
    name: take(toLower('${abbrs.storageStorageAccounts}pshop${environmentName}${resourceToken}'), 24)
    location: location
    tags: tags
  }
}

// ---------- Database ------------------------------------------------------
module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmos'
  scope: resourceGroup
  params: {
    name: take('${abbrs.documentDBDatabaseAccounts}promoshop-${environmentName}-${resourceToken}', 44)
    location: location
    tags: tags
  }
}

// ---------- Managed identity + resource-scoped RBAC -----------------------
module managedIdentity 'modules/managedIdentity.bicep' = {
  name: 'managedIdentity'
  scope: resourceGroup
  params: {
    name: '${abbrs.managedIdentityUserAssignedIdentities}promoshop-${environmentName}-${resourceToken}'
    location: location
    tags: tags
    keyVaultId: keyVault.outputs.id
    storageAccountId: storage.outputs.id
    cosmosAccountName: cosmos.outputs.name
  }
}

// ---------- Phase 2: Entra External ID (CIAM) ----------------------------
module entraExternalId 'modules/entraExternalId.bicep' = {
  name: 'entraExternalId'
  scope: resourceGroup
  params: {
    environmentName: environmentName
    externalIdTenantId: externalIdTenantId
    externalIdTenantDomain: externalIdTenantDomain
    preProvisionedClientId: externalIdClientId
    userFlowName: externalIdUserFlowName
    keyVaultName: keyVault.outputs.name
  }
}

// ---------- Hosting: App Service ------------------------------------------
// P1v3+ allows zone redundancy. P0v3 is single-zone but HA-shaped.
var canZoneRedundant = !(appServiceSkuName == 'B1' || appServiceSkuName == 'P0v3')

module appService 'modules/appService.bicep' = {
  name: 'appService'
  scope: resourceGroup
  params: {
    planName: '${abbrs.webServerFarms}promoshop-${environmentName}-${resourceToken}'
    siteName: '${abbrs.webSitesAppService}promoshop-${environmentName}-${resourceToken}'
    location: appServiceLocation
    tags: tags
    skuName: appServiceSkuName
    userAssignedIdentityId: managedIdentity.outputs.id
    appInsightsConnectionString: appInsights.outputs.connectionString
    cosmosEndpoint: cosmos.outputs.documentEndpoint
    cosmosDatabaseName: cosmos.outputs.databaseName
    storageAccountName: storage.outputs.name
    keyVaultUri: keyVault.outputs.vaultUri
    isProduction: environmentName == 'prod'
    zoneRedundant: canZoneRedundant
  }
}

// ---------- Alerts (opt-in when alertContactEmails is populated) ---------
module alerts 'modules/alerts.bicep' = if (!empty(alertContactEmails)) {
  name: 'alerts'
  scope: resourceGroup
  params: {
    environmentName: environmentName
    location: 'global'
    tags: tags
    appServiceId: appService.outputs.id
    siteUrl: 'https://${appService.outputs.defaultHostname}/'
    appInsightsId: appInsights.outputs.id
    appInsightsLocation: location
    contactEmails: alertContactEmails
  }
}

// ---------- Custom domain + managed cert (opt-in) ------------------------
module customDomain 'modules/customDomain.bicep' = if (!empty(customDomainName)) {
  name: 'customDomain'
  scope: resourceGroup
  params: {
    siteName: appService.outputs.name
    domain: customDomainName
    location: appServiceLocation
    tags: tags
  }
}

// ---------- Subscription-scope budget (opt-in) ---------------------------
module budget 'modules/budget.bicep' = if (!empty(budgetContactEmails)) {
  name: 'promoshopBudget'
  scope: subscription()
  params: {
    name: 'promoshop-${environmentName}-monthly-budget'
    amount: budgetAmountUsd
    contactEmails: budgetContactEmails
  }
}

// ---------- Optional: grant the deploying principal Contributor on the RG ----------
var rgContributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

module principalRgContributor 'modules/roleAssignment.bicep' = if (grantDeployPrincipalRgContributor && !empty(principalId)) {
  name: 'principalRgContributor'
  scope: resourceGroup
  params: {
    principalId: principalId
    principalType: principalType
    roleDefinitionId: rgContributorRoleId
    resourceGroupName: resourceGroup.name
  }
}

// ---------- Outputs -------------------------------------------------------
@description('Name of the resource group that holds all foundation resources.')
output AZURE_RESOURCE_GROUP string = resourceGroup.name

@description('Azure region non-hosting resources were deployed into.')
output AZURE_LOCATION string = location

@description('Resource ID of the Log Analytics workspace.')
output LOG_ANALYTICS_WORKSPACE_ID string = logAnalytics.outputs.id

@description('Resource ID of the Application Insights component.')
output APPLICATION_INSIGHTS_ID string = appInsights.outputs.id

@description('Application Insights connection string.')
output APPLICATION_INSIGHTS_CONNECTION_STRING string = appInsights.outputs.connectionString

@description('Resource ID of the Key Vault.')
output KEY_VAULT_ID string = keyVault.outputs.id

@description('Key Vault DNS endpoint.')
output KEY_VAULT_URI string = keyVault.outputs.vaultUri

@description('Resource ID of the Storage Account.')
output STORAGE_ACCOUNT_ID string = storage.outputs.id

@description('Storage account name — pass as AZURE_STORAGE_ACCOUNT at runtime.')
output STORAGE_ACCOUNT_NAME string = storage.outputs.name

@description('Primary blob endpoint.')
output STORAGE_BLOB_ENDPOINT string = storage.outputs.primaryBlobEndpoint

@description('Resource ID of the Cosmos DB account.')
output COSMOS_ACCOUNT_ID string = cosmos.outputs.id

@description('Cosmos DB document endpoint URI.')
output COSMOS_DOCUMENT_ENDPOINT string = cosmos.outputs.documentEndpoint

@description('Resource ID of the App Service site.')
output APP_SERVICE_ID string = appService.outputs.id

@description('App Service name — use with `az webapp deploy` and `az webapp config`.')
output APP_SERVICE_NAME string = appService.outputs.name

@description('Default hostname of the App Service.')
output APP_SERVICE_HOSTNAME string = appService.outputs.defaultHostname

@description('Resource ID of the user-assigned managed identity.')
output MANAGED_IDENTITY_ID string = managedIdentity.outputs.id

@description('Client ID of the managed identity (for DefaultAzureCredential).')
output MANAGED_IDENTITY_CLIENT_ID string = managedIdentity.outputs.clientId

@description('Principal (object) ID of the managed identity.')
output MANAGED_IDENTITY_PRINCIPAL_ID string = managedIdentity.outputs.principalId

@description('App (client) ID of the SPA App Registration. Empty until the Entra External ID runbook is walked.')
output AUTH_CLIENT_ID string = entraExternalId.outputs.AUTH_CLIENT_ID

@description('OIDC authority URL for MSAL.')
output AUTH_AUTHORITY string = entraExternalId.outputs.AUTH_AUTHORITY

@description('Redirect URIs that should be registered on the App Registration SPA platform.')
output AUTH_REDIRECT_URIS array = entraExternalId.outputs.REDIRECT_URIS
