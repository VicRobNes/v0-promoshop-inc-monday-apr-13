"use client"

import { useEffect, useState } from "react"
import { Save, RotateCcw } from "lucide-react"
import {
  DEFAULT_THEME,
  clearThemeOverride,
  readThemeOverride,
  writeThemeOverride,
  type ThemeOverride,
} from "@/lib/admin-overrides"

// Theme colour editor (client feedback Apr 16: "Will I be able to change
// button colours / background colours in the dashboard?"). Writes to
// localStorage; `ThemeVarsProvider` pushes the values into CSS custom
// properties so anything using `var(--brand-primary|accent|surface|text)`
// updates live.

const FIELDS: Array<{ key: keyof ThemeOverride; label: string; hint: string }> = [
  { key: "primary", label: "Primary (buttons, accents)", hint: "Default #ef473f" },
  { key: "accent", label: "Accent (highlights, sky blue)", hint: "Default #bde7ff" },
  { key: "surface", label: "Surface (card backgrounds)", hint: "Default #ffffff" },
  { key: "text", label: "Text colour (body copy)", hint: "Default #111111" },
]

export function AdminThemePanel() {
  const [theme, setTheme] = useState<ThemeOverride>(DEFAULT_THEME)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTheme(readThemeOverride() ?? DEFAULT_THEME)
  }, [])

  const update = (key: keyof ThemeOverride, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = () => {
    writeThemeOverride(theme)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    clearThemeOverride()
    setTheme(DEFAULT_THEME)
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#111]">Theme colours</h2>
          <p className="text-sm text-[#666]">
            Tweak the brand palette. Changes apply live across the site via
            CSS custom properties.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666] border border-[#d4d4d4] rounded hover:bg-[#f6f6f6]"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              dirty
                ? "bg-[#ef473f] text-white hover:bg-[#d93e36]"
                : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, hint }) => (
          <label
            key={key}
            className="bg-white border border-[#e5e5e5] rounded-lg p-4 flex items-center gap-4 cursor-pointer"
          >
            <input
              type="color"
              value={theme[key]}
              onChange={(e) => update(key, e.target.value)}
              className="w-12 h-12 rounded border border-[#e5e5e5] flex-shrink-0 cursor-pointer"
              aria-label={label}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#111] mb-1">{label}</p>
              <input
                type="text"
                value={theme[key]}
                onChange={(e) => update(key, e.target.value)}
                className="w-full font-mono text-xs text-[#666] bg-transparent border-b border-[#e5e5e5] py-1 focus:border-[#ef473f] focus:outline-none"
              />
              <p className="text-[10px] text-[#999] mt-0.5">{hint}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Live preview */}
      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.accent,
          color: theme.text,
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">
          Live preview
        </p>
        <p className="text-lg font-bold mb-4">Sample heading on the surface colour.</p>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full"
            style={{ backgroundColor: theme.primary, color: "#fff" }}
          >
            Primary button
          </button>
          <button
            type="button"
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-full"
            style={{ backgroundColor: theme.accent, color: theme.text }}
          >
            Accent button
          </button>
        </div>
      </div>
    </div>
  )
}
