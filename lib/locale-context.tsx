"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { DEFAULT_LOCALE, LOCALES, type Locale, type LocaleConfig } from "@/lib/cms/locale"

interface LocaleContextType {
  locale: Locale
  config: LocaleConfig
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const STORAGE_KEY = "promoshop-locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Hydrate from localStorage after the first client render so the static
  // server-rendered markup stays consistent across the network round-trip.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "CAN" || stored === "USA") {
        setLocaleState(stored)
      }
    } catch {
      // localStorage may be unavailable (e.g. privacy mode); fall back to default.
    }
  }, [])

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  const config = LOCALES[locale]

  const t = (key: string) => config.spelling[key] ?? key

  return (
    <LocaleContext.Provider value={{ locale, config, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider")
  return ctx
}
