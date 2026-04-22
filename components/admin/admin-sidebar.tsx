"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Package,
  Tag,
  Image,
  FileText,
  Settings,
  Users,
  LogOut,
  ChevronRight,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/hero-slides", label: "Hero Slides", icon: Image },
  { href: "/admin/quotes", label: "Quote Requests", icon: FileText },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <Link href="/admin" className="block">
          <h1 className="text-xl font-bold text-white tracking-wide">
            PROMO<span className="text-[#00c896]">SHOP</span>
          </h1>
          <p className="text-[#555] text-xs mt-0.5">Admin Dashboard</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#00c896]/10 text-[#00c896]"
                      : "text-[#888] hover:text-white hover:bg-[#111]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1a1a1a]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-[#888] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-4 py-3 mt-1 rounded-lg text-sm font-medium text-[#555] hover:text-[#888] transition-colors"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          <span>Back to Website</span>
        </Link>
      </div>
    </aside>
  )
}
