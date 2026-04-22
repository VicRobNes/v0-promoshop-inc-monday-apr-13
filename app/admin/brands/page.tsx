"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/storage/upload"
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  ExternalLink,
  GripVertical,
} from "lucide-react"

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export default function BrandsAdminPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchBrands = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("brands")
      .select("*")
      .order("sort_order", { ascending: true })
    setBrands(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("brands").delete().eq("id", id)
    setDeleteConfirm(null)
    fetchBrands()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Brands</h1>
          <p className="text-[#666] mt-1">Manage partner brands</p>
        </div>
        <button
          onClick={() => {
            setEditingBrand(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-[#00c896] text-[#0a0a0a] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#00b085] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Brand
        </button>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.length === 0 ? (
          <div className="col-span-full bg-[#111] border border-[#222] rounded-lg p-8 text-center text-[#666]">
            No brands yet. Add your first brand!
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-[#111] border border-[#222] rounded-lg p-6 hover:border-[#333] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-[#444] cursor-grab" />
                  <span className="text-xs text-[#555]">#{brand.sort_order}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      brand.is_active ? "bg-emerald-500" : "bg-gray-500"
                    }`}
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="h-20 bg-[#0a0a0a] rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="max-h-16 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[#555] text-sm">No logo</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-1">{brand.name}</h3>
              <p className="text-sm text-[#666] mb-4">{brand.slug}</p>

              {brand.website_url && (
                <a
                  href={brand.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#00c896] hover:underline mb-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  {brand.website_url}
                </a>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-[#222]">
                <button
                  onClick={() => {
                    setEditingBrand(brand)
                    setIsModalOpen(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(brand.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#888] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Brand Modal */}
      {isModalOpen && (
        <BrandModal
          brand={editingBrand}
          onClose={() => {
            setIsModalOpen(false)
            setEditingBrand(null)
          }}
          onSave={() => {
            setIsModalOpen(false)
            setEditingBrand(null)
            fetchBrands()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Brand</h3>
            <p className="text-[#888] mb-6">
              Are you sure you want to delete this brand? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-[#888] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BrandModal({
  brand,
  onClose,
  onSave,
}: {
  brand: Brand | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    slug: brand?.slug || "",
    website_url: brand?.website_url || "",
    is_active: brand?.is_active ?? true,
    sort_order: brand?.sort_order || 0,
  })
  const [logoUrl, setLogoUrl] = useState<string | null>(brand?.logo_url || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: brand ? formData.slug : generateSlug(name),
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { url, error } = await uploadImage(file, "brands")
    if (url) {
      setLogoUrl(url)
    } else {
      console.error("Upload error:", error)
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    const supabase = createClient()

    const data = {
      name: formData.name,
      slug: formData.slug,
      website_url: formData.website_url || null,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
      logo_url: logoUrl,
    }

    if (brand) {
      const { error } = await supabase.from("brands").update(data).eq("id", brand.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("brands").insert(data)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-[#222] rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <h2 className="text-lg font-semibold text-white">
            {brand ? "Edit Brand" : "Add New Brand"}
          </h2>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-[#0a0a0a] border border-[#333] rounded-lg flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-20 max-w-full object-contain" />
                ) : (
                  <span className="text-[#555] text-xs">No logo</span>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#00c896] transition-colors cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="ml-2 text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#00c896] focus:ring-[#00c896]"
              />
              <label htmlFor="is_active" className="text-sm text-[#888]">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#888] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {brand ? "Update Brand" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
