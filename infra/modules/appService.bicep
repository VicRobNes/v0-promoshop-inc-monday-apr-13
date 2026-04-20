// Production hosting for the PromoShop Next.js 16 app.
//
// Pivoted from Azure Static Web Apps (Next.js hybrid is still labeled
// "preview" in Microsoft's own docs and the SWA build preset's Next
// adapter hasn't been confirmed against Next 16's proxy.ts file
// convention). App Service Linux on Node 22 runs `next start` with no
// preview-status caveats and no app-size limit, and the client pays for
// hosting so the flat cost is acceptable.
//
// Design choices:
//   - Linux App Service Plan (not Windows) for Node LTS parity with local
//     dev + the Vercel build.
//   - System-assigned managed identity on the site so Key Vault references
//     (@Microsoft.KeyVault(...)) resolve without a secret.
//   - User-assigned managed identity ALSO attached so the same identity
//     already holding RBAC on Cosmos + Blob + Key Vault (see
//     modules/managedIdentity.bicep) is usable by the site at runtime.
//   - HTTPS-only, min TLS 1.3, FTPS disabled, SCM basic auth disabled.
//   - Health check path configurable; defaults to `/` because no
//     dedicated `/api/health` route exists yet (flagged in the runbook).

@description('Name of the App Service Plan.')
param planName string

@description('Name of the App Service (Web App).')
param siteName string

@description('Azure region for both plan and site.')
param location string

@description('Tags applied to both resources.')
param tags object

@description('SKU for the App Service Plan. P0v3 is the smallest production-grade (Basic tier has no auto-scale + no deployment slots). Use B1 for non-prod only.')
@allowed([
  'B1'
  'P0v3'
  'P1v3'
  'P2v3'
])
param skuName string = 'P0v3'

@description('Node runtime version. Linux App Service supports NODE|22-lts as GA.')
@allowed([
  'NODE|20-lts'
  'NODE|22-lts'
])
param linuxFxVersion string = 'NODE|22-lts'

@description('Startup command. `npm start` runs `next start` from package.json and works without pnpm being installed on the runtime image.')
param appCommandLine string = 'npm start'

@description('Resource ID of the user-assigned managed identity to attach. Leave empty to skip.')
param userAssignedIdentityId string = ''

@description('Application Insights connection string. Wired as APPLICATIONINSIGHTS_CONNECTION_STRING so the OpenTelemetry SDK can auto-init once the app is updated to require it.')
param appInsightsConnectionString string = ''

@description('Cosmos DB document endpoint passed to the site as COSMOS_ENDPOINT.')
param cosmosEndpoint string = ''

@description('Cosmos DB database name.')
param cosmosDatabaseName string = 'promoshop'

@description('Storage account name passed to the site as AZURE_STORAGE_ACCOUNT. Shared-key access MUST be off on this account; the app mints user-delegation SAS tokens.')
param storageAccountName string = ''

@description('Key Vault URI. Reserved for future @Microsoft.KeyVault(...) references.')
param keyVaultUri string = ''

@description('AUTH_CLIENT_ID + AUTH_AUTHORITY secret references (keyvaultRef:// form). Ignored if empty.')
param authClientIdSecretRef string = ''
param authAuthoritySecretRef string = ''

@description('Path the platform pings for health. Empty = no health check (the default). Point at an always-200 endpoint like `/api/health` once the app ships one — hammering `/` every minute triggers SSR work on the home page.')
param healthCheckPath string = ''

@description('Enable zone redundancy on the plan. Requires P1v3 or above.')
param zoneRedundant bool = false

@description('Whether this site is the production environment. Controls defaults like alwaysOn and HTTPS-only enforcement.')
param isProduction bool = true

// --- App Service Plan -------------------------------------------------------
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: planName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuName == 'B1' ? 'Basic' : 'PremiumV3'
  }
  kind: 'linux'
  properties: {
    reserved: true // Linux
    zoneRedundant: zoneRedundant
  }
}

