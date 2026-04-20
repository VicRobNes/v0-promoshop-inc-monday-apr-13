@description('Name of the Key Vault. Must be globally unique, 3-24 chars, alphanumeric + hyphens.')
param name string

@description('Azure region for the Key Vault.')
param location string

@description('Tags applied to the Key Vault.')
param tags object

@description('Azure AD tenant ID associated with the vault.')
param tenantId string = subscription().tenantId

@description('SKU of the Key Vault. Standard is sufficient for Phase 0.')
@allowed([
  'standard'
  'premium'
])
param skuName string = 'standard'

@description('Retention in days for soft-deleted vaults / secrets.')
@minValue(7)
@maxValue(90)
param softDeleteRetentionInDays int = 90

@description('Enable purge protection. Required for production and cannot be disabled once enabled.')
param enablePurgeProtection bool = true

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: skuName
    }
    tenantId: tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: enablePurgeProtection
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

@description('Resource ID of the Key Vault.')
output id string = keyVault.id

@description('Name of the Key Vault.')
output name string = keyVault.name

@description('DNS endpoint of the Key Vault used by SDKs.')
output vaultUri string = keyVault.properties.vaultUri
