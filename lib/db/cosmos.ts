import type { Container, CosmosClient as CosmosClientType } from "@azure/cosmos"

/**
 * Names of every container provisioned in `infra/modules/cosmos.bicep`.
 * Keep this list in lockstep with the Bicep module.
 */
export const CONTAINER_NAMES = [
  "products",
  "brands",
  "quotes",
  "users",
  "imageRegistry",
  "healthReports",
] as const

export type ContainerName = (typeof CONTAINER_NAMES)[number]

export interface CosmosEnv {
  endpoint: string
  key?: string
  databaseName: string
  useManagedIdentity: boolean
}

/**
 * Reads Cosmos config from the environment. Returns `null` (instead of
 * throwing) when required vars are missing so callers can gracefully fall
 * back to the seed-array path during local dev / preview builds where no
 * Azure resources have been provisioned yet.
 */
export function readCosmosEnv(): CosmosEnv | null {
  const endpoint = process.env.COSMOS_ENDPOINT
  if (!endpoint) return null
  const useManagedIdentity = process.env.COSMOS_USE_MI === "true"
  const key = process.env.COSMOS_KEY
  // If we're not using MI, we need a key.
  if (!useManagedIdentity && !key) return null
  return {
    endpoint,
    key: useManagedIdentity ? undefined : key,
    databaseName: process.env.COSMOS_DATABASE ?? "promoshop",
    useManagedIdentity,
  }
}

export function hasCosmosConfig(): boolean {
  return readCosmosEnv() !== null
}

// --- Client singleton -------------------------------------------------------
// We hold a single client instance per process so serverless warm invocations
// re-use the HTTP pool. The dynamic imports keep `@azure/*` out of the client
// bundle — these modules are only resolved on the Node.js server.

let clientPromise: Promise<CosmosClientType | null> | null = null

async function createClient(): Promise<CosmosClientType | null> {
  const env = readCosmosEnv()
  if (!env) return null

  const { CosmosClient } = await import("@azure/cosmos")

  if (env.useManagedIdentity) {
    const { DefaultAzureCredential } = await import("@azure/identity")
    const aadCredentials = new DefaultAzureCredential()
    return new CosmosClient({
      endpoint: env.endpoint,
      aadCredentials,
    })
  }

  return new CosmosClient({
    endpoint: env.endpoint,
    key: env.key!,
  })
}

export function getCosmosClient(): Promise<CosmosClientType | null> {
  if (!clientPromise) {
    clientPromise = createClient()
  }
  return clientPromise
}

/**
 * Returns a typed Cosmos Container. Throws when Cosmos is not configured —
 * callers wanting graceful fallback should check `hasCosmosConfig()` first
 * (the repositories do this via `lib/db/fallback.ts`).
 */
export async function getContainer(name: ContainerName): Promise<Container> {
  const env = readCosmosEnv()
  if (!env) {
    throw new Error(
      "Cosmos DB is not configured. Set COSMOS_ENDPOINT + COSMOS_KEY (or COSMOS_USE_MI=true) in the environment.",
    )
  }
  const client = await getCosmosClient()
  if (!client) {
    throw new Error("Failed to create Cosmos client.")
  }
  return client.database(env.databaseName).container(name)
}

/**
 * Typed accessor object — `containers.products` returns a Promise<Container>
 * pointed at the products container, and so on.
 */
export const containers = {
  products: () => getContainer("products"),
  brands: () => getContainer("brands"),
  quotes: () => getContainer("quotes"),
  users: () => getContainer("users"),
  imageRegistry: () => getContainer("imageRegistry"),
  healthReports: () => getContainer("healthReports"),
} as const
