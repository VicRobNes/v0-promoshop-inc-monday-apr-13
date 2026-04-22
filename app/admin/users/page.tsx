"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Loader2,
  Users,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  RefreshCw,
} from "lucide-react"

interface AdminUser {
  id: string
  email: string | null
  role: string
  is_active: boolean
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // Fetch admin users with their auth data
    const { data: adminUsers } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true })

    if (adminUsers) {
      // Map admin users with email from current session if available
      const usersWithData = adminUsers.map((admin) => ({
        id: admin.id,
        email: admin.email || (admin.id === user?.id ? user.email : null),
        role: admin.role || "admin",
        is_active: admin.is_active,
        created_at: admin.created_at,
        last_sign_in_at: admin.last_sign_in_at || null,
      }))
      setUsers(usersWithData)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    // Don't allow disabling yourself
    if (userId === currentUserId) return

    const supabase = createClient()
    await supabase
      .from("admin_users")
      .update({ is_active: !currentStatus })
      .eq("id", userId)

    fetchUsers()
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
          <h1 className="text-2xl font-bold text-white">Admin Users</h1>
          <p className="text-[#666] mt-1">View and manage admin access</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-[#111] border border-[#222] text-[#888] px-4 py-2.5 rounded-lg text-sm hover:text-white hover:border-[#333] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-blue-200">
              Admin users are managed through the <code className="bg-blue-500/20 px-1.5 py-0.5 rounded text-xs">admin_users</code> table in Supabase.
            </p>
            <p className="text-xs text-blue-300/70 mt-1">
              To add new admins, add their user ID to the table after they sign up via Supabase Auth.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-[#666]">
            <Users className="w-12 h-12 mx-auto mb-3 text-[#444]" />
            <p>No admin users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0a0a0a]">
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Role
                  </th>
                  <th className="text-center text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Added
                  </th>
                  <th className="text-left text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Last Sign In
                  </th>
                  <th className="text-right text-xs font-semibold text-[#666] uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUserId
                  return (
                    <tr key={user.id} className="hover:bg-[#0a0a0a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center">
                            {user.is_active ? (
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Shield className="w-5 h-5 text-[#555]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {user.email ? (
                                <span className="text-sm font-medium text-white">{user.email}</span>
                              ) : (
                                <span className="text-sm text-[#666] italic">Email not available</span>
                              )}
                              {isCurrentUser && (
                                <span className="text-xs bg-[#00c896]/10 text-[#00c896] px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#555] font-mono truncate max-w-[200px]">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#888]">
                          <Calendar className="w-4 h-4 text-[#555]" />
                          {new Date(user.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.last_sign_in_at ? (
                          <span className="text-sm text-[#888]">
                            {new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-[#555]">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isCurrentUser && (
                          <button
                            onClick={() => toggleUserActive(user.id, user.is_active)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              user.is_active
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-[#111] border border-[#222] rounded-lg p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Adding New Admin Users</h3>
        <ol className="space-y-3 text-sm text-[#888]">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#222] text-[#666] flex items-center justify-center text-xs font-semibold shrink-0">1</span>
            <span>Have the new admin sign up at <code className="bg-[#222] px-1.5 py-0.5 rounded text-xs text-[#00c896]">/admin/login</code> using their email</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#222] text-[#666] flex items-center justify-center text-xs font-semibold shrink-0">2</span>
            <span>Go to your Supabase dashboard and find their user ID in Authentication {">"} Users</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#222] text-[#666] flex items-center justify-center text-xs font-semibold shrink-0">3</span>
            <span>Add a new row to the <code className="bg-[#222] px-1.5 py-0.5 rounded text-xs text-[#00c896]">admin_users</code> table with their user ID</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#222] text-[#666] flex items-center justify-center text-xs font-semibold shrink-0">4</span>
            <span>Set <code className="bg-[#222] px-1.5 py-0.5 rounded text-xs">is_active</code> to <code className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-xs">true</code> and <code className="bg-[#222] px-1.5 py-0.5 rounded text-xs">role</code> to <code className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded text-xs">admin</code></span>
          </li>
        </ol>
      </div>
    </div>
  )
}
