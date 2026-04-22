"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Check if user is an admin
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .eq("is_active", true)
        .single()

      if (!adminUser) {
        await supabase.auth.signOut()
        setError("You do not have admin access")
        setLoading(false)
        return
      }
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black text-white tracking-tight">
              PROMO<span className="text-[#ea4a3f]">SHOP</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <p className="text-[#888] text-sm mt-2">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111] border border-[#222] rounded-lg p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 rounded text-sm focus:border-[#ea4a3f] focus:outline-none transition-colors"
              placeholder="admin@promoshopinc.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 rounded text-sm focus:border-[#ea4a3f] focus:outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ea4a3f] text-white py-3 font-bold uppercase tracking-wider text-sm rounded hover:bg-[#d93e36] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-[#666] text-sm mt-6">
          <Link href="/" className="hover:text-white transition-colors">
            Return to website
          </Link>
        </p>
      </div>
    </div>
  )
}
