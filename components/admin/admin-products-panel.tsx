"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Trash2, Plus, Save, RotateCcw, Search } from "lucide-react"
import { PRODUCTS } from "@/lib/products"
import type { Product } from "@/lib/products"
import {
  clearProductsOverride,
  readProductsOverride,
  writeProductsOverride,
} from "@/lib/admin-overrides"

// Admin panel for products (client feedback Apr 16: "I am unable to add
// or view any of the products in the admin portal"). Shows every product
// currently configured + a compact form to add new ones. localStorage
// today, Cosmos in a follow-up phase.

const EMPTY_DRAFT = {
  sku: "",
  name: "",
  category: "",
  brands: "",
  gender: "Unisex",
  sizes: "S, M, L, XL",
  colourName: "Default",
  colourHex: "#000000",
  imageUrl: "",
  minQty: 25,
  description: "",
}

type Draft = typeof EMPTY_DRAFT

function toProduct(d: Draft): Product {
  return {
    sku: d.sku.trim(),
    name: d.name.trim(),
    category: d.category.trim() || "Uncategorised",
    brands: d.brands.split(",").map((b) => b.trim()).filter(Boolean),
    gender: [d.gender] as Product["gender"],
    sizes: d.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    colours: [
      {
        name: d.colourName || "Default",
        hex: d.colourHex || "#000000",
        images: d.imageUrl ? [d.imageUrl] : [],
      },
    ],
    minQty: Number.isFinite(Number(d.minQty)) ? Number(d.minQty) : 25,
    description: d.description,
  }
}

export function AdminProductsPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState("")
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const initial = readProductsOverride() ?? PRODUCTS
    setProducts(initial)
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brands.join(" ").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, filter])

  const update = (next: Product[]) => {
    setProducts(next)
    setDirty(true)
    setSaved(false)
  }

  const handleAdd = () => {
    if (!draft.sku.trim() || !draft.name.trim()) return
    update([...products, toProduct(draft)])
    setDraft(EMPTY_DRAFT)
  }

  const handleRemove = (sku: string) => {
    update(products.filter((p) => p.sku !== sku))
  }

  const handleSave = () => {
    writeProductsOverride(products)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    clearProductsOverride()
    setProducts(PRODUCTS)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111]">Products</h2>
          <p className="text-sm text-[#666]">
            {products.length} product{products.length === 1 ? "" : "s"} in the
            catalogue. Add new SKUs with the form below.
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
              dirty ? "bg-[#ea4a3f] text-white hover:bg-[#d93e36]" : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, SKU, brand, category"
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#d4d4d4] rounded-full focus:border-[#ea4a3f] focus:outline-none"
        />
      </div>

      {/* Product list */}
      <div className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f6f6] text-[10px] font-bold uppercase tracking-wider text-[#666]">
            <tr>
              <th className="text-left px-3 py-2 w-16">Image</th>
              <th className="text-left px-3 py-2">Product</th>
              <th className="text-left px-3 py-2">SKU</th>
              <th className="text-left px-3 py-2">Category</th>
              <th className="text-left px-3 py-2">Brands</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const firstImage = product.colours[0]?.images[0]
              return (
                <tr key={product.sku} className="border-t border-[#eee]">
                  <td className="px-3 py-2">
                    <div className="w-12 h-12 bg-[#f0f0f0] rounded overflow-hidden relative">
                      {firstImage && (
                        <Image
                          src={firstImage}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-bold text-[#111]">{product.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-[#666]">{product.sku}</td>
                  <td className="px-3 py-2 text-[#666]">{product.category}</td>
                  <td className="px-3 py-2 text-xs text-[#666]">{product.brands.join(", ")}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(product.sku)}
                      aria-label={`Remove ${product.name}`}
                      className="text-[#999] hover:text-[#ea4a3f]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-sm text-[#999] py-8">
                  No products match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add new */}
      <div className="bg-[#f9f9f9] border border-dashed border-[#d4d4d4] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#111] mb-3">Add a product</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={draft.sku}
            onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
            placeholder="SKU (unique)"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Product name"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="Category (e.g. Jackets)"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.brands}
            onChange={(e) => setDraft({ ...draft, brands: e.target.value })}
            placeholder="Brands (comma-separated)"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <select
            value={draft.gender}
            onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          >
            <option>Unisex</option>
            <option>Mens</option>
            <option>Womens</option>
          </select>
          <input
            type="text"
            value={draft.sizes}
            onChange={(e) => setDraft({ ...draft, sizes: e.target.value })}
            placeholder="Sizes (comma-separated)"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="text"
            value={draft.colourName}
            onChange={(e) => setDraft({ ...draft, colourName: e.target.value })}
            placeholder="Default colour name"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <div className="flex items-center gap-2 bg-white border border-[#d4d4d4] rounded px-3 py-1.5">
            <input
              type="color"
              value={draft.colourHex}
              onChange={(e) => setDraft({ ...draft, colourHex: e.target.value })}
              className="w-8 h-8 rounded border border-[#e5e5e5] cursor-pointer"
              aria-label="Default colour hex"
            />
            <input
              type="text"
              value={draft.colourHex}
              onChange={(e) => setDraft({ ...draft, colourHex: e.target.value })}
              placeholder="#000000"
              className="flex-1 font-mono text-xs bg-transparent focus:outline-none"
            />
          </div>
          <input
            type="text"
            value={draft.imageUrl}
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
            placeholder="Primary image URL"
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <input
            type="number"
            value={draft.minQty}
            onChange={(e) => setDraft({ ...draft, minQty: Number(e.target.value) })}
            placeholder="Min. qty"
            className="bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none"
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="md:col-span-2 bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm focus:border-[#ea4a3f] focus:outline-none resize-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.sku.trim() || !draft.name.trim()}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#111] text-white text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" /> Add product
        </button>
      </div>
    </div>
  )
}
