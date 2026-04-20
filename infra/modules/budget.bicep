// Subscription-scope monthly budget with progressive email alerts.
//
// Caller invokes from main.bicep with `scope: subscription()`.
// Alerts fire at 50 / 80 / 100 % of actual spend (actual, not forecast —
// forecast alerts fire off noisy daily pro-rating).

targetScope = 'subscription'

@description('Name of the budget resource. Must be unique within the subscription.')
param name string

@description('Monthly amount in USD.')
@minValue(10)
@maxValue(100000)
param amount int

@description('Email addresses that receive budget alert notifications.')
param contactEmails array

@description('First day of the month the budget becomes active (YYYY-MM-01). Defaults to the first of the current UTC month.')
param startDate string = '${utcNow('yyyy')}-${utcNow('MM')}-01'

@description('End date of the budget period (YYYY-MM-DD). Defaults to five years out.')
param endDate string = '${string(int(utcNow('yyyy')) + 5)}-12-31'

resource budget 'Microsoft.Consumption/budgets@2023-05-01' = {
  name: name
  properties: {
    category: 'Cost'
    amount: amount
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: startDate
      endDate: endDate
    }
    notifications: {
      warning50: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 50
        thresholdType: 'Actual'
        contactEmails: contactEmails
        locale: 'en-us'
      }
      warning80: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        thresholdType: 'Actual'
        contactEmails: contactEmails
        locale: 'en-us'
      }
      critical100: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Actual'
        contactEmails: contactEmails
        locale: 'en-us'
      }
    }
  }
}

@description('Resource ID of the budget.')
output id string = budget.id
