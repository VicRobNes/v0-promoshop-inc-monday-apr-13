import "server-only"

import {
  BlobServiceClient,
  ContainerSASPermissions,
  StorageSharedKeyCredential,
  type UserDelegationKey,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob"
import { DefaultAzureCredential } from "@azure/identity"

// Phase 3 — Azure Blob Storage adapter.
//
// The site currently stores "images" as base64 data URLs in the
// imageRegistry Cosmos container (Phase 1). Phase 3 moves binary payloads
// to Blob Storage so the Cosmos document only carries a small URL.
//
// Three modes:
//
//   1. `AZURE_STORAGE_CONNECTION_STRING` set  → use it (account key present,
//      we can mint short-lived SAS tokens without AAD roundtrips).
//   2. Else `AZURE_STORAGE_ACCOUNT` set        → use DefaultAzureCredential
//      (managed identity / developer login). SAS minting falls back to the
//      user-delegation-key path.
//   3. Otherwise                               → not configured; callers
//      fall back to base64 overrides (keeps dev flow working pre-provision).

export const BLOB_CONTAINERS = ["products", "brands", "hero", "team", "quotes-archive"] as const
export type BlobContainer = (typeof BLOB_CONTAINERS)[number]

export const DEFAULT_CONTAINER: BlobContainer = "products"

// Group strings are produced by `lib/image-registry.ts`. Keep this mapping in
// sync with the `group` literal passed to each `slots.push({...})`. If a new
// group is introduced and not listed here, uploads silently route to
// DEFAULT_CONTAINER, which is not what any of our callers want.
const CONTAINER_BY_GROUP: Record<string, BlobContainer> = {
  Branding: "brands",
  "Home page": "hero",
  "About page": "hero",
  "Team members": "team",
  "Brand logos": "brands",
  "Brand lifestyle": "brands",
  // Legacy keys kept so older clients / tests don't regress.
  Products: "products",
  Brands: "brands",
  Hero: "hero",
  Team: "team",
  "Quote Attachments": "quotes-archive",
}

export function containerForSlotGroup(group: string): BlobContainer {
  return CONTAINER_BY_GROUP[group] ?? DEFAULT_CONTAINER
}

function readConn(): string | undefined {
  const c = process.env.AZURE_STORAGE_CONNECTION_STRING
  return c && c.trim().length > 0 ? c : undefined
}

function readAccount(): string | undefined {
  const a = process.env.AZURE_STORAGE_ACCOUNT
  return a && a.trim().length > 0 ? a : undefined
}

export function isBlobConfigured(): boolean {
  return Boolean(readConn() || readAccount())
}

// Lazily instantiate to keep cold-start fast when blob is unused.
let cached: BlobServiceClient | null = null

function getClient(): BlobServiceClient {
  if (cached) return cached
  const conn = readConn()
  if (conn) {
    cached = BlobServiceClient.fromConnectionString(conn)
    return cached
  }
  const account = readAccount()
  if (!account) {
    throw new Error(
      "Blob storage not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT.",
    )
  }
  const url = `https://${account}.blob.core.windows.net`
  cached = new BlobServiceClient(url, new DefaultAzureCredential())
  return cached
}

function parseConnectionString(conn: string): {
  accountName?: string
  accountKey?: string
} {
  const parts = conn.split(";").filter(Boolean)
  let accountName: string | undefined
  let accountKey: string | undefined
  for (const p of parts) {
    const idx = p.indexOf("=")
    if (idx === -1) continue
    const k = p.slice(0, idx).trim()
    const v = p.slice(idx + 1).trim()
    if (k === "AccountName") accountName = v
    else if (k === "AccountKey") accountKey = v
  }
  return { accountName, accountKey }
}

function sanitizeName(name: string): string {
  // Blob names are fairly permissive but we normalise for sanity:
  // lowercase alnum + hyphens + slashes + dots.
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9./-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
}

// User-delegation key cache: the key is good for up to 7 days, and every
// request that needs AAD-signed SAS tokens reuses it until it's within 5
// minutes of expiry. Previously every upload made two separate delegation-key
// round-trips (one for the write SAS, one for the read SAS).
interface CachedUdk {
  key: UserDelegationKey
  expiresAt: number
}
let cachedUdk: CachedUdk | null = null
const UDK_TTL_MS = 6 * 24 * 60 * 60_000 // 6 days, inside Azure's 7-day max.
const UDK_REFRESH_THRESHOLD_MS = 5 * 60_000

async function getUserDelegationKeyCached(client: BlobServiceClient): Promise<UserDelegationKey> {
  const now = Date.now()
  if (cachedUdk && cachedUdk.expiresAt - now > UDK_REFRESH_THRESHOLD_MS) {
    return cachedUdk.key
  }
  const startsOn = new Date(now - 30_000)
  const expiresOn = new Date(now + UDK_TTL_MS)
  const key = await client.getUserDelegationKey(startsOn, expiresOn)
  cachedUdk = { key, expiresAt: expiresOn.getTime() }
  return key
}

export interface WriteSas {
  /** PUT this URL with the bytes to upload (short-lived). */
  uploadUrl: string
  /** GET this URL to read the object afterwards (long-lived SAS or public). */
  readUrl: string
  /** The container + blob path chosen for this upload. */
  container: BlobContainer
  blobPath: string
  /** When the upload SAS expires (ms since epoch). */
  expiresAt: number
}

export interface MintWriteSasArgs {
  container: BlobContainer
  /** E.g. `product-xyz/2026-04-17/filename.jpg`. */
  blobPath: string
  contentType?: string
  /** How many minutes the PUT URL is valid. Default 10. */
  uploadTtlMinutes?: number
}

/**
 * Mint a SAS URL the browser can PUT to, plus a long-lived read URL to store
 * in `imageRegistry`. The two SAS tokens are signed in a single pass so that
 * — in the AAD path — we make only one `getUserDelegationKey` round-trip per
 * upload (and reuse it across uploads via the module-level cache).
 */
export async function mintWriteSas(args: MintWriteSasArgs): Promise<WriteSas> {
  const client = getClient()
  const container = args.container
  const blobPath = sanitizeName(args.blobPath)
  if (!blobPath) throw new Error("blobPath required")

  const containerClient = client.getContainerClient(container)
  const blobClient = containerClient.getBlobClient(blobPath)

  const ttlMin = Math.max(1, Math.min(60, args.uploadTtlMinutes ?? 10))
  const now = new Date()
  const startsOn = new Date(now.getTime() - 30_000)
  const writeExpiresOn = new Date(now.getTime() + ttlMin * 60_000)
  const readExpiresOn = new Date(now.getTime() + 7 * 24 * 60 * 60_000)

  const writePerms = ContainerSASPermissions.parse("cw")
  const readPerms = ContainerSASPermissions.parse("r")

  const conn = readConn()
  let writeSas: string
  let readSas: string
  let accountName: string

  if (conn) {
    const parsed = parseConnectionString(conn)
    if (!parsed.accountName || !parsed.accountKey) {
      throw new Error(
        "Connection string missing AccountName/AccountKey; cannot mint SAS without a user-delegation key.",
      )
    }
    accountName = parsed.accountName
    const cred = new StorageSharedKeyCredential(parsed.accountName, parsed.accountKey)
    writeSas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: writePerms,
        startsOn,
        expiresOn: writeExpiresOn,
        contentType: args.contentType,
      },
      cred,
    ).toString()
    readSas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: readPerms,
        startsOn,
        expiresOn: readExpiresOn,
      },
      cred,
    ).toString()
  } else {
    accountName = readAccount()!
    const udk = await getUserDelegationKeyCached(client)
    writeSas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: writePerms,
        startsOn,
        expiresOn: writeExpiresOn,
        contentType: args.contentType,
      },
      udk,
      accountName,
    ).toString()
    readSas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: readPerms,
        startsOn,
        expiresOn: readExpiresOn,
      },
      udk,
      accountName,
    ).toString()
  }

  const readUrl = `https://${accountName}.blob.core.windows.net/${container}/${blobPath}?${readSas}`

  return {
    uploadUrl: `${blobClient.url}?${writeSas}`,
    readUrl,
    container,
    blobPath,
    expiresAt: writeExpiresOn.getTime(),
  }
}
