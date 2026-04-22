"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Plus, Trash2 } from "lucide-react"

interface SiteSetting {
  id: string
  key: string
  value: string
  description: string | null
}

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [heroSlide, setHeroSlide] = useState<{
    cta_text: string
    cta_url: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" })
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    // Fetch first active hero slide for CTA editing
    const { data: slideData } = await supabase
      .from("hero_slides")
      .select("cta_text, cta_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single()

    if (slideData) {
      setHeroSlide({
        cta_text: slideData.cta_text || "",
        cta_url: slideData.cta_url || "",
      })
    }

    // Fetch site settings if table exists
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("*")
      .order("key")

    setSettings(settingsData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const saveHeroCTA = async () => {
    if (!heroSlide) return
    setSaving(true)
    setMessage("")

    const supabase = createClient()
    const { error } = await supabase
      .from("hero_slides")
      .update({
        cta_text: heroSlide.cta_text,
        cta_url: heroSlide.cta_url,
      })
      .eq("is_active", true)

    if (error) {
      setMessage("Error saving: " + error.message)
    } else {
      setMessage("Hero CTA updated successfully!")
    }
    setSaving(false)
    setTimeout(() => setMessage(""), 3000)
  }

  const saveSetting = async (setting: SiteSetting) => {
    const supabase = createClient()
    await supabase
      .from("site_settings")
      .update({ value: setting.value })
      .eq("id", setting.id)
    setMessage("Setting saved!")
    setTimeout(() => setMessage(""), 3000)
  }

  const addSetting = async () => {
    if (!newSetting.key) return
    const supabase = createClient()
    const { error } = await supabase.from("site_settings").insert({
      key: newSetting.key,
      value: newSetting.value,
      description: newSetting.description || null,
    })
    if (!error) {
      setNewSetting({ key: "", value: "", description: "" })
      setShowAddForm(false)
      fetchData()
    }
  }

  const deleteSetting = async (id: string) => {
    const supabase = createClient()
    await supabase.from("site_settings").delete().eq("id", id)
    fetchData()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00c896]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#666] mt-1">Manage site-wide settings and configurations</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
          {message}
        </div>
      )}

      {/* Hero CTA Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Hero Call-to-Action</h2>
        <p className="text-sm text-[#666] mb-6">
          Configure the main CTA button on the homepage hero section.
        </p>

        {heroSlide ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  CTA Text
                </label>
                <input
                  type="text"
                  value={heroSlide.cta_text}
                  onChange={(e) => setHeroSlide({ ...heroSlide, cta_text: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder="Browse Our Brands"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  CTA URL
                </label>
                <input
                  type="text"
                  value={heroSlide.cta_url}
                  onChange={(e) => setHeroSlide({ ...heroSlide, cta_url: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder="/brands"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveHeroCTA}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[#666] text-sm">No active hero slides found. Create a hero slide first.</p>
        )}
      </div>

      {/* Contact Section Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Contact Section</h2>
        <p className="text-sm text-[#666] mb-6">
          Edit the heading and subheading for the contact section. These settings are managed through the site_settings table.
        </p>

        <div className="space-y-4">
          {settings
            .filter((s) => s.key.startsWith("contact_"))
            .map((setting) => (
              <div key={setting.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                    {setting.key.replace(/_/g, " ")}
                  </label>
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) =>
                      setSettings(
                        settings.map((s) => (s.id === setting.id ? { ...s, value: e.target.value } : s))
                      )
                    }
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  />
                  {setting.description && (
                    <p className="mt-1 text-xs text-[#555]">{setting.description}</p>
                  )}
                </div>
                <button
                  onClick={() => saveSetting(setting)}
                  className="mt-6 p-2 text-[#666] hover:text-[#00c896] transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteSetting(setting.id)}
                  className="mt-6 p-2 text-[#666] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Custom Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Custom Settings</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 text-sm text-[#00c896] hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add Setting
          </button>
        </div>
        <p className="text-sm text-[#666] mb-6">
          Add custom key-value settings for flexible site configuration.
        </p>

        {showAddForm && (
          <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Key
                </label>
                <input
                  type="text"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder="setting_key"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder="Value"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  className="w-full bg-[#111] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSetting}
                disabled={!newSetting.key}
                className="px-4 py-2 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
              >
                Add Setting
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {settings
            .filter((s) => !s.key.startsWith("contact_"))
            .map((setting) => (
              <div key={setting.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                    {setting.key}
                  </label>
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) =>
                      setSettings(
                        settings.map((s) => (s.id === setting.id ? { ...s, value: e.target.value } : s))
                      )
                    }
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  />
                  {setting.description && (
                    <p className="mt-1 text-xs text-[#555]">{setting.description}</p>
                  )}
                </div>
                <button
                  onClick={() => saveSetting(setting)}
                  className="mt-6 p-2 text-[#666] hover:text-[#00c896] transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteSetting(setting.id)}
                  className="mt-6 p-2 text-[#666] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

          {settings.filter((s) => !s.key.startsWith("contact_")).length === 0 && !showAddForm && (
            <p className="text-[#666] text-sm text-center py-4">No custom settings yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
