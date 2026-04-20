import { NextResponse } from "next/server"
import {
  BLOB_CONTAINERS,
  containerForSlotGroup,
  isBlobConfigured,
  mintWriteSas,
  type BlobContainer,
} from "@/lib/storage/blob"
import { IMAGE_REGISTRY } from "@/lib/image-registry"

// Phase 3 — SAS-token issuance for Admin Image Panel uploads.
//
// Auth is enforced upstream by `middleware.ts` (admin-only on
// `/api/admin/**`). Defence-in-depth check still happens because the shared
// `getSessionFromRequest` guard throws on malformed tokens, but the route
// only runs once middleware has let the request through.
//
// Request body:
//   { slotId: string, fileName: string, contentType?: string }
//
// Response (200):
//   { uploadUrl, readUrl, container, blobPath, expiresAt }
//
// Response (503) when blob storage isn't provisioned yet — clients then fall
// back to base64 overrides so the admin flow still works pre-provision.

interface Body {
  slotId?: unknown
  fileName?: unknown
  contentType?: unknown
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
])

export async function POST(request: Request): Promise<NextResponse> {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Blob storage not configured. Set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT after Phase 0 provisioning.",
        configured: false,
      },
      { status: 503 },
    )
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const slotId = typeof body.slotId === "string" ? body.slotId.trim() : ""
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : ""
  const contentType =
    typeof body.contentType === "string" ? body.contentType.trim() : undefined

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required." }, { status: 400 })
  }
  if (!fileName) {
    return NextResponse.json({ error: "fileName is required." }, { status: 400 })
  }

  const slot = IMAGE_REGISTRY.find((s) => s.id === slotId)
  if (!slot) {
    return NextResponse.json({ error: `Unknown slotId: ${slotId}` }, { status: 400 })
  }

  if (contentType && !ALLOWED_MIME.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported content-type: ${contentType}` },
      { status: 415 },
    )
  }

  const container: BlobContainer = containerForSlotGroup(slot.group)
  // Prefix with slot group + slot id so the eventual CDN cache-buster URL
  // reads legibly: brands/nike/logo-1776412352.svg etc.
  const stamp = Date.now().toString(36)
  const ext = fileName.includes(".") ? fileName.split(".").pop()! : "bin"
  const blobPath = `${slot.id}/${stamp}.${ext}`

  try {
    const sas = await mintWriteSas({
      container,
      blobPath,
      contentType,
      uploadTtlMinutes: 10,
    })
    return NextResponse.json({ ...sas, allowedContainers: BLOB_CONTAINERS })
  } catch (err) {
    console.error("[api/admin/upload] mintWriteSas failed", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to mint upload URL.",
      },
      { status: 500 },
    )
  }
}
