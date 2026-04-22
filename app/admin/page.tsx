import { createClient } from "@/lib/supabase/server"
import { Package, Tag, FileText, MessageSquare, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Dashboard — Admin | PromoShop",
  robots: { index: false, follow: false },
}

async function getStats() {
  const supabase = await createClient()

  const [
    { count: productsCount },
    { count: brandsCount },
    { count: quotesCount },
    { count: messagesCount },
    { count: newQuotesCount },
    { count: unreadMessagesCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "unread"),
  ])

  return {
    products: productsCount || 0,
    brands: brandsCount || 0,
    quotes: quotesCount || 0,
    messages: messagesCount || 0,
    newQuotes: newQuotesCount || 0,
    unreadMessages: unreadMessagesCount || 0,
  }
}

async function getRecentActivity() {
  const supabase = await createClient()

  const { data: recentQuotes } = await supabase
    .from("quote_requests")
    .select("id, name, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentMessages } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  return {
    quotes: recentQuotes || [],
    messages: recentMessages || [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const activity = await getRecentActivity()

  const statCards = [
    { label: "Total Products", value: stats.products, icon: Package, href: "/admin/products", color: "text-blue-400" },
    { label: "Brands", value: stats.brands, icon: Tag, href: "/admin/brands", color: "text-purple-400" },
    { label: "Quote Requests", value: stats.quotes, badge: stats.newQuotes, icon: FileText, href: "/admin/quotes", color: "text-green-400" },
    { label: "Messages", value: stats.messages, badge: stats.unreadMessages, icon: MessageSquare, href: "/admin/messages", color: "text-orange-400" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#888] mt-1">Welcome to the PromoShop Studio admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-[#111] border border-[#222] rounded-lg p-6 hover:border-[#333] transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.badge !== undefined && stat.badge > 0 && (
                  <span className="bg-[#ea4a3f] text-white text-xs font-bold px-2 py-1 rounded-full">
                    {stat.badge} new
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-white group-hover:text-[#ea4a3f] transition-colors">
                {stat.value}
              </p>
              <p className="text-sm text-[#888] mt-1">{stat.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quote Requests */}
        <div className="bg-[#111] border border-[#222] rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-[#222]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#ea4a3f]" />
              Recent Quote Requests
            </h2>
            <Link href="/admin/quotes" className="text-sm text-[#ea4a3f] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#222]">
            {activity.quotes.length === 0 ? (
              <p className="p-4 text-[#666] text-sm">No quote requests yet</p>
            ) : (
              activity.quotes.map((quote) => (
                <div key={quote.id} className="p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{quote.name || "Anonymous"}</p>
                      <p className="text-xs text-[#888]">{quote.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      quote.status === "new" 
                        ? "bg-green-500/10 text-green-400"
                        : "bg-[#333] text-[#888]"
                    }`}>
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-[#111] border border-[#222] rounded-lg">
          <div className="flex items-center justify-between p-4 border-b border-[#222]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ea4a3f]" />
              Recent Messages
            </h2>
            <Link href="/admin/messages" className="text-sm text-[#ea4a3f] hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-[#222]">
            {activity.messages.length === 0 ? (
              <p className="p-4 text-[#666] text-sm">No messages yet</p>
            ) : (
              activity.messages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{msg.name || "Anonymous"}</p>
                      <p className="text-xs text-[#888] truncate max-w-[200px]">
                        {msg.subject || "No subject"}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      msg.status === "unread" 
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-[#333] text-[#888]"
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
