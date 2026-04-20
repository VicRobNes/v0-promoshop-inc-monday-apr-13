@description('Name of the Application Insights component.')
param name string

@description('Azure region for Application Insights.')
param location string

@description('Tags applied to the Application Insights component.')
param tags object

@description('Resource ID of the Log Analytics workspace to back this component.')
param workspaceId string

@description('Application type. Use "web" for Next.js + Functions.')
param applicationType string = 'web'

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  tags: tags
  kind: applicationType
  properties: {
    Application_Type: applicationType
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
    WorkspaceResourceId: workspaceId
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

@description('Resource ID of the Application Insights component.')
output id string = appInsights.id

@description('Name of the Application Insights component.')
output name string = appInsights.name

@description('Instrumentation key for legacy SDKs (prefer connection string).')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('Connection string used by the OpenTelemetry / modern App Insights SDK.')
output connectionString string = appInsights.properties.ConnectionString
