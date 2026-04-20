import "server-only"

import {
  BlobServiceClient,
  ContainerSASPermissions,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob"
import { DefaultAzureCredential } from "@azure/identity"

// Phase 3 — Azure Blob Storage adapter.
//
// The site currently stores "images" as base64 data URLs in the
// imageRegistry Cosmos container (Phase 1). Phase 3 moves binary payloads
// to Blob Storage so the Cosmos document only carries a small URL.
//
// Two modes:
//
//   1. `AZURE_STORAGE_CONNECTION_STRING` set  → use it (account key present,
//      we can mint short-lived SAS tokens without AAD roundtrips).
//   2. Else `AZURE_STORAGE_ACCOUNT` set        → use DefaultAzureCredential
//      (managed identity / developer login). SAS minting falls back to the
//      user-delegation key path.
//   3. Otherwise                               → not configured; callers
//      fall back to base64 overrides (keeps dev flow working pre-provision).

export const BLOB_CONTAINERS = ["products", "brands", "hero", "team", "quotes-archive"] as const
export type BlobContainer = (typeof BLOB_CONTAINERS)[number]

export const DEFAULT_CONTAINER: BlobContainer = "products"

const CONTAINER_BY_GROUP: Record<string, BlobContainer> = {
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
 * Mint a SAS URL the browser can PUT to, plus a read URL to store in
 * `imageRegistry`. When the connection string is an account-key string we
 * sign with the shared key. Otherwise we use the user-delegation key path.
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
  const expiresOn = new Date(now.getTime() + ttlMin * 60_000)

  const conn = readConn()
  let sas: string

  if (conn) {
    const { accountName, accountKey } = parseConnectionString(conn)
    if (!accountName || !accountKey) {
      throw new Error(
        "Connection string missing AccountName/AccountKey; cannot mint SAS without a user-delegation key.",
      )
    }
    const cred = new StorageSharedKeyCredential(accountName, accountKey)
    sas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: ContainerSASPermissions.parse("cw"),
        startsOn: new Date(now.getTime() - 30_000),
        expiresOn,
        contentType: args.contentType,
        protocol: "https" as unknown as undefined,
      },
      cred,
    ).toString()
  } else {
    // User-delegation key path.
    const udk = await client.getUserDelegationKey(
      new Date(now.getTime() - 30_000),
      new Date(now.getTime() + 15 * 60_000),
    )
    const accountName = readAccount()!
    sas = generateBlobSASQueryParameters(
      {
        containerName: container,
        blobName: blobPath,
        permissions: ContainerSASPermissions.parse("cw"),
        startsOn: new Date(now.getTime() - 30_000),
        expiresOn,
        contentType: args.contentType,
      },
      udk,
      accountName,
    ).toString()
  }

  return {
    uploadUrl: `${blobClient.url}?${sas}`,
    // Containers are private (Phase 0 set publicAccess: 'None'), so the read
    // URL also needs a SAS. We mint a longer-lived read-only one. In a later
    // phase this can be swapped for an AFD/CDN origin with anonymous reads.
    readUrl: await buildReadUrl({
      accountName: conn ? parseConnectionString(conn).accountName! : readAccount()!,
      accountKey: conn ? parseConnectionString(conn).accountKey : undefined,
      container,
      blobPath,
      contentType: args.contentType,
    }),
    container,
    blobPath,
    expiresAt: expiresOn.getTime(),
  }
}

async function buildReadUrl(opts: {
  accountName: string
  accountKey?: string
  container: BlobContainer
  blobPath: string
  contentType?: string
}): Promise<string> {
  const now = new Date()
  // 7-day read SAS. Refreshed whenever the admin re-uploads.
  const expiresOn = new Date(now.getTime() + 7 * 24 * 60 * 60_000)
  const perms = ContainerSASPermissions.parse("r")

  let sas: string
  if (opts.accountKey) {
    const cred = new StorageSharedKeyCredential(opts.accountName, opts.accountKey)
    sas = generateBlobSASQueryParameters(
      {
        containerName: opts.container,
        blobName: opts.blobPath,
        permissions: perms,
        startsOn: new Date(now.getTime() - 30_000),
        expiresOn,
        contentType: opts.contentType,
      },
      cred,
    ).toString()
  } else {
    const client = getClient()
    const udk = await client.getUserDelegationKey(
      new Date(now.getTime() - 30_000),
      expiresOn,
    )
    sas = generateBlobSASQueryParameters(
      {
        containerName: opts.container,
        blobName: opts.blobPath,
        permissions: perms,
        startsOn: new Date(now.getTime() - 30_000),
        expiresOn,
      },
      udk,
      opts.accountName,
    ).toString()
  }
  return `https://${opts.accountName}.blob.core.windows.net/${opts.container}/${opts.blobPath}?${sas}`
}
