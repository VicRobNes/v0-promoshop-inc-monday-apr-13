"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function AdminLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/admin"
  const errorParam = searchParams.get("error")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Check if user is an active admin
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("id, is_active, role")
        .eq("id", data.user.id)
        .single()

      if (adminError || !adminUser) {
        setError("You do not have admin access. Please contact an administrator.")
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!adminUser.is_active) {
        setError("Your admin account has been deactivated. Please contact an administrator.")
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              PROMO<span className="text-[#00c896]">SHOP</span>
            </h1>
            <p className="text-[#666] text-sm mt-1">Admin Portal</p>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>

          {(error || errorParam) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">
                {error || (errorParam === "not_admin" ? "You do not have admin access." : "An error occurred.")}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 rounded-lg text-sm focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors placeholder:text-[#555]"
                placeholder="admin@promoshopinc.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold tracking-wider text-[#888] uppercase mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-3 pr-12 rounded-lg text-sm focus:border-[#00c896] focus:outline-none focus:ring-1 focus:ring-[#00c896] transition-colors placeholder:text-[#555]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00c896] text-[#0a0a0a] py-3.5 font-bold uppercase tracking-wider text-sm rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#555] text-sm mt-6">
          <Link href="/" className="hover:text-[#00c896] transition-colors">
            Back to Website
          </Link>
        </p>
      </div>
    </div>
  )
}


export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00c896]"></div></div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
