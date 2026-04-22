import { createClient } from "@/lib/supabase/server"
import { Package, Tag, FileText, Clock, CheckCircle, Archive } from "lucide-react"
import Link from "next/link"

async function getStats() {
  const supabase = await createClient()

  const [productsRes, brandsRes, quotesRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("quote_requests").select("id, status"),
  ])

  const quotes = quotesRes.data || []
  const statusCounts = {
    new: quotes.filter((q) => q.status === "new").length,
    in_progress: quotes.filter((q) => q.status === "in_progress").length,
    completed: quotes.filter((q) => q.status === "completed").length,
    archived: quotes.filter((q) => q.status === "archived").length,
  }

  return {
    products: productsRes.count || 0,
    brands: brandsRes.count || 0,
    quotes: {
      total: quotes.length,
      ...statusCounts,
    },
  }
}

async function getRecentQuotes() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  return data || []
}

export default async function AdminDashboardPage() {
  const stats = await getStats()
  const recentQuotes = await getRecentQuotes()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#666] mt-1">Welcome to the PromoShop admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.products}
          icon={Package}
          href="/admin/products"
          color="emerald"
        />
        <StatCard
          title="Total Brands"
          value={stats.brands}
          icon={Tag}
          href="/admin/brands"
          color="blue"
        />
        <StatCard
          title="Total Quotes"
          value={stats.quotes.total}
          icon={FileText}
          href="/admin/quotes"
          color="purple"
        />
        <StatCard
          title="New Quotes"
          value={stats.quotes.new}
          icon={Clock}
          href="/admin/quotes?status=new"
          color="amber"
        />
      </div>

      {/* Quote Status Breakdown */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Quote Requests by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard label="New" count={stats.quotes.new} icon={Clock} color="amber" />
          <StatusCard label="In Progress" count={stats.quotes.in_progress} icon={FileText} color="blue" />
          <StatusCard label="Completed" count={stats.quotes.completed} icon={CheckCircle} color="emerald" />
          <StatusCard label="Archived" count={stats.quotes.archived} icon={Archive} color="gray" />
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Quote Requests</h2>
          <Link
            href="/admin/quotes"
            className="text-sm text-[#00c896] hover:underline"
          >
            View All
          </Link>
        </div>
        {recentQuotes.length === 0 ? (
          <div className="p-8 text-center text-[#666]">
            No quote requests yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Company
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {recentQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-6 py-4 text-sm text-white">
                      {quote.first_name} {quote.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#888]">{quote.email}</td>
                    <td className="px-6 py-4 text-sm text-[#888]">{quote.company || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#666]">
                      {new Date(quote.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  color,
}: {
  title: string
  value: number
  icon: React.ElementType
  href: string
  color: "emerald" | "blue" | "purple" | "amber"
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
    amber: "bg-amber-500/10 text-amber-500",
  }

  return (
    <Link
      href={href}
      className="bg-[#111] border border-[#222] rounded-lg p-6 hover:border-[#333] transition-colors group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-[#666] group-hover:text-[#888] transition-colors">{title}</p>
    </Link>
  )
}

function StatusCard({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string
  count: number
  icon: React.ElementType
  color: "amber" | "blue" | "emerald" | "gray"
}) {
  const colors = {
    amber: "text-amber-500",
    blue: "text-blue-500",
    emerald: "text-emerald-500",
    gray: "text-gray-500",
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-[#0a0a0a] rounded-lg">
      <Icon className={`w-5 h-5 ${colors[color]}`} />
      <div>
        <p className="text-2xl font-bold text-white">{count}</p>
        <p className="text-xs text-[#666]">{label}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    new: "bg-amber-500/10 text-amber-500",
    in_progress: "bg-blue-500/10 text-blue-500",
    completed: "bg-emerald-500/10 text-emerald-500",
    archived: "bg-gray-500/10 text-gray-500",
  }

  const labels: Record<string, string> = {
    new: "New",
    in_progress: "In Progress",
    completed: "Completed",
    archived: "Archived",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || styles.new
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
