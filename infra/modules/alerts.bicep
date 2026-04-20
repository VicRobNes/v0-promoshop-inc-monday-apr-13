// Application-level alerting: action group + availability test + metric alerts.
//
// All alerts notify the same action group (a single email list) so on-call
// stays simple. Add SMS / Logic App / webhook receivers here if the client's
// response plan ever warrants them.

@description('Short environment name — feeds action-group short name + alert names.')
param environmentName string

@description('Azure region for the alert resources. Alerts + action groups are regional control-plane; Central US is safe for global visibility.')
param location string = 'global'

@description('Tags applied to the alert resources.')
param tags object

@description('Resource ID of the App Service to watch for CPU and request failures.')
param appServiceId string

@description('Public URL the availability ping probes.')
param siteUrl string

@description('Resource ID of the Application Insights component the availability test lives under.')
param appInsightsId string

@description('Application Insights region — availability test must be co-located with the component.')
param appInsightsLocation string

@description('Email addresses that receive alerts.')
param contactEmails array

@description('Severity floor for noisy alerts (CPU / latency). Production defaults to 2 (Warning); use 3 for dev.')
@minValue(0)
@maxValue(4)
param latencyAlertSeverity int = 2

// --- Action Group -----------------------------------------------------------
resource actionGroup 'Microsoft.Insights/actionGroups@2023-09-01-preview' = {
  name: 'ag-promoshop-${environmentName}'
  location: location
  tags: tags
  properties: {
    groupShortName: take('ps-${environmentName}', 12)
    enabled: true
    emailReceivers: [for (email, i) in contactEmails: {
      name: 'email-${i}'
      emailAddress: email
      useCommonAlertSchema: true
    }]
  }
}

// --- Availability test -----------------------------------------------------
// Classic URL ping from five geographically distributed test locations.
// If any 3 of 5 fail in a given window, the associated metric alert fires.
var availabilityTestName = 'at-promoshop-${environmentName}'

resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: availabilityTestName
  location: appInsightsLocation
  tags: union(tags, {
    // App Insights requires this tag on availability tests to bind them to
    // the component.
    'hidden-link:${appInsightsId}': 'Resource'
  })
  kind: 'standard'
  properties: {
    SyntheticMonitorId: availabilityTestName
    Name: 'PromoShop ${environmentName} home page'
    Description: 'Probes the site home URL from five regions every 5 minutes.'
    Enabled: true
    Frequency: 300
    Timeout: 30
    Kind: 'standard'
    RetryEnabled: true
    Locations: [
      { Id: 'us-ca-sjc-azr' }
      { Id: 'us-tx-sn1-azr' }
      { Id: 'us-il-ch1-azr' }
      { Id: 'us-va-ash-azr' }
      { Id: 'us-fl-mia-edge' }
    ]
    Request: {
      RequestUrl: siteUrl
      HttpVerb: 'GET'
      ParseDependentRequests: false
    }
    ValidationRules: {
      ExpectedHttpStatusCode: 200
      IgnoreHttpStatusCode: false
      SSLCheck: true
      SSLCertRemainingLifetimeCheck: 7
    }
  }
}

resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-availability-promoshop-${environmentName}'
  location: location
  tags: tags
  properties: {
    description: 'Fires when the PromoShop home page fails availability probes from 3+ regions in a 5-minute window.'
    severity: 1
    enabled: true
    scopes: [
      availabilityTest.id
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Insights/components'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: availabilityTest.id
      componentId: appInsightsId
      failedLocationCount: 3
    }
    actions: [
      {
        actionGroupId: actionGroup.id
        webHookProperties: {}
      }
    ]
  }
}

// --- 5xx error-rate alert (App Service Http5xx counter) --------------------
resource http5xxAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-http5xx-promoshop-${environmentName}'
  location: location
  tags: tags
  properties: {
    description: 'Fires when the App Service emits more than 10 HTTP 5xx responses in a 5-minute window.'
    severity: 2
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    targetResourceType: 'Microsoft.Web/sites'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Http5xx'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
        webHookProperties: {}
      }
    ]
  }
}

// --- CPU-saturation alert --------------------------------------------------
resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'alert-cpu-promoshop-${environmentName}'
  location: location
  tags: tags
  properties: {
    description: 'Fires when the App Service Plan CPU stays over 80% for 15 minutes.'
    severity: latencyAlertSeverity
    enabled: true
    scopes: [
      appServiceId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    targetResourceType: 'Microsoft.Web/sites'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CpuPercentage'
          metricNamespace: 'Microsoft.Web/sites'
          metricName: 'CpuTime'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
        webHookProperties: {}
      }
    ]
  }
}

// --- Outputs ---------------------------------------------------------------
@description('Resource ID of the action group. Wire other resources to this to piggy-back on the same notification list.')
output actionGroupId string = actionGroup.id

@description('Resource ID of the availability web test.')
output availabilityTestId string = availabilityTest.id
