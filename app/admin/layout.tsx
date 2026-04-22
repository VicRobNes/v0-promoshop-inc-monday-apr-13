import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""
  
  // Allow login page without auth
  if (pathname.includes("/admin/login")) {
    return <>{children}</>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/admin/login")
  }

  // Verify user is an admin
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", user.id)
    .eq("is_active", true)
    .single()

  if (!adminUser) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <AdminSidebar user={adminUser} />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
