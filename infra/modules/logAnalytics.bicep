@description('Name of the Log Analytics workspace.')
param name string

@description('Azure region for the workspace.')
param location string

@description('Tags applied to the workspace.')
param tags object

@description('Daily ingestion cap in GB. Defaults to 5, which matches the always-free monthly quota for Azure Monitor / Log Analytics. Set higher deliberately only if you accept the per-GB ingestion charge.')
param dailyQuotaGb int = 5

@description('Retention period in days. 90 matches the default production window and costs nothing extra on the PerGB2018 SKU (which includes 31 days free; day 32+ billed the same per-GB regardless of retention until 730 days).')
@minValue(30)
@maxValue(730)
param retentionInDays int = 90

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    workspaceCapping: {
      dailyQuotaGb: dailyQuotaGb
    }
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

@description('Resource ID of the Log Analytics workspace.')
output id string = workspace.id

@description('Name of the Log Analytics workspace.')
output name string = workspace.name

@description('Customer ID (GUID) of the Log Analytics workspace.')
output customerId string = workspace.properties.customerId
