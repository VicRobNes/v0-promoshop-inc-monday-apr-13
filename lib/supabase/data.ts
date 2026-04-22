import { createClient } from "./server"

// Types matching Supabase tables
export interface SupabaseBrand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SupabaseProduct {
  id: string
  name: string
  slug: string
  brand_id: string | null
  description: string | null
  short_description: string | null
  images: string[]
  category: string | null
  tags: string[] | null
  is_featured: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface SupabaseHeroSlide {
  id: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  bg_color: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Fetch active hero slides
export async function getHeroSlides(): Promise<SupabaseHeroSlide[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching hero slides:", error)
    return []
  }
  
  return data || []
}

// Fetch active brands
export async function getSupabaseBrands(): Promise<SupabaseBrand[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching brands:", error)
    return []
  }
  
  return data || []
}

// Fetch all brands (including inactive, for admin)
export async function getAllBrands(): Promise<SupabaseBrand[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching all brands:", error)
    return []
  }
  
  return data || []
}

// Fetch brand by slug
export async function getBrandBySlug(slug: string): Promise<SupabaseBrand | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single()
  
  if (error) {
    if (error.code !== "PGRST116") { // Not found is not an error
      console.error("Error fetching brand:", error)
    }
    return null
  }
  
  return data
}

// Fetch active products
export async function getSupabaseProducts(): Promise<SupabaseProduct[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching products:", error)
    return []
  }
  
  return data || []
}

// Fetch products by brand ID
export async function getProductsByBrandId(brandId: string): Promise<SupabaseProduct[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching products by brand:", error)
    return []
  }
  
  return data || []
}

// Fetch featured products
export async function getFeaturedProducts(): Promise<SupabaseProduct[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
  
  if (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
  
  return data || []
}
