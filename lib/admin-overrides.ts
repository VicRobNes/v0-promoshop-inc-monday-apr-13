"use client"

/**
 * Admin override store — localStorage-backed CRUD for the content types
 * the client wants to manage from the dashboard (team members, brands,
 * products, theme colours). This is the interim storage layer that
 * unblocks the admin UI Abigail asked for on Apr 16; the eventual Cosmos
 * DB-backed persistence is a follow-up phase.
 *
 * Each setter broadcasts a `storage` event so any consumer hook in another
 * tab / across the page re-reads in real time.
 */

import type { TeamMember } from "@/lib/cms/team"
import type { Brand } from "@/lib/db/seed-data/brands.seed"
import type { Product } from "@/lib/products"

const TEAM_KEY = "promoshop_admin_team"
const BRANDS_KEY = "promoshop_admin_brands"
const PRODUCTS_KEY = "promoshop_admin_products"
const THEME_KEY = "promoshop_admin_theme"

export interface ThemeOverride {
  primary: string
  accent: string
  surface: string
  text: string
}

export const DEFAULT_THEME: ThemeOverride = {
  primary: "#ef473f",
  accent: "#bde7ff",
  surface: "#ffffff",
  text: "#111111",
}

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new StorageEvent("storage", { key }))
  } catch {
    // ignore
  }
}

// ---------- Team ----------
export function readTeamOverride(): TeamMember[] | null {
  return safeRead<TeamMember[]>(TEAM_KEY)
}
export function writeTeamOverride(next: TeamMember[]): void {
  safeWrite(TEAM_KEY, next)
}
export function clearTeamOverride(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(TEAM_KEY)
  window.dispatchEvent(new StorageEvent("storage", { key: TEAM_KEY }))
}

// ---------- Brands ----------
export function readBrandsOverride(): Brand[] | null {
  return safeRead<Brand[]>(BRANDS_KEY)
}
export function writeBrandsOverride(next: Brand[]): void {
  safeWrite(BRANDS_KEY, next)
}
export function clearBrandsOverride(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(BRANDS_KEY)
  window.dispatchEvent(new StorageEvent("storage", { key: BRANDS_KEY }))
}

// ---------- Products ----------
export function readProductsOverride(): Product[] | null {
  return safeRead<Product[]>(PRODUCTS_KEY)
}
export function writeProductsOverride(next: Product[]): void {
  safeWrite(PRODUCTS_KEY, next)
}
export function clearProductsOverride(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PRODUCTS_KEY)
  window.dispatchEvent(new StorageEvent("storage", { key: PRODUCTS_KEY }))
}

// ---------- Theme ----------
export function readThemeOverride(): ThemeOverride | null {
  return safeRead<ThemeOverride>(THEME_KEY)
}
export function writeThemeOverride(next: ThemeOverride): void {
  safeWrite(THEME_KEY, next)
}
export function clearThemeOverride(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(THEME_KEY)
  window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }))
}

export const OVERRIDE_KEYS = {
  team: TEAM_KEY,
  brands: BRANDS_KEY,
  products: PRODUCTS_KEY,
  theme: THEME_KEY,
} as const
