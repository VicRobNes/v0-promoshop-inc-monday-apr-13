"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Clock,
  CheckCircle,
  Archive,
  FileText,
} from "lucide-react"

interface QuoteRequest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  company: string | null
  brand_interest: string | null
  quantity_range: string | null
  message: string
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", icon: Clock, color: "amber" },
  { value: "in_progress", label: "In Progress", icon: FileText, color: "blue" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "emerald" },
  { value: "archived", label: "Archived", icon: Archive, color: "gray" },
]

export default function QuotesAdminPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const searchParams = useSearchParams()
  const router = useRouter()

  const fetchQuotes = useCallback(async () => {
    const supabase = createClient()
    let query = supabase.from("quote_requests").select("*").order("created_at", { ascending: false })

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data } = await query
    setQuotes(data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    const status = searchParams.get("status")
    if (status && STATUS_OPTIONS.some((s) => s.value === status)) {
      setStatusFilter(status)
    }
    fetchQuotes()
  }, [fetchQuotes, searchParams])

  const updateStatus = async (id: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("quote_requests").update({ status: newStatus }).eq("id", id)
    fetchQuotes()
  }

  const updateNotes = async (id: string, notes: string) => {
    const supabase = createClient()
    await supabase.from("quote_requests").update({ admin_notes: notes }).eq("id", id)
  }

  const exportToCSV = () => {
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Company",
      "Brand Interest",
      "Quantity",
      "Message",
      "Status",
      "Admin Notes",
      "Date",
    ]

    const csvContent = [
      headers.join(","),
      ...quotes.map((q) =>
        [
          `"${q.first_name}"`,
          `"${q.last_name}"`,
          `"${q.email}"`,
          `"${q.phone || ""}"`,
          `"${q.company || ""}"`,
          `"${q.brand_interest || ""}"`,
          `"${q.quantity_range || ""}"`,
          `"${q.message.replace(/"/g, '""')}"`,
          `"${q.status}"`,
          `"${(q.admin_notes || "").replace(/"/g, '""')}"`,
          `"${new Date(q.created_at).toLocaleDateString()}"`,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `quote-requests-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    router.push(`/admin/quotes${params.toString() ? `?${params.toString()}` : ""}`)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Quote Requests</h1>
          <p className="text-[#666] mt-1">{quotes.length} request{quotes.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="appearance-none bg-[#111] border border-[#222] text-white pl-10 pr-8 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-[#111] border border-[#222] text-white px-4 py-2.5 rounded-lg text-sm hover:border-[#333] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-lg p-8 text-center text-[#666]">
            No quote requests{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
          </div>
        ) : (
          quotes.map((quote) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              isExpanded={expandedId === quote.id}
              onToggle={() => setExpandedId(expandedId === quote.id ? null : quote.id)}
              onStatusChange={(status) => updateStatus(quote.id, status)}
              onNotesChange={(notes) => updateNotes(quote.id, notes)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function QuoteCard({
  quote,
  isExpanded,
  onToggle,
  onStatusChange,
  onNotesChange,
}: {
  quote: QuoteRequest
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (status: string) => void
  onNotesChange: (notes: string) => void
}) {
  const [notes, setNotes] = useState(quote.admin_notes || "")
  const [saving, setSaving] = useState(false)

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === quote.status) || STATUS_OPTIONS[0]
  const StatusIcon = currentStatus.icon

  const statusColors: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-blue-500/10 text-blue-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    gray: "bg-gray-500/10 text-gray-500",
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    await onNotesChange(notes)
    setSaving(false)
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#0a0a0a] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div>
            <p className="text-sm font-medium text-white">
              {quote.first_name} {quote.last_name}
            </p>
            <p className="text-xs text-[#666]">{quote.email}</p>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-[#888]">{quote.company || "-"}</p>
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-[#888]">{quote.brand_interest || "-"}</p>
          </div>
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                statusColors[currentStatus.color]
              }`}
            >
              <StatusIcon className="w-3 h-3" />
              {currentStatus.label}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#666]">
              {new Date(quote.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="text-[#666]">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#222] p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wider">
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-[#666]">Name:</span>{" "}
                  <span className="text-white">{quote.first_name} {quote.last_name}</span>
                </p>
                <p>
                  <span className="text-[#666]">Email:</span>{" "}
                  <a href={`mailto:${quote.email}`} className="text-[#00c896] hover:underline">
                    {quote.email}
                  </a>
                </p>
                {quote.phone && (
                  <p>
                    <span className="text-[#666]">Phone:</span>{" "}
                    <a href={`tel:${quote.phone}`} className="text-white">
                      {quote.phone}
                    </a>
                  </p>
                )}
                {quote.company && (
                  <p>
                    <span className="text-[#666]">Company:</span>{" "}
                    <span className="text-white">{quote.company}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quote Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wider">
                Quote Details
              </h4>
              <div className="space-y-2 text-sm">
                {quote.brand_interest && (
                  <p>
                    <span className="text-[#666]">Brand Interest:</span>{" "}
                    <span className="text-white">{quote.brand_interest}</span>
                  </p>
                )}
                {quote.quantity_range && (
                  <p>
                    <span className="text-[#666]">Quantity:</span>{" "}
                    <span className="text-white">{quote.quantity_range}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#666] uppercase tracking-wider">Message</h4>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
              <p className="text-sm text-[#ccc] whitespace-pre-wrap">{quote.message}</p>
            </div>
          </div>

          {/* Status & Admin Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#222]">
            <div>
              <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={quote.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#666] uppercase tracking-wider mb-2">
                Admin Notes
              </label>
              <div className="flex gap-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="flex-1 bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none resize-none"
                  placeholder="Internal notes..."
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={saving || notes === (quote.admin_notes || "")}
                  className="px-4 py-2 text-sm font-medium bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
