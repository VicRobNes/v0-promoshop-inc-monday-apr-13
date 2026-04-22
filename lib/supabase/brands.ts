import { createClient } from './server'
import type { Brand, BrandInsert, BrandUpdate } from './types'

/**
 * Get all active brands ordered by display_order
 */
export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching brands:', error)
    return []
  }

  return data || []
}

/**
 * Get a brand by its slug
 */
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching brand:', error)
    return null
  }

  return data
}

/**
 * Get featured brands ordered by display_order
 */
export async function getFeaturedBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching featured brands:', error)
    return []
  }

  return data || []
}

// ============================================
// ADMIN FUNCTIONS (require authentication)
// ============================================

/**
 * Get all brands (including inactive) for admin
 */
export async function getAdminBrands(): Promise<Brand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching admin brands:', error)
    return []
  }

  return data || []
}

/**
 * Create a new brand
 */
export async function createBrand(brand: BrandInsert): Promise<Brand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single()

  if (error) {
    console.error('Error creating brand:', error)
    return null
  }

  return data
}

/**
 * Update a brand
 */
export async function updateBrand(id: string, updates: BrandUpdate): Promise<Brand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating brand:', error)
    return null
  }

  return data
}

/**
 * Delete a brand
 */
export async function deleteBrand(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting brand:', error)
    return false
  }

  return true
}
