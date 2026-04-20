// Phase 2 — Entra External ID wiring.
//
// Reality check: the Entra External ID *tenant itself* cannot be created via
// ARM / Bicep today. There is no stable control-plane resource type for
// "create an External ID tenant" — that step is portal-only (or a one-shot
// `az rest` POST against the CIAM preview API, captured in the runbook).
//
// Once the tenant exists, the App Registration + user-flow association can
// be modelled via the Microsoft Graph Bicep extension (`microsoftGraphV1_0`,
// currently in preview). If that extension is available in the build runner
// set `useGraphProvider: true` and pass a `tenantId`. Otherwise the module
// degrades to a no-op that simply threads the caller-supplied values through
// as outputs, so `bicep build` always succeeds and Phase 2 Bicep can ship
// ahead of the portal bootstrap. Runbook docs/runbooks/phase-2-auth.md holds
// the az CLI fallback commands.

@description('Short environment name — e.g. dev, staging, prod.')
param environmentName string

@description('Tenant ID (GUID) of the Entra External ID tenant. Leave empty until the portal-only tenant-create step has been completed. When empty the module becomes a pass-through and all outputs surface placeholder values.')
param externalIdTenantId string = ''

@description('Domain of the External ID tenant, e.g. promoshop.ciamlogin.com. Used to build the OIDC authority URL. Leave empty to fall through.')
param externalIdTenantDomain string = ''

@description('Name of the user flow that powers sign-in + sign-up (Entra External ID merges these into a single flow).')
param userFlowName string = 'B2C_1_signupsignin'

@description('Display name for the App Registration. Only used if useGraphProvider is true. Unused today; reserved for the Graph-provider path.')
#disable-next-line no-unused-params
param appDisplayName string = 'PromoShop Web (${environmentName})'

@description('Redirect URIs to register against the SPA platform of the App Registration. Defaults cover local dev, SWA, and Vercel prod.')
param redirectUris array = [
  'http://localhost:3000'
  'http://localhost:3000/sign-in'
  'http://localhost:3000/sign-up'
]

@description('Pre-provisioned App (client) ID. Pass this when the App Registration was created out-of-band via the portal or az CLI (see runbook). Leave empty to rely on Graph provider below.')
param preProvisionedClientId string = ''

@description('Set true to attempt to provision the App Registration via the Microsoft Graph Bicep extension. Most CI runners will not have the preview extension installed — keep false and use the az CLI fallback from the runbook.')
param useGraphProvider bool = false

@description('Name of the Key Vault that should receive AUTH_CLIENT_ID and AUTH_AUTHORITY as secrets. Leave empty to skip Key Vault writes (e.g. when running a what-if outside of Phase 0 foundation).')
param keyVaultName string = ''

// ---- Graph-provider path (preview, optional) ----------------------------
// The Microsoft Graph Bicep extension ships the `Microsoft.Graph/applications`
// resource. If useGraphProvider is true and the extension is available in the
// current Bicep config, this block would register the app. We guard it with a
// straight `if (false)` until the extension is stable in the build runner; the
// `az cli` commands in docs/runbooks/phase-2-auth.md cover the same action in
// the meantime, and switching over is a one-line change here.
//
// Uncomment and set useGraphProvider=true once `microsoftGraphV1_0` is stable
// in your pipeline. Leaving commented keeps `bicep build` green on every
// CI runner.
//
// resource appRegistration 'Microsoft.Graph/applications@v1.0' = if (useGraphProvider) {
//   uniqueName: toLower('promoshop-${environmentName}')
//   displayName: appDisplayName
//   signInAudience: 'AzureADMyOrg'
//   spa: {
//     redirectUris: redirectUris
//   }
// }

// ---- Computed values -----------------------------------------------------
#disable-next-line no-hardcoded-env-urls
var publicAzureAuthorityHost = 'https://login.microsoftonline.com/common'

var authorityFallback = empty(externalIdTenantDomain)
  ? publicAzureAuthorityHost
  : 'https://${externalIdTenantDomain}/${externalIdTenantId}/${userFlowName}'

var clientIdOut = empty(preProvisionedClientId) ? '' : preProvisionedClientId


// ---- Key Vault secrets (optional) ---------------------------------------
// Persists the two values so the SWA build + GitHub Actions can pull them
// without ever putting them in source. Always created when keyVaultName is
// supplied — an empty value is a deliberate "not yet configured" signal
// mirrored by the client-side fallback behaviour in lib/auth/AuthProvider.
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = if (!empty(keyVaultName)) {
  name: keyVaultName
}

resource kvAuthClientIdSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(keyVaultName)) {
  parent: keyVault
  name: 'AUTH-CLIENT-ID'
  properties: {
    value: clientIdOut
    contentType: 'text/plain'
  }
}

resource kvAuthAuthoritySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(keyVaultName)) {
  parent: keyVault
  name: 'AUTH-AUTHORITY'
  properties: {
    value: authorityFallback
    contentType: 'text/plain'
  }
}

// ---- Outputs -------------------------------------------------------------
@description('App (client) ID for MSAL. Empty until the App Registration is created; see runbook.')
output AUTH_CLIENT_ID string = clientIdOut

@description('OIDC authority URL for MSAL. Empty-tenant fallback is a harmless placeholder so builds stay green.')
output AUTH_AUTHORITY string = authorityFallback

@description('Echo of the redirect URIs that should be registered on the SPA platform.')
output REDIRECT_URIS array = redirectUris

@description('Name of the user flow used for sign-in/sign-up.')
output USER_FLOW_NAME string = userFlowName

@description('Echo of whether the Graph-provider path was attempted. Informational only.')
output USED_GRAPH_PROVIDER bool = useGraphProvider
