import { NextResponse } from "next/server"
import {
  bulkApply,
  getAllOverrides,
  setOverride,
} from "@/lib/db/repositories/imageRegistry"
import { getSessionFromRequest, hasRole } from "@/lib/auth/server"

// Phase 2 admin guard: every method requires a session whose `roles` array
// includes `admin`. The middleware at the repo root performs the same check;
// keeping an in-handler guard here as defence-in-depth (direct invocation,
// static-export deployments, etc.).
async function requireAdmin(
  request: Request,
): Promise<NextResponse | null> {
  const session = await getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized — sign in with an admin account." },
      { status: 401 },
    )
  }
  if (!hasRole(session, "admin")) {
    return NextResponse.json(
      { error: "Forbidden — admin role required." },
      { status: 403 },
    )
  }
  return null
}

export async function GET(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin(request)
  if (denied) return denied
  try {
    const overrides = await getAllOverrides()
    return NextResponse.json(overrides)
  } catch (err) {
    console.error("[api/admin/image-overrides GET]", err)
    return NextResponse.json(
      { error: "Failed to load image overrides." },
      { status: 500 },
    )
  }
}

interface PutBody {
  slotId?: unknown
  url?: unknown
}

export async function PUT(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin(request)
  if (denied) return denied

  let body: PutBody
  try {
    body = (await request.json()) as PutBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const slotId = typeof body.slotId === "string" ? body.slotId : ""
  const url = typeof body.url === "string" ? body.url : ""

  if (!slotId) {
    return NextResponse.json({ error: "slotId is required." }, { status: 400 })
  }

  try {
    await setOverride(slotId, url)
    return NextResponse.json({ slotId, url, ok: true })
  } catch (err) {
    console.error(`[api/admin/image-overrides PUT ${slotId}]`, err)
    return NextResponse.json(
      { error: "Failed to persist override. Is COSMOS_ENDPOINT configured?" },
      { status: 500 },
    )
  }
}

interface BulkBody {
  upserts?: unknown
  deletes?: unknown
  replace?: unknown
}

/**
 * Bulk upsert/delete. Replaces the N+1 PUTs that Import / Reset-All would
 * otherwise generate from the admin UI with a single request.
 *
 * Body:
 *   {
 *     upserts?: Record<slotId, url>,   // entries with non-empty url are upserted
 *     deletes?: string[],              // slotIds to delete
 *     replace?: boolean                // if true, any current override not in
 *                                      // `upserts` is also deleted
 *   }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const denied = await requireAdmin(request)
  if (denied) return denied

  let body: BulkBody
  try {
    body = (await request.json()) as BulkBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const upserts: Record<string, string> = {}
  if (body.upserts && typeof body.upserts === "object" && !Array.isArray(body.upserts)) {
    for (const [k, v] of Object.entries(body.upserts as Record<string, unknown>)) {
      if (typeof k === "string" && typeof v === "string" && v.length > 0) {
        upserts[k] = v
      }
    }
  }

  const deletes = new Set<string>()
  if (Array.isArray(body.deletes)) {
    for (const d of body.deletes) {
      if (typeof d === "string" && d.length > 0) deletes.add(d)
    }
  }

  if (body.replace === true) {
    try {
      const current = await getAllOverrides()
      const keep = new Set(Object.keys(upserts))
      for (const id of Object.keys(current)) {
        if (!keep.has(id)) deletes.add(id)
      }
    } catch (err) {
      console.error("[api/admin/image-overrides POST getAllOverrides]", err)
      return NextResponse.json(
        { error: "Failed to read current overrides before replace." },
        { status: 500 },
      )
    }
  }

  try {
    const result = await bulkApply({ upserts, deletes: [...deletes] })
    return NextResponse.json({ ok: result.errors.length === 0, ...result })
  } catch (err) {
    console.error("[api/admin/image-overrides POST]", err)
    return NextResponse.json(
      { error: "Failed to persist overrides. Is COSMOS_ENDPOINT configured?" },
      { status: 500 },
    )
  }
}
