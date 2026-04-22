"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, Upload } from "lucide-react"

interface Brand {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  hero_image_url: string | null
  website_url: string | null
  is_featured: boolean | null
  display_order: number | null
  is_active: boolean | null
}

interface BrandModalProps {
  isOpen: boolean
  onClose: () => void
  brand: Brand | null
  onSave: () => void
}

export function BrandModal({ isOpen, onClose, brand, onSave }: BrandModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    hero_image_url: "",
    website_url: "",
    is_featured: false,
    display_order: 0,
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        slug: brand.slug || "",
        description: brand.description || "",
        logo_url: brand.logo_url || "",
        hero_image_url: brand.hero_image_url || "",
        website_url: brand.website_url || "",
        is_featured: brand.is_featured || false,
        display_order: brand.display_order || 0,
        is_active: brand.is_active ?? true,
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        logo_url: "",
        hero_image_url: "",
        website_url: "",
        is_featured: false,
        display_order: 0,
        is_active: true,
      })
    }
  }, [brand])

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "hero_image_url") => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `brands/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("brands")
      .upload(filePath, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from("brands")
      .getPublicUrl(filePath)

    setFormData(prev => ({ ...prev, [field]: publicUrl }))
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    if (brand) {
      // Update existing brand
      const { error } = await supabase
        .from("brands")
        .update(formData)
        .eq("id", brand.id)

      if (error) {
        console.error("Update error:", error)
        setLoading(false)
        return
      }
    } else {
      // Create new brand
      const { error } = await supabase
        .from("brands")
        .insert(formData)

      if (error) {
        console.error("Insert error:", error)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSave()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#222] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <h2 className="text-lg font-bold text-white">
            {brand ? "Edit Brand" : "Add Brand"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded text-sm focus:border-[#ea4a3f] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded text-sm font-mono focus:border-[#ea4a3f] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded text-sm focus:border-[#ea4a3f] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                Logo
              </label>
              <div className="flex items-center gap-3">
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Logo" className="w-16 h-16 rounded object-contain bg-white p-1" />
                ) : (
                  <div className="w-16 h-16 rounded bg-[#222] flex items-center justify-center text-[#666]">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
                <label className="flex-1">
                  <span className="block bg-[#222] text-[#888] px-4 py-2 rounded text-sm text-center cursor-pointer hover:bg-[#333] transition-colors">
                    {uploading ? "Uploading..." : "Upload Logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logo_url")}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded text-sm focus:border-[#ea4a3f] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded text-sm focus:border-[#ea4a3f] focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#ea4a3f] focus:ring-[#ea4a3f]"
                />
                <span className="text-sm text-white">Featured</span>
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#ea4a3f] focus:ring-[#ea4a3f]"
                />
                <span className="text-sm text-white">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#888] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#ea4a3f] text-white text-sm font-medium rounded hover:bg-[#d93e36] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : brand ? "Update Brand" : "Create Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
