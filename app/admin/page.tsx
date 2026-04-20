import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AdminTabs } from "@/components/admin/admin-tabs"

export const metadata = {
  title: "Admin — Content Dashboard | PromoShop",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f6] text-[#1a1a1a]">
      <Header />
      <AdminTabs />
      <Footer />
    </div>
  )
}
