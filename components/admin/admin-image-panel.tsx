"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Upload,
  RotateCcw,
  Download,
  FolderUp,
  Search,
  Check,
  AlertTriangle,
  Link2,
  Trash2,
} from "lucide-react"
import {
  IMAGE_REGISTRY,
  type ImageSlot,
} from "@/lib/image-registry"
import {
  IMAGE_OVERRIDES_EVENT,
  getAllOverrides,
  replaceAllOverrides,
  resetAllOverrides,
  setOverride,
  clearOverride,
  type ImageOverrides,
} from "@/lib/image-overrides"
import { useAuth } from "@/lib/auth/AuthProvider"
import { useAdminGuard } from "@/lib/auth/useAdminGuard"

// When Azure Blob storage is configured (Phase 3) we allow larger files
// because they don't have to round-trip through localStorage. We still cap
// them so admins don't accidentally upload 50 MB hero images.
const MAX_UPLOAD_BYTES_BLOB = 10 * 1024 * 1024 // 10 MB
const MAX_UPLOAD_BYTES_FALLBACK = 2.5 * 1024 * 1024 // 2.5 MB — localStorage typically caps ~5MB total.

const UPLOAD_ENDPOINT = "/api/admin/upload"

interface UploadSasResponse {
  uploadUrl: string
  readUrl: string
  container: string
  blobPath: string
  expiresAt: number
}

async function uploadViaBlob(slotId: string, file: File): Promise<string> {
  const sasRes = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slotId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
  })
  if (sasRes.status === 503) {
    throw new BlobNotConfiguredError()
  }
  if (!sasRes.ok) {
    const msg = await sasRes.text().catch(() => "")
    throw new Error(`Upload endpoint returned ${sasRes.status}: ${msg.slice(0, 200)}`)
  }
  const sas = (await sasRes.json()) as UploadSasResponse

  const putRes = await fetch(sas.uploadUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "content-type": file.type || "application/octet-stream",
    },
    body: file,
  })
  if (!putRes.ok) {
    throw new Error(`Blob PUT failed: ${putRes.status} ${putRes.statusText}`)
  }
  return sas.readUrl
}

class BlobNotConfiguredError extends Error {
  constructor() {
    super("Blob storage not yet configured; falling back to local overrides.")
    this.name = "BlobNotConfiguredError"
  }
}

function groupSlots(slots: ImageSlot[]): Record<string, ImageSlot[]> {
  return slots.reduce(
    (acc, slot) => {
      if (!acc[slot.group]) acc[slot.group] = []
      acc[slot.group].push(slot)
      return acc
    },
    {} as Record<string, ImageSlot[]>,
  )
}

