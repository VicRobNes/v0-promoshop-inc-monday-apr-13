"use client"

import { useEffect, useState } from "react"
import { Trash2, Plus, Save, RotateCcw, ImageOff } from "lucide-react"
import { BRANDS } from "@/lib/brands"
import type { Brand } from "@/lib/brands"
import {
  clearBrandsOverride,
  readBrandsOverride,
  writeBrandsOverride,
} from "@/lib/admin-overrides"

// Admin panel for brand CRUD (client feedback Apr 16: "Can I have the
// ability to add and remove logos?"). Each brand's logo URL lives on the
// record itself; bulk image management is still available under the
// Images tab. localStorage-backed today, Cosmos in a follow-up phase.

const EMPTY_BRAND: Brand = {
  id: "",
  name: "",
  slug: "",
  description: "",
  categories: [],
  logoUrl: "",
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function AdminBrandsPanel() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [draft, setDraft] = useState<Brand>(EMPTY_BRAND)
  const [draftCategories, setDraftCategories] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const initial = readBrandsOverride() ?? BRANDS
    setBrands(initial)
  }, [])

  const update = (next: Brand[]) => {
    setBrands(next)
    setDirty(true)
    setSaved(false)
  }

  const handleAdd = () => {
    const name = draft.name.trim()
    if (!name) return
    const slug = draft.slug.trim() || slugify(name)
    const id = draft.id.trim() || slug
    const categories = draftCategories
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    update([...brands, { ...draft, name, slug, id, categories }])
    setDraft(EMPTY_BRAND)
    setDraftCategories("")
  }

  const handleRemove = (slug: string) => {
    update(brands.filter((b) => b.slug !== slug))
  }

  const handleChange = (slug: string, patch: Partial<Brand>) => {
    update(brands.map((b) => (b.slug === slug ? { ...b, ...patch } : b)))
  }

  const handleSave = () => {
    writeBrandsOverride(brands)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    clearBrandsOverride()
    setBrands(BRANDS)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111]">Brands</h2>
          <p className="text-sm text-[#666]">
            Add, remove, and edit the brands shown on the Brands page and
            logo scroll. Paste a logo URL to change the image.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666] border border-[#d4d4d4] rounded hover:bg-[#f6f6f6]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              dirty ? "bg-[#ef473f] text-white hover:bg-[#d93e36]" : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map((brand) => (
          <div
            key={brand.slug}
            className="bg-white border border-[#e5e5e5] rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <input
                type="text"
                value={brand.name}
                onChange={(e) => handleChange(brand.slug, { name: e.target.value })}
                placeholder="Brand name"
                className="flex-1 font-bold text-sm text-[#111] bg-transparent border-b border-[#e5e5e5] py-1 focus:border-[#ef473f] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemove(brand.slug)}
                aria-label="Remove brand"
                className="text-[#999] hover:text-[#ef473f]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Logo preview + URL field side-by-side so admins see exactly
                what the brand scroll / brand page will render. */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-16 flex-shrink-0 rounded bg-[#bde7ff]/40 border border-[#e5e5e5] flex items-center justify-center overflow-hidden">
                {brand.logoUrl ? (
                  // next/image can't hotlink arbitrary origins without config,
                  // so for live admin previews we use a plain <img>.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoUrl}
                    alt={`${brand.name} logo preview`}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <ImageOff className="w-5 h-5 text-[#999]" />
                )}
              </div>
              <input
                type="text"
                value={brand.logoUrl ?? ""}
                onChange={(e) => handleChange(brand.slug, { logoUrl: e.target.value })}
                placeholder="Logo URL — paste a public image URL here"
                className="flex-1 text-xs text-[#666] bg-transparent border border-[#e5e5e5] rounded px-2 py-1.5 focus:border-[#ef473f] focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-[#999] -mt-2">
              Don&apos;t have a URL? Go to the <strong>Images</strong> tab and upload
              a file under &ldquo;Brand logos&rdquo; → {brand.name}.
            </p>
            <textarea
              value={brand.description}
              onChange={(e) => handleChange(brand.slug, { description: e.target.value })}
              placeholder="Short description"
              rows={2}
              className="w-full text-xs text-[#666] bg-transparent border border-[#e5e5e5] rounded p-2 focus:border-[#ef473f] focus:outline-none resize-none"
            />
            <input
              type="text"
              value={brand.categories.join(", ")}
              onChange={(e) =>
                handleChange(brand.slug, {
                  categories: e.target.value
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Categories (comma-separated)"
              className="w-full text-xs text-[#666] bg-transparent border border-[#e5e5e5] rounded px-2 py-1.5 focus:border-[#ef473f] focus:outline-none"
            />
            <label className="flex items-center gap-2 text-xs text-[#666]">
              <input
                type="checkbox"
                checked={brand.featured ?? false}
                onChange={(e) => handleChange(brand.slug, { featured: e.target.checked })}
                className="accent-[#ef473f]"
              />
              Featured
            </label>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-[#f9f9f9] border border-dashed border-[#d4d4d4] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#111] mb-3">Add a brand</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Brand name"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ef473f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.slug}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
            placeholder="Slug (auto if blank)"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ef473f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.logoUrl ?? ""}
            onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
            placeholder="Logo URL"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ef473f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ef473f] focus:outline-none"
          />
          <input
            type="text"
            value={draftCategories}
            onChange={(e) => setDraftCategories(e.target.value)}
            placeholder="Categories (comma-separated)"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ef473f] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.name.trim()}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" /> Add brand
        </button>
      </div>
    </div>
  )
}