// --- Web App ---------------------------------------------------------------
// Compose app settings as a sparse object and filter empties so the ARM PATCH
// doesn't wipe values the user may set manually in the portal later.
var baseAppSettings = [
  {
    name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
    value: 'false'
  }
  {
    name: 'WEBSITE_NODE_DEFAULT_VERSION'
    value: '~22'
  }
  {
    name: 'NODE_ENV'
    value: 'production'
  }
  {
    name: 'NEXT_TELEMETRY_DISABLED'
    value: '1'
  }
]

var telemetrySettings = empty(appInsightsConnectionString) ? [] : [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
  {
    name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
    value: '~3'
  }
  {
    name: 'XDT_MicrosoftApplicationInsights_Mode'
    value: 'recommended'
  }
]

var cosmosSettings = empty(cosmosEndpoint) ? [] : [
  {
    name: 'COSMOS_ENDPOINT'
    value: cosmosEndpoint
  }
  {
    name: 'COSMOS_DATABASE_NAME'
    value: cosmosDatabaseName
  }
]

var storageSettings = empty(storageAccountName) ? [] : [
  {
    name: 'AZURE_STORAGE_ACCOUNT'
    value: storageAccountName
  }
]

var keyVaultSettings = empty(keyVaultUri) ? [] : [
  {
    name: 'KEY_VAULT_URI'
    value: keyVaultUri
  }
]

var authSettings = concat(
  empty(authClientIdSecretRef) ? [] : [
    {
      name: 'NEXT_PUBLIC_AUTH_CLIENT_ID'
      value: authClientIdSecretRef
    }
  ],
  empty(authAuthoritySecretRef) ? [] : [
    {
      name: 'NEXT_PUBLIC_AUTH_AUTHORITY'
      value: authAuthoritySecretRef
    }
  ]
)

var allAppSettings = concat(
  baseAppSettings,
  telemetrySettings,
  cosmosSettings,
  storageSettings,
  keyVaultSettings,
  authSettings
)

// Build the identity block without `null` properties so Bicep's ARM
// serialisation stays clean when no user-assigned MI is attached.
var identityConfig = empty(userAssignedIdentityId) ? {
  type: 'SystemAssigned'
} : {
  type: 'SystemAssigned, UserAssigned'
  userAssignedIdentities: {
    '${userAssignedIdentityId}': {}
  }
}

resource site 'Microsoft.Web/sites@2024-04-01' = {
  name: siteName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: identityConfig
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    // Which managed identity acquires tokens for Key Vault references.
    keyVaultReferenceIdentity: empty(userAssignedIdentityId) ? 'SystemAssigned' : userAssignedIdentityId
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      appCommandLine: appCommandLine
      alwaysOn: isProduction
      http20Enabled: true
      minTlsVersion: '1.3'
      ftpsState: 'Disabled'
      scmMinTlsVersion: '1.3'
      healthCheckPath: healthCheckPath
      use32BitWorkerProcess: false
      appSettings: allAppSettings
    }
  }
}

// Disable SCM basic auth so the only way into the Kudu/deployment endpoint is
// AAD (enforces RBAC on the deployment surface).
resource scmBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: site
  name: 'scm'
  properties: {
    allow: false
  }
}

resource ftpBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: site
  name: 'ftp'
  properties: {
    allow: false
  }
}

// --- Outputs ---------------------------------------------------------------
@description('Resource ID of the App Service.')
output id string = site.id

@description('Name of the App Service.')
output name string = site.name

@description('Default hostname (e.g. promoshop-prod-xxxxxxxx.azurewebsites.net).')
output defaultHostname string = site.properties.defaultHostName

@description('Principal (object) ID of the site\'s system-assigned managed identity. Grant data-plane roles against this for anything not already covered by the user-assigned MI.')
output systemAssignedPrincipalId string = site.identity.principalId

@description('Resource ID of the App Service Plan.')
output planId string = plan.id

@description('Name of the App Service Plan.')
output planName string = plan.name
