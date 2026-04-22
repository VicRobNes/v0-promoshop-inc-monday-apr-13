"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react"
import { BrandModal } from "./brand-modal"

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
  created_at: string | null
}

export function BrandsTable({ initialBrands }: { initialBrands: Brand[] }) {
  const [brands, setBrands] = useState(initialBrands)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand?")) return
    
    setIsDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from("brands").delete().eq("id", id)
    
    if (!error) {
      setBrands(brands.filter(b => b.id !== id))
    }
    setIsDeleting(null)
  }

  const handleToggleActive = async (brand: Brand) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("brands")
      .update({ is_active: !brand.is_active })
      .eq("id", brand.id)
    
    if (!error) {
      setBrands(brands.map(b => 
        b.id === brand.id ? { ...b, is_active: !b.is_active } : b
      ))
    }
  }

  const handleToggleFeatured = async (brand: Brand) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("brands")
      .update({ is_featured: !brand.is_featured })
      .eq("id", brand.id)
    
    if (!error) {
      setBrands(brands.map(b => 
        b.id === brand.id ? { ...b, is_featured: !b.is_featured } : b
      ))
    }
  }

  const handleSave = () => {
    setIsModalOpen(false)
    setEditingBrand(null)
    router.refresh()
  }

  return (
    <>
      <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#222]">
          <span className="text-sm text-[#888]">{brands.length} brands</span>
          <button
            onClick={() => { setEditingBrand(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 bg-[#ea4a3f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d93e36] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Brand
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222] text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Brand</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Slug</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Order</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Featured</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#888]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222]">
              {brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-10 h-10 rounded object-contain bg-white p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#222] flex items-center justify-center text-[#666] text-xs font-bold">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-white">{brand.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#888] font-mono">{brand.slug}</td>
                  <td className="px-4 py-3 text-sm text-[#888]">{brand.display_order}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleFeatured(brand)}
                      className={`p-1.5 rounded transition-colors ${
                        brand.is_featured 
                          ? "text-yellow-400 bg-yellow-400/10" 
                          : "text-[#666] hover:text-yellow-400"
                      }`}
                    >
                      <Star className="w-4 h-4" fill={brand.is_featured ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(brand)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        brand.is_active 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-[#333] text-[#888]"
                      }`}
                    >
                      {brand.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {brand.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingBrand(brand); setIsModalOpen(true) }}
                        className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand.id)}
                        disabled={isDeleting === brand.id}
                        className="p-2 text-[#888] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BrandModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBrand(null) }}
        brand={editingBrand}
        onSave={handleSave}
      />
    </>
  )
}
