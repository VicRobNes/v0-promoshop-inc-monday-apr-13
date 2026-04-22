"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Package,
  Tag,
  ImageIcon,
  MessageSquare,
  FileText,
  Users,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react"

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/hero-slides", label: "Hero Slides", icon: ImageIcon },
  { href: "/admin/quotes", label: "Quote Requests", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/users", label: "Admin Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#111] border-r border-[#222] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#222]">
        <Link href="/admin" className="block">
          <span className="text-xl font-black text-white tracking-tight">
            PROMO<span className="text-[#ea4a3f]">SHOP</span>
          </span>
          <span className="block text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase mt-1">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#ea4a3f]/10 text-[#ea4a3f]"
                  : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* View Site Link */}
      <div className="p-4 border-t border-[#222]">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Website
        </Link>
      </div>

      {/* User Info & Sign Out */}
      <div className="p-4 border-t border-[#222]">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">
            {user.full_name || user.email}
          </p>
          <p className="text-xs text-[#666] capitalize">{user.role || "Admin"}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