export function AdminImagePanel() {
  const { roles, mode } = useAuth()
  const isAdmin = roles.includes("admin")
  // In MSAL mode enforce the guard (redirects to /sign-in if not admin).
  // In fallback mode the middleware can't check a JWT, so we leave the panel
  // open for dev — matches the pre-Phase-2 behaviour and keeps design work
  // frictionless.
  useAdminGuard({ role: "admin", redirectTo: "/sign-in" })
  const guardActive = mode === "msal" && !isAdmin

  const [overrides, setOverrides] = useState<ImageOverrides>({})
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const sync = () => setOverrides(getAllOverrides())
    sync()
    window.addEventListener(IMAGE_OVERRIDES_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(IMAGE_OVERRIDES_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const slots = term
      ? IMAGE_REGISTRY.filter(
          (s) =>
            s.label.toLowerCase().includes(term) ||
            s.group.toLowerCase().includes(term) ||
            s.id.toLowerCase().includes(term),
        )
      : IMAGE_REGISTRY
    return groupSlots(slots)
  }, [search])

  const overriddenCount = Object.keys(overrides).length

  const handleExport = () => {
    const data = JSON.stringify(overrides, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promoshop-image-overrides-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          replaceAllOverrides(parsed)
          alert("Image overrides imported successfully.")
        } else {
          alert("That file doesn't look like a valid image-overrides JSON.")
        }
      } catch {
        alert("Couldn't parse that file as JSON.")
      }
    }
    reader.readAsText(file)
  }

  const handleResetAll = () => {
    if (
      confirm(
        "Reset every image back to its original? This only affects your browser — the next time you load the site you'll see the defaults.",
      )
    ) {
      resetAllOverrides()
    }
  }

  if (guardActive) {
    // Guard hook is already redirecting — render nothing so the admin UI
    // doesn't flash for non-admin signed-in users.
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10">
      <header className="mb-8">
        <p className="text-xs font-bold tracking-wider text-[#ef473f] uppercase mb-2">
          Admin
        </p>
        <h1 className="font-montserrat font-black text-3xl lg:text-4xl leading-tight mb-3">
          Image Manager
        </h1>
        <p className="text-[#555] font-visby leading-relaxed max-w-3xl">
          Every image on the site is listed below. Paste a new URL or upload a
          file to replace it. Changes save automatically and apply to the whole
          site for <strong>this browser</strong>.
        </p>

        <div className="mt-4 rounded-lg border border-[#f5c06b] bg-[#fff8e8] p-4 text-sm text-[#7a5200] flex gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">How these changes are saved</p>
            <p className="leading-relaxed">
              Overrides live in your browser (localStorage). Use{" "}
              <strong>Export</strong> to download your config as JSON, then
              send it to your developer to bake the changes in permanently,
              or <strong>Import</strong> it on another machine to sync.
            </p>
          </div>
        </div>
      </header>

      <div className="sticky top-[96px] z-10 bg-[#f6f6f6]/95 backdrop-blur border-b border-[#e5e5e5] -mx-6 px-6 lg:-mx-8 lg:px-8 py-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <input
              type="search"
              placeholder="Search images by name, section, or id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#d9d9d9] rounded-full pl-10 pr-4 py-2.5 text-sm font-visby outline-none focus:border-[#ef473f] transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-white border border-[#d9d9d9] text-[#333] px-4 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase hover:border-[#ef473f] hover:text-[#ef473f] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <ImportButton onFile={handleImportFile} />
          <button
            type="button"
            onClick={handleResetAll}
            disabled={overriddenCount === 0}
            className="inline-flex items-center gap-2 bg-white border border-[#d9d9d9] text-[#333] px-4 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase hover:border-[#ef473f] hover:text-[#ef473f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Reset all
          </button>
          <span className="text-xs font-visby text-[#666] ml-auto">
            {mounted
              ? `${overriddenCount} of ${IMAGE_REGISTRY.length} images customised`
              : `${IMAGE_REGISTRY.length} images`}
          </span>
        </div>
      </div>

      <div className="space-y-10">
        {Object.entries(filteredGroups).map(([group, slots]) => (
          <section key={group}>
            <h2 className="font-montserrat font-bold text-sm uppercase tracking-wider text-[#999] mb-4">
              {group}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <ImageRow
                  key={slot.id}
                  slot={slot}
                  override={overrides[slot.id]}
                />
              ))}
            </div>
          </section>
        ))}
        {Object.keys(filteredGroups).length === 0 && (
          <p className="text-center text-[#666] py-12 font-visby">
            No images match “{search}”.
          </p>
        )}
      </div>
    </div>
  )
}

