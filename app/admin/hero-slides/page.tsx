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
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  bg_color: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export default function HeroSlidesAdminPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchSlides = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true })
    setSlides(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("hero_slides").delete().eq("id", id)
    setDeleteConfirm(null)
    fetchSlides()
  }

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const currentIndex = slides.findIndex((s) => s.id === id)
    if (currentIndex === -1) return

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (swapIndex < 0 || swapIndex >= slides.length) return

    const supabase = createClient()
    const currentSlide = slides[currentIndex]
    const swapSlide = slides[swapIndex]

    await Promise.all([
      supabase.from("hero_slides").update({ sort_order: swapSlide.sort_order }).eq("id", currentSlide.id),
      supabase.from("hero_slides").update({ sort_order: currentSlide.sort_order }).eq("id", swapSlide.id),
    ])

    fetchSlides()
  }

  const toggleActive = async (slide: HeroSlide) => {
    const supabase = createClient()
    await supabase.from("hero_slides").update({ is_active: !slide.is_active }).eq("id", slide.id)
    fetchSlides()
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
          <h1 className="text-2xl font-bold text-white">Hero Slides</h1>
          <p className="text-[#666] mt-1">Manage homepage hero slideshow</p>
        </div>
        <button
          onClick={() => {
            setEditingSlide(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-[#00c896] text-[#0a0a0a] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#00b085] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Slide
        </button>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-lg p-8 text-center text-[#666]">
            No slides yet. Add your first hero slide!
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`bg-[#111] border rounded-lg overflow-hidden transition-colors ${
                slide.is_active ? "border-[#222]" : "border-[#222] opacity-60"
              }`}
            >
              <div className="flex items-stretch">
                {/* Preview */}
                <div
                  className="w-48 min-h-[120px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: slide.bg_color || "#1a1a1a" }}
                >
                  {slide.image_url ? (
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/50 text-xs">No image</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{slide.title}</h3>
                      {slide.subtitle && (
                        <p className="text-sm text-[#888] mb-2">{slide.subtitle}</p>
                      )}
                      {slide.cta_text && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#00c896]/10 text-[#00c896] px-2 py-1 rounded">
                          CTA: {slide.cta_text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#555] mr-2">#{slide.sort_order}</span>
                      <button
                        onClick={() => handleReorder(slide.id, "up")}
                        disabled={index === 0}
                        className="p-2 text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(slide.id, "down")}
                        disabled={index === slides.length - 1}
                        className="p-2 text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-4 border-l border-[#222]">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-2 rounded-lg transition-colors ${
                      slide.is_active
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-[#666] hover:text-white hover:bg-[#222]"
                    }`}
                    title={slide.is_active ? "Deactivate" : "Activate"}
                  >
                    {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSlide(slide)
                      setIsModalOpen(true)
                    }}
                    className="p-2 text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(slide.id)}
                    className="p-2 text-[#666] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide Modal */}
      {isModalOpen && (
        <SlideModal
          slide={editingSlide}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSlide(null)
          }}
          onSave={() => {
            setIsModalOpen(false)
            setEditingSlide(null)
            fetchSlides()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Slide</h3>
            <p className="text-[#888] mb-6">
              Are you sure you want to delete this slide? This action cannot be undone.
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

function SlideModal({
  slide,
  onClose,
  onSave,
}: {
  slide: HeroSlide | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    cta_text: slide?.cta_text || "",
    cta_url: slide?.cta_url || "",
    bg_color: slide?.bg_color || "#1a1a1a",
    is_active: slide?.is_active ?? true,
    sort_order: slide?.sort_order || 0,
  })
  const [imageUrl, setImageUrl] = useState<string | null>(slide?.image_url || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const { url, error } = await uploadImage(file, "hero-slides")
    if (url) {
      setImageUrl(url)
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
      title: formData.title,
      subtitle: formData.subtitle || null,
      cta_text: formData.cta_text || null,
      cta_url: formData.cta_url || null,
      bg_color: formData.bg_color || null,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
      image_url: imageUrl,
    }

    if (slide) {
      const { error } = await supabase.from("hero_slides").update(data).eq("id", slide.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("hero_slides").insert(data)
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111] border border-[#222] rounded-lg w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <h2 className="text-lg font-semibold text-white">
            {slide ? "Edit Slide" : "Add New Slide"}
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

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Slide Image
            </label>
            <div className="flex items-center gap-4">
              <div
                className="w-32 h-20 border border-[#333] rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: formData.bg_color }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white/50 text-xs">No image</span>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-[#888] hover:text-white hover:border-[#00c896] transition-colors cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="ml-2 text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                CTA Text
              </label>
              <input
                type="text"
                value={formData.cta_text}
                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                placeholder="Learn More"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                CTA URL
              </label>
              <input
                type="text"
                value={formData.cta_url}
                onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                placeholder="/brands"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-[#333] cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="flex-1 bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                />
              </div>
            </div>
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
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#00c896] focus:ring-[#00c896]"
            />
            <label htmlFor="is_active" className="text-sm text-[#888]">
              Active (visible on website)
            </label>
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
              {slide ? "Update Slide" : "Create Slide"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
