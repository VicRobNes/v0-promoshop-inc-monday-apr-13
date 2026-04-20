@description('Name of the Cosmos DB account. Globally unique, 3-44 chars, lowercase alphanumeric + hyphens.')
@minLength(3)
@maxLength(44)
param name string

@description('Azure region for the Cosmos DB account.')
param location string

@description('Tags applied to the Cosmos DB account.')
param tags object

@description('Name of the SQL database.')
param databaseName string = 'promoshop'

@description('Enable the free-tier discount. Only one free-tier account is allowed per subscription.')
param enableFreeTier bool = true

@description('Container definitions. Each item must include name and partitionKeyPath.')
param containers array = [
  {
    name: 'products'
    partitionKeyPath: '/sku'
  }
  {
    name: 'brands'
    partitionKeyPath: '/slug'
  }
  {
    name: 'quotes'
    partitionKeyPath: '/id'
  }
  {
    name: 'users'
    partitionKeyPath: '/id'
  }
  {
    name: 'imageRegistry'
    partitionKeyPath: '/slotId'
  }
  {
    name: 'healthReports'
    partitionKeyPath: '/id'
  }
]

resource account 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: name
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    databaseAccountOfferType: 'Standard'
    enableFreeTier: enableFreeTier
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    isVirtualNetworkFilterEnabled: false
    publicNetworkAccess: 'Enabled'
    disableKeyBasedMetadataWriteAccess: false
    disableLocalAuth: false
    minimalTlsVersion: 'Tls12'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    // Free-tier (enableFreeTier: true) requires provisioned throughput; it's
    // mutually exclusive with the EnableServerless capability. Free-tier gives
    // us 1000 RU/s + 25 GB always-free, which comfortably covers PromoShop.
    capabilities: []
    backupPolicy: {
      // Production-grade periodic backup: 4-hour interval, 7-day retention
      // (168 h). Free-tier Cosmos only supports Local redundancy — that's a
      // service constraint, not a choice. If the workload ever grows past
      // what the free tier covers, also flip storage redundancy to Geo.
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 168
        backupStorageRedundancy: 'Local'
      }
    }
    networkAclBypass: 'AzureServices'
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: account
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    // Shared database-level throughput. The always-free tier covers the first
    // 1000 RU/s + 25 GB per subscription; by putting throughput at the DB
    // level, all containers share that allocation instead of each allocating
    // the 400 RU/s minimum independently.
    options: {
      throughput: 1000
    }
  }
}

resource containerResources 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = [for container in containers: {
  parent: database
  name: container.name
  properties: {
    resource: {
      id: container.name
      partitionKey: {
        paths: [
          container.partitionKeyPath
        ]
        kind: 'Hash'
        version: 2
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}]

@description('Resource ID of the Cosmos DB account.')
output id string = account.id

@description('Name of the Cosmos DB account.')
output name string = account.name

@description('Document endpoint URI for the Cosmos DB account.')
output documentEndpoint string = account.properties.documentEndpoint

@description('Name of the SQL database.')
output databaseName string = database.name

@description('Names of the containers created.')
output containerNames array = [for (container, i) in containers: container.name]
