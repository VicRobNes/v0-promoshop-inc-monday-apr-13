@description('Name of the Storage Account. Globally unique, 3-24 chars, lowercase alphanumeric only.')
@minLength(3)
@maxLength(24)
param name string

@description('Azure region for the Storage Account.')
param location string

@description('Tags applied to the Storage Account.')
param tags object

@description('SKU / replication for the Storage Account.')
@allowed([
  'Standard_LRS'
  'Standard_ZRS'
  'Standard_GRS'
  'Standard_RAGRS'
])
param skuName string = 'Standard_LRS'

@description('Blob container names to create under the account.')
param blobContainerNames array = [
  'products'
  'brands'
  'hero'
  'team'
  'quotes-archive'
]

@description('File share names to create under the account.')
param fileShareNames array = [
  'brand-style-guides'
]

@description('Quota for each file share in GB.')
@minValue(1)
@maxValue(5120)
param fileShareQuotaGb int = 5

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    // Shared-key access disabled in production. The site's blob.ts adapter
    // falls through to DefaultAzureCredential + user-delegation-key SAS
    // minting when `AZURE_STORAGE_CONNECTION_STRING` is absent, which is
    // the production configuration. The only consumer that needs shared
    // keys is the one-shot `scripts/migrate-images.ts` dev utility, which
    // is expected to be pointed at a local account or a temporarily re-
    // enabled staging account.
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    allowCrossTenantReplication: false
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
    encryption: {
      keySource: 'Microsoft.Storage'
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
      requireInfrastructureEncryption: false
    }
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    isVersioningEnabled: false
  }
}

resource blobContainers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = [for containerName in blobContainerNames: {
  parent: blobServices
  name: containerName
  properties: {
    publicAccess: 'None'
    metadata: {
      managedBy: 'azd'
      phase: '0-foundation'
    }
  }
}]

resource fileServices 'Microsoft.Storage/storageAccounts/fileServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    shareDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource fileShares 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-05-01' = [for shareName in fileShareNames: {
  parent: fileServices
  name: shareName
  properties: {
    accessTier: 'TransactionOptimized'
    shareQuota: fileShareQuotaGb
    enabledProtocols: 'SMB'
  }
}]

@description('Resource ID of the Storage Account.')
output id string = storage.id

@description('Name of the Storage Account.')
output name string = storage.name

@description('Primary blob service endpoint.')
output primaryBlobEndpoint string = storage.properties.primaryEndpoints.blob

@description('Primary file service endpoint.')
output primaryFileEndpoint string = storage.properties.primaryEndpoints.file

@description('Blob container names created.')
output blobContainers array = blobContainerNames

@description('File share names created.')
output fileShares array = fileShareNames
