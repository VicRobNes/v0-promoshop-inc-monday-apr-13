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

interface UploadProgress {
  /** 0–100 */
  percent: number
  bytesSent: number
  totalBytes: number
  /** "mint" = waiting on SAS, "put" = uploading to Azure, "done" / "error" */
  phase: "mint" | "put" | "done" | "error"
}

interface UploadHandlers {
  onProgress?: (p: UploadProgress) => void
  /** Abort from outside (e.g. component unmount). */
  signal?: AbortSignal
}

function putWithProgress(
  url: string,
  file: File,
  handlers: UploadHandlers,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url, true)
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob")
    xhr.setRequestHeader(
      "content-type",
      file.type || "application/octet-stream",
    )

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return
      handlers.onProgress?.({
        percent: Math.min(100, Math.round((ev.loaded / ev.total) * 100)),
        bytesSent: ev.loaded,
        totalBytes: ev.total,
        phase: "put",
      })
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Blob PUT failed: ${xhr.status} ${xhr.statusText || ""}`.trim()))
    }
    xhr.onerror = () => reject(new Error("Network error uploading to Blob Storage."))
    xhr.onabort = () => reject(new DOMException("Upload aborted", "AbortError"))

    if (handlers.signal) {
      if (handlers.signal.aborted) {
        xhr.abort()
        return
      }
      handlers.signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(file)
  })
}

async function uploadViaBlob(
  slotId: string,
  file: File,
  handlers: UploadHandlers = {},
): Promise<string> {
  handlers.onProgress?.({ percent: 0, bytesSent: 0, totalBytes: file.size, phase: "mint" })
  const sasRes = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slotId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    }),
    signal: handlers.signal,
  })
  if (sasRes.status === 503) {
    throw new BlobNotConfiguredError()
  }
  if (!sasRes.ok) {
    const msg = await sasRes.text().catch(() => "")
    throw new Error(`Upload endpoint returned ${sasRes.status}: ${msg.slice(0, 200)}`)
  }
  const sas = (await sasRes.json()) as UploadSasResponse

  // Single retry on transient PUT failures (network blip, 5xx). SAS is still
  // valid for several minutes so the same URL can be reused.
  try {
    await putWithProgress(sas.uploadUrl, file, handlers)
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err
    await new Promise((r) => setTimeout(r, 600))
    await putWithProgress(sas.uploadUrl, file, handlers)
  }
  handlers.onProgress?.({
    percent: 100,
    bytesSent: file.size,
    totalBytes: file.size,
    phase: "done",
  })
  return sas.readUrl
}

class BlobNotConfiguredError extends Error {
  constructor() {
    super("Blob storage not yet configured; falling back to local overrides.")
    this.name = "BlobNotConfiguredError"
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
  const [upload, setUpload] = useState<{
    fileName: string
    fileSize: number
    progress: UploadProgress
  } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Keep the draft URL input in sync when the override changes from elsewhere
  // (import, reset-all, or another browser tab).
  useEffect(() => {
    setDraftUrl(override ?? "")
  }, [override])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const uploadBusy = upload !== null && upload.progress.phase !== "done" && upload.progress.phase !== "error"
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
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setUpload({
      fileName: file.name,
      fileSize: file.size,
      progress: { percent: 0, bytesSent: 0, totalBytes: file.size, phase: "mint" },
    })

    // Try blob upload first; on 503 (not configured) fall back to base64.
    try {
      if (file.size > MAX_UPLOAD_BYTES_BLOB) {
        throw new Error(
          `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload an image under 10 MB.`,
        )
      }
      const readUrl = await uploadViaBlob(slot.id, file, {
        signal: ctrl.signal,
        onProgress: (p) =>
          setUpload((cur) =>
            cur ? { ...cur, progress: p } : cur,
          ),
      })
      setOverride(slot.id, readUrl)
      setDraftUrl(readUrl)
      setUpload(null)
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setUpload(null)
        return
      }
      if (!(err instanceof BlobNotConfiguredError)) {
        setUpload((cur) =>
          cur
            ? { ...cur, progress: { ...cur.progress, phase: "error" } }
            : cur,
        )
        setError(
          err instanceof Error ? err.message : "Couldn't upload to blob storage.",
        )
        return
      }
      // fall through to base64 path
    }

    // Fallback: base64 data URL in override (original behaviour pre-Phase 3).
    if (file.size > MAX_UPLOAD_BYTES_FALLBACK) {
      setUpload(null)
      setError(
        `Blob storage isn't configured yet and this file is ${(file.size / 1024 / 1024).toFixed(1)} MB — please use an image under 2.5 MB or paste a URL until Phase 0 provisioning completes.`,
      )
      return
    }
    const reader = new FileReader()
    reader.onerror = () => {
      setUpload(null)
      setError("Couldn't read that file.")
    }
    reader.onload = () => {
      setUpload(null)
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

  const handleCancelUpload = () => {
    abortRef.current?.abort()
    setUpload(null)
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
            disabled={!isOverridden || uploadBusy}
            title="Reset to default"
            className="inline-flex items-center justify-center gap-1.5 bg-white border border-[#d9d9d9] text-[#555] px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:border-[#ef473f] hover:text-[#ef473f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {upload && (
          <div className="mt-3" aria-live="polite">
            <div className="flex items-center gap-2 text-[11px] font-visby text-[#555] mb-1">
              <span className="truncate font-mono text-[#1a1a1a]" title={upload.fileName}>
                {upload.fileName}
              </span>
              <span className="text-[#999] flex-shrink-0">
                {formatBytes(upload.progress.bytesSent)} / {formatBytes(upload.fileSize)}
              </span>
              <span className="ml-auto flex-shrink-0 font-bold text-[#1a1a1a]">
                {upload.progress.phase === "mint"
                  ? "Preparing…"
                  : upload.progress.phase === "error"
                    ? "Failed"
                    : `${upload.progress.percent}%`}
              </span>
              {uploadBusy && (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#ef473f] hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-[#eaeaea] overflow-hidden"
              role="progressbar"
              aria-valuenow={upload.progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Uploading ${upload.fileName}`}
            >
              <div
                className={`h-full transition-all duration-150 ${
                  upload.progress.phase === "error" ? "bg-[#c0392b]" : "bg-[#6abf4b]"
                }`}
                style={{
                  width: `${upload.progress.phase === "mint" ? 5 : upload.progress.percent}%`,
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-[#c0392b] font-visby">{error}</p>
        )}
      </div>
    </div>
  )
}
