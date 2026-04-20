"use client"

import { useEffect, type ReactNode } from "react"
import {
  DEFAULT_THEME,
  OVERRIDE_KEYS,
  readThemeOverride,
} from "@/lib/admin-overrides"

// Applies the admin-configured theme colours as CSS custom properties on
// the <html> element. Any component that consumes `var(--brand-primary)` /
// `var(--brand-accent)` / `var(--brand-surface)` / `var(--brand-text)` gets
// the override for free. Updates live when the admin saves in another tab.
export function ThemeVarsProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const theme = readThemeOverride() ?? DEFAULT_THEME
      const root = document.documentElement
      root.style.setProperty("--brand-primary", theme.primary)
      root.style.setProperty("--brand-accent", theme.accent)
      root.style.setProperty("--brand-surface", theme.surface)
      root.style.setProperty("--brand-text", theme.text)
    }
    apply()
    const handler = (e: StorageEvent) => {
      if (e.key === OVERRIDE_KEYS.theme) apply()
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])
  return <>{children}</>
}
