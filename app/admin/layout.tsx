import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata = {
  title: "Admin Dashboard | PromoShop",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
