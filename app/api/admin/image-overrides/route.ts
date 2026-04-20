import { NextResponse } from "next/server"
import {
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
