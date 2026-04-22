"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Plus, Trash2, Globe, Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

interface SiteSetting {
  id: string
  key: string
  value: string
  description: string | null
}

// Predefined settings structure for organization
const CONTACT_SETTINGS = [
  { key: "contact_heading", label: "Contact Heading", placeholder: "Get in Touch", description: "Main heading for contact section" },
  { key: "contact_subheading", label: "Contact Subheading", placeholder: "We'd love to hear from you", description: "Subheading text below main heading" },
  { key: "contact_email", label: "Email Address", placeholder: "info@promoshop.com", description: "Primary contact email" },
  { key: "contact_phone", label: "Phone Number", placeholder: "+1 (555) 123-4567", description: "Primary contact phone" },
  { key: "contact_address", label: "Address", placeholder: "123 Business St, City, State", description: "Physical business address" },
]

const COMPANY_SETTINGS = [
  { key: "company_name", label: "Company Name", placeholder: "PromoShop Inc", description: "Official company name" },
  { key: "company_tagline", label: "Company Tagline", placeholder: "Your Partner in Promotional Products", description: "Short tagline shown in various places" },
  { key: "company_description", label: "Company Description", placeholder: "We provide high-quality promotional products...", description: "Brief company description" },
]

const SOCIAL_SETTINGS = [
  { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/promoshop", icon: Facebook },
  { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/promoshop", icon: Instagram },
  { key: "social_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/promoshop", icon: Linkedin },
  { key: "social_twitter", label: "Twitter/X URL", placeholder: "https://twitter.com/promoshop", icon: Twitter },
]

export default function SettingsAdminPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([])
  const [heroSlide, setHeroSlide] = useState<{
    cta_text: string
    cta_url: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState({ text: "", type: "" })

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

    // Fetch site settings
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

  const getSettingValue = (key: string) => {
    return settings.find((s) => s.key === key)?.value || ""
  }

  const updateSettingValue = (key: string, value: string) => {
    const existing = settings.find((s) => s.key === key)
    if (existing) {
      setSettings(settings.map((s) => (s.key === key ? { ...s, value } : s)))
    } else {
      // Add new setting locally for unsaved changes
      setSettings([...settings, { id: `temp-${key}`, key, value, description: null }])
    }
  }

  const saveHeroCTA = async () => {
    if (!heroSlide) return
    setSaving("hero")
    setMessage({ text: "", type: "" })

    const supabase = createClient()
    const { error } = await supabase
      .from("hero_slides")
      .update({
        cta_text: heroSlide.cta_text,
        cta_url: heroSlide.cta_url,
      })
      .eq("is_active", true)

    if (error) {
      setMessage({ text: "Error saving: " + error.message, type: "error" })
    } else {
      setMessage({ text: "Hero CTA updated successfully!", type: "success" })
    }
    setSaving(null)
    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
  }

  const saveSettingsByCategory = async (keys: string[], categoryName: string) => {
    setSaving(categoryName)
    setMessage({ text: "", type: "" })

    const supabase = createClient()
    
    for (const key of keys) {
      const value = getSettingValue(key)
      const existing = settings.find((s) => s.key === key && !s.id.startsWith("temp-"))
      
      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("id", existing.id)
      } else if (value) {
        // Insert new setting
        await supabase.from("site_settings").insert({ key, value, description: null })
      }
    }

    await fetchData()
    setMessage({ text: `${categoryName} settings saved!`, type: "success" })
    setSaving(null)
    setTimeout(() => setMessage({ text: "", type: "" }), 3000)
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

  // Get custom settings (not in predefined categories)
  const predefinedKeys = [
    ...CONTACT_SETTINGS.map((s) => s.key),
    ...COMPANY_SETTINGS.map((s) => s.key),
    ...SOCIAL_SETTINGS.map((s) => s.key),
  ]
  const customSettings = settings.filter((s) => !predefinedKeys.includes(s.key))

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#666] mt-1">Manage site-wide settings and configurations</p>
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === "error"
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Hero CTA Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#00c896]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#00c896]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Hero Call-to-Action</h2>
            <p className="text-xs text-[#666]">Main CTA button on homepage hero</p>
          </div>
        </div>

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
                disabled={saving === "hero"}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
              >
                {saving === "hero" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[#666] text-sm">No active hero slides found. Create a hero slide first.</p>
        )}
      </div>

      {/* Company Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Company Information</h2>
            <p className="text-xs text-[#666]">Business name, tagline, and description</p>
          </div>
        </div>

        <div className="space-y-4">
          {COMPANY_SETTINGS.map((setting) => (
            <div key={setting.key}>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                {setting.label}
              </label>
              {setting.key === "company_description" ? (
                <textarea
                  rows={3}
                  value={getSettingValue(setting.key)}
                  onChange={(e) => updateSettingValue(setting.key, e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none resize-none"
                  placeholder={setting.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={getSettingValue(setting.key)}
                  onChange={(e) => updateSettingValue(setting.key, e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                  placeholder={setting.placeholder}
                />
              )}
              <p className="mt-1 text-xs text-[#555]">{setting.description}</p>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveSettingsByCategory(COMPANY_SETTINGS.map((s) => s.key), "Company")}
              disabled={saving === "Company"}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
            >
              {saving === "Company" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Company Info
            </button>
          </div>
        </div>
      </div>

      {/* Contact Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Contact Information</h2>
            <p className="text-xs text-[#666]">Contact section headings and contact details</p>
          </div>
        </div>

        <div className="space-y-4">
          {CONTACT_SETTINGS.map((setting) => {
            let Icon = Globe
            if (setting.key.includes("email")) Icon = Mail
            if (setting.key.includes("phone")) Icon = Phone
            if (setting.key.includes("address")) Icon = MapPin

            return (
              <div key={setting.key}>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  {setting.label}
                </label>
                <div className="relative">
                  {(setting.key.includes("email") || setting.key.includes("phone") || setting.key.includes("address")) && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  )}
                  <input
                    type={setting.key.includes("email") ? "email" : "text"}
                    value={getSettingValue(setting.key)}
                    onChange={(e) => updateSettingValue(setting.key, e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-[#333] text-white px-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none ${
                      setting.key.includes("email") || setting.key.includes("phone") || setting.key.includes("address")
                        ? "pl-10"
                        : ""
                    }`}
                    placeholder={setting.placeholder}
                  />
                </div>
                <p className="mt-1 text-xs text-[#555]">{setting.description}</p>
              </div>
            )
          })}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => saveSettingsByCategory(CONTACT_SETTINGS.map((s) => s.key), "Contact")}
              disabled={saving === "Contact"}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
            >
              {saving === "Contact" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Contact Info
            </button>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Instagram className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Social Media Links</h2>
            <p className="text-xs text-[#666]">Links displayed in footer and contact sections</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {SOCIAL_SETTINGS.map((setting) => {
            const Icon = setting.icon
            return (
              <div key={setting.key}>
                <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                  {setting.label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input
                    type="url"
                    value={getSettingValue(setting.key)}
                    onChange={(e) => updateSettingValue(setting.key, e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white pl-10 pr-4 py-2.5 rounded-lg text-sm focus:border-[#00c896] focus:outline-none"
                    placeholder={setting.placeholder}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={() => saveSettingsByCategory(SOCIAL_SETTINGS.map((s) => s.key), "Social")}
            disabled={saving === "Social"}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#00c896] text-[#0a0a0a] rounded-lg hover:bg-[#00b085] transition-colors disabled:opacity-50"
          >
            {saving === "Social" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Social Links
          </button>
        </div>
      </div>

      {/* Custom Settings */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Custom Settings</h2>
              <p className="text-xs text-[#666]">Additional key-value settings</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 text-sm text-[#00c896] hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add Setting
          </button>
        </div>

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
          {customSettings.map((setting) => (
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
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.from("site_settings").update({ value: setting.value }).eq("id", setting.id)
                  setMessage({ text: "Setting saved!", type: "success" })
                  setTimeout(() => setMessage({ text: "", type: "" }), 3000)
                }}
                className="mt-6 p-2 text-[#666] hover:text-[#00c896] transition-colors"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteSetting(setting.id)}
                className="mt-6 p-2 text-[#666] hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {customSettings.length === 0 && !showAddForm && (
            <p className="text-[#666] text-sm text-center py-4">No custom settings yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
