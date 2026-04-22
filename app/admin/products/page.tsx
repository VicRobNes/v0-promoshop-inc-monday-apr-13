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
  Star,
  Search,
} from "lucide-react"

interface Brand {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  brand_id: string | null
  description: string | null
  short_description: string | null
  images: string[]
  category: string | null
  tags: string[] | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const [productsRes, brandsRes] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("brands").select("id, name, slug").order("name"),
    ])

    setProducts(productsRes.data || [])
    setBrands(brandsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("products").delete().eq("id", id)
    setDeleteConfirm(null)
    fetchData()
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBrandName = (brandId: string | null) => {
    if (!brandId) return "-"
    return brands.find((b) => b.id === brandId)?.name || "-"
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
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-[#666] mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-[#00c896] text-[#0a0a0a] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#00b085] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-[#222] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-[#666]">
            {searchTerm ? "No products found matching your search" : "No products yet. Add your first product!"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Product
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Brand
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Category
                  </th>
                  <th className="text-center text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Featured
                  </th>
                  <th className="text-center text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Active
                  </th>
                  <th className="text-right text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-[#222]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#222] flex items-center justify-center">
                            <span className="text-[#555] text-xs">No img</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">
                      {getBrandName(product.brand_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">{product.category || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      {product.is_featured && <Star className="w-4 h-4 text-amber-500 mx-auto fill-amber-500" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex h-2 w-2 rounded-full ${
                          product.is_active ? "bg-emerald-500" : "bg-gray-500"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product)
                            setIsModalOpen(true)
                          }}
                          className="p-2 text-[#666] hover:text-white hover:bg-[#222] rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="p-2 text-[#666] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          brands={brands}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          onSave={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
            fetchData()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-[#222] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Product</h3>
            <p className="text-[#888] mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
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

function ProductModal({
  product,
  brands,
  onClose,
  onSave,
}: {
  product: Product | null
  brands: Brand[]
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    brand_id: product?.brand_id || "",
    description: product?.description || "",
    short_description: product?.short_description || "",
    category: product?.category || "",
    tags: product?.tags?.join(", ") || "",
    is_featured: product?.is_featured || false,
    is_active: product?.is_active ?? true,
    sort_order: product?.sort_order || 0,
  })
  const [images, setImages] = useState<string[]>(product?.images || [])
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
      slug: product ? formData.slug : generateSlug(name),
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const uploadedUrls: string[] = []

    for (const file of Array.from(files)) {
      const { url, error } = await uploadImage(file, "products")
      if (url) {
        uploadedUrls.push(url)
      } else {
        console.error("Upload error:", error)
      }
    }

    setImages([...images, ...uploadedUrls])
    setUploading(false)
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    const supabase = createClient()

    const data = {
      name: formData.name,
      slug: formData.slug,
      brand_id: formData.brand_id || null,
      description: formData.description || null,
      short_description: formData.short_description || null,
      category: formData.category || null,
      tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      is_featured: formData.is_featured,
      is_active: formData.is_active,
      sort_order: formData.sort_order,
      images,
    }

    if (product) {
      const { error } = await supabase.from("products").update(data).eq("id", product.id)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
    } else {
      const { error } = await supabase.from("products").insert(data)
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
      <div className="bg-[#111] border border-[#222] rounded-lg w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-[#222]">
          <h2 className="text-lg font-semibold text-white">
            {product ? "Edit Product" : "Add New Product"}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Brand
              </label>
              <select
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                placeholder="e.g., Apparel, Drinkware"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              placeholder="Brief product summary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none resize-none"
              placeholder="Full product description"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              placeholder="sustainable, eco-friendly, premium"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
              Images
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Product ${index + 1}`}
                    className="w-20 h-20 rounded-lg object-cover bg-[#222]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-[#333] flex items-center justify-center cursor-pointer hover:border-[#00c896] transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#555]" />
                ) : (
                  <Upload className="w-5 h-5 text-[#555]" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded border-[#333] bg-[#0a0a0a] text-[#00c896] focus:ring-[#00c896]"
              />
              <label htmlFor="is_featured" className="text-sm text-[#888]">
                Featured
              </label>
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
              {product ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