function ImportButton({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 bg-white border border-[#d9d9d9] text-[#333] px-4 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase hover:border-[#ef473f] hover:text-[#ef473f] transition-colors"
      >
        <FolderUp className="w-4 h-4" />
        Import
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />
    </>
  )
}

interface ImageRowProps {
  slot: ImageSlot
  override: string | undefined
}

function ImageRow({ slot, override }: ImageRowProps) {
  const [draftUrl, setDraftUrl] = useState<string>(override ?? "")
  const [error, setError] = useState<string | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Keep the draft URL input in sync when the override changes from elsewhere
  // (import, reset-all, or another browser tab).
  useEffect(() => {
    setDraftUrl(override ?? "")
  }, [override])

  const currentSrc = override || slot.defaultSrc
  const isOverridden = Boolean(override)

  const applyUrl = () => {
    const trimmed = draftUrl.trim()
    setError(null)
    if (!trimmed) {
      clearOverride(slot.id)
      return
    }
    try {
      setOverride(slot.id, trimmed)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't save the override.",
      )
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setUploadBusy(true)

    // Try blob upload first; on 503 (not configured) fall back to base64.
    try {
      if (file.size > MAX_UPLOAD_BYTES_BLOB) {
        throw new Error(
          `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload an image under 10 MB.`,
        )
      }
      const readUrl = await uploadViaBlob(slot.id, file)
      setOverride(slot.id, readUrl)
      setDraftUrl(readUrl)
      setUploadBusy(false)
      return
    } catch (err) {
      if (!(err instanceof BlobNotConfiguredError)) {
        setUploadBusy(false)
        setError(
          err instanceof Error ? err.message : "Couldn't upload to blob storage.",
        )
        return
      }
      // fall through to base64 path
    }

    // Fallback: base64 data URL in override (original behaviour pre-Phase 3).
    if (file.size > MAX_UPLOAD_BYTES_FALLBACK) {
      setUploadBusy(false)
      setError(
        `Blob storage isn't configured yet and this file is ${(file.size / 1024 / 1024).toFixed(1)} MB — please use an image under 2.5 MB or paste a URL until Phase 0 provisioning completes.`,
      )
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      setUploadBusy(false)
      setError("Couldn't read that file.")
    }
    reader.onload = () => {
      setUploadBusy(false)
      const dataUrl = String(reader.result)
      try {
        setOverride(slot.id, dataUrl)
        setDraftUrl(dataUrl)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Couldn't save that image (browser storage may be full).",
        )
      }
    }
    reader.readAsDataURL(file)
  }

  const handleReset = () => {
    clearOverride(slot.id)
    setDraftUrl("")
    setError(null)
  }

  return (
    <div
      className={`bg-white border rounded-lg p-4 flex gap-4 transition-colors ${
        isOverridden ? "border-[#6abf4b]/50" : "border-[#e5e5e5]"
      }`}
    >
      <div className="flex-shrink-0">
        <div className="w-24 h-24 rounded-md bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center overflow-hidden">
          {currentSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSrc}
              alt={slot.label}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase text-[#999] text-center px-2">
              No image
            </span>
          )}
        </div>
        {isOverridden && (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#6abf4b]">
            <Check className="w-3 h-3" />
            Custom
          </p>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-montserrat font-bold text-sm text-[#1a1a1a] leading-snug">
          {slot.label}
        </p>
        {slot.hint && (
          <p className="text-xs text-[#777] font-visby mt-0.5">{slot.hint}</p>
        )}
        <p className="text-[10px] font-mono text-[#999] mt-0.5 truncate">
          {slot.id}
        </p>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" />
            <input
              type="url"
              inputMode="url"
              placeholder="Paste an image URL…"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              onBlur={applyUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  applyUrl()
                }
              }}
              className="w-full bg-white border border-[#d9d9d9] rounded-md pl-8 pr-3 py-2 text-xs font-mono outline-none focus:border-[#ef473f] transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadBusy}
            className="inline-flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadBusy ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
          <button
            type="button"
            onClick={handleReset}
            disabled={!isOverridden}
            title="Reset to default"
            className="inline-flex items-center justify-center gap-1.5 bg-white border border-[#d9d9d9] text-[#555] px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:border-[#ef473f] hover:text-[#ef473f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-[#c0392b] font-visby">{error}</p>
        )}
      </div>
    </div>
  )
}
