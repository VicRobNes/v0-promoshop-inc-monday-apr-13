import { createClient } from "@/lib/supabase/server"
import { BrandsTable } from "./brands-table"

export const metadata = {
  title: "Brands — Admin | PromoShop",
}

export default async function BrandsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("display_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Brands</h1>
          <p className="text-[#888] mt-1">Manage brand listings and logos</p>
        </div>
      </div>

      <BrandsTable initialBrands={brands || []} />
    </div>
  )
}
