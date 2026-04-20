@description('Name of the user-assigned managed identity.')
param name string

@description('Azure region for the managed identity.')
param location string

@description('Tags applied to the managed identity.')
param tags object

@description('Resource ID of the Key Vault to grant Secrets Officer role on. Leave empty to skip.')
param keyVaultId string = ''

@description('Resource ID of the Storage Account to grant Blob Data Contributor role on. Leave empty to skip.')
param storageAccountId string = ''

@description('Name of the Cosmos DB account. Used to build the Data Contributor SQL role assignment. Leave empty to skip.')
param cosmosAccountName string = ''

// Well-known built-in Azure RBAC role definition IDs (GUID only).
// The app reads secrets at runtime; secret *writes* happen at deploy time
// under the deploying principal's credentials, so "Secrets User" (read only)
// is the least-privilege runtime role.
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
// Cosmos DB "SQL Built-in Data Contributor" (data plane role, assigned via sqlRoleAssignments)
var cosmosSqlDataContributorRoleId = '00000000-0000-0000-0000-000000000002'

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

// Scoped resource references so we can use scope: <resource> on role assignments.
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = if (!empty(keyVaultId)) {
  name: last(split(keyVaultId, '/'))
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = if (!empty(storageAccountId)) {
  name: last(split(storageAccountId, '/'))
}

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' existing = if (!empty(cosmosAccountName)) {
  name: cosmosAccountName
}

resource keyVaultSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(keyVaultId)) {
  name: guid(keyVaultId, identity.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
  }
}

resource storageBlobDataContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(storageAccountId)) {
  name: guid(storageAccountId, identity.id, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
  }
}

// Cosmos DB uses a data-plane (SQL) role assignment, not Azure RBAC.
resource cosmosDataContributor 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15' = if (!empty(cosmosAccountName)) {
  parent: cosmosAccount
  name: guid(cosmosAccountName, identity.id, cosmosSqlDataContributorRoleId)
  properties: {
    principalId: identity.properties.principalId
    roleDefinitionId: resourceId('Microsoft.DocumentDB/databaseAccounts/sqlRoleDefinitions', cosmosAccountName, cosmosSqlDataContributorRoleId)
    scope: cosmosAccount.id
  }
}

@description('Resource ID of the user-assigned managed identity.')
output id string = identity.id

@description('Name of the user-assigned managed identity.')
output name string = identity.name

@description('Principal (object) ID of the managed identity — used for additional role assignments.')
output principalId string = identity.properties.principalId

@description('Client ID of the managed identity — used by Azure SDKs with DefaultAzureCredential.')
output clientId string = identity.properties.clientId
