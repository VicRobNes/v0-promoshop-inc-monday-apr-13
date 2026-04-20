// Custom-domain binding for the App Service, backed by an App Service
// Managed Certificate (free, auto-renewed every 45 days).
//
// Bicep creates the hostname binding AND the managed certificate as two
// independent resources (no cross-references, no cycle). The SNI binding
// step — associating the cert thumbprint back onto the hostname binding —
// is a one-liner `az webapp config ssl bind` that runs from the deploy
// workflow after Bicep succeeds. See docs/runbooks/production-go-live.md.
//
// Prerequisites:
//   1. Customer owns `domain` (e.g. www.promoshop.com).
//   2. A CNAME record `<domain>` → `<site>.azurewebsites.net`.
//      For an apex (no www) they need an ALIAS / ANAME record plus
//      a TXT record `asuid.<apex>` = customDomainVerificationId of the
//      site (portal: App Service → Custom domains → Add custom domain
//      shows the value). The runbook walks through both.

@description('Existing App Service site resource name.')
param siteName string

@description('Fully-qualified domain name to bind (e.g. www.promoshop.com).')
param domain string

@description('Azure region — certificate resource must be in the same region as the site.')
param location string

@description('Tags applied to the certificate resource.')
param tags object

resource site 'Microsoft.Web/sites@2024-04-01' existing = {
  name: siteName
}

// Hostname binding — sslState intentionally Disabled until the workflow
// step runs `az webapp config ssl bind` with the cert thumbprint below.
resource hostnameBinding 'Microsoft.Web/sites/hostNameBindings@2024-04-01' = {
  parent: site
  name: domain
  properties: {
    siteName: siteName
    hostNameType: 'Verified'
    sslState: 'Disabled'
  }
}

// App Service Managed Certificate for the same hostname. Azure validates
// ownership by checking that the hostname is bound to this site — hence
// the explicit dependsOn.
resource managedCertificate 'Microsoft.Web/certificates@2024-04-01' = {
  name: 'cert-${replace(domain, '.', '-')}'
  location: location
  tags: tags
  properties: {
    canonicalName: domain
    serverFarmId: site.properties.serverFarmId
  }
  dependsOn: [
    hostnameBinding
  ]
}

@description('FQDN of the bound domain.')
output domain string = domain

@description('Thumbprint of the managed cert. Use with `az webapp config ssl bind --certificate-thumbprint <thumb> --ssl-type SNI --hostname <domain>` from the deploy workflow.')
output certificateThumbprint string = managedCertificate.properties.thumbprint
