@description('Object ID of the principal receiving the role.')
param principalId string

@description('Type of the principal (User, Group, ServicePrincipal).')
@allowed([
  'User'
  'Group'
  'ServicePrincipal'
])
param principalType string = 'ServicePrincipal'

@description('GUID of the built-in or custom role definition to assign.')
param roleDefinitionId string

@description('Name of the resource group this role assignment is scoped to. Used purely for GUID stability.')
param resourceGroupName string

resource assignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroupName, principalId, roleDefinitionId)
  properties: {
    principalId: principalId
    principalType: principalType
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
  }
}

@description('Resource ID of the role assignment.')
output id string = assignment.id
