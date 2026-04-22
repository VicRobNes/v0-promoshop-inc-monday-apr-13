"use client"

import { useState } from "react"
import {
  Image as ImageIcon,
  Award,
  Users,
  Palette,
  Package,
} from "lucide-react"
import { AdminImagePanel } from "@/components/admin/admin-image-panel"
import { AdminTeamPanel } from "@/components/admin/admin-team-panel"
import { AdminBrandsPanel } from "@/components/admin/admin-brands-panel"
import { AdminThemePanel } from "@/components/admin/admin-theme-panel"
import { AdminProductsPanel } from "@/components/admin/admin-products-panel"

type TabKey = "images" | "brands" | "team" | "theme" | "products"

const TABS: Array<{ key: TabKey; label: string; icon: typeof ImageIcon }> = [
  { key: "products", label: "Products", icon: Package },
  { key: "brands", label: "Brands", icon: Award },
  { key: "team", label: "Team", icon: Users },
  { key: "images", label: "Images", icon: ImageIcon },
  { key: "theme", label: "Theme", icon: Palette },
]

export function AdminTabs() {
  const [tab, setTab] = useState<TabKey>("products")

  return (
    <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      <header className="mb-6">
        <p className="text-xs font-bold tracking-wider uppercase text-[#ea4a3f]">Admin</p>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#111] mt-1">
          Content dashboard
        </h1>
        <p className="text-sm text-[#666] mt-1">
          Add and edit products, brands, team members, imagery, and brand
          colours. Changes save in this browser immediately; a Cosmos-backed
          persistence layer is rolling out next.
        </p>
      </header>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-[#e5e5e5] mb-6">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                active
                  ? "border-[#ea4a3f] text-[#ea4a3f]"
                  : "border-transparent text-[#666] hover:text-[#111]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "products" && <AdminProductsPanel />}
      {tab === "brands" && <AdminBrandsPanel />}
      {tab === "team" && <AdminTeamPanel />}
      {tab === "images" && <AdminImagePanel />}
      {tab === "theme" && <AdminThemePanel />}
    </section>
  )
}
