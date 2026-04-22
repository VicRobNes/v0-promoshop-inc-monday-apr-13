import { createClient } from './server'
import type { Product, ProductInsert, ProductUpdate, ProductWithBrand } from './types'

/**
 * Get all active products with their brand
 */
export async function getProducts(): Promise<ProductWithBrand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

/**
 * Get products by brand slug
 */
export async function getProductsByBrand(brandSlug: string): Promise<ProductWithBrand[]> {
  const supabase = await createClient()
  
  // First get the brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('slug', brandSlug)
    .single()

  if (!brand) return []

  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products by brand:', error)
    return []
  }

  return data || []
}

/**
 * Get a product by its slug
 */
export async function getProductBySlug(slug: string): Promise<ProductWithBrand | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<ProductWithBrand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('is_featured', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }

  return data || []
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<ProductWithBrand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .eq('category', category)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }

  return data || []
}

// ============================================
// ADMIN FUNCTIONS (require authentication)
// ============================================

/**
 * Get all products (including inactive) for admin
 */
export async function getAdminProducts(): Promise<ProductWithBrand[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin products:', error)
    return []
  }

  return data || []
}

/**
 * Create a new product
 */
export async function createProduct(product: ProductInsert): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data
}

/**
 * Update a product
 */
export async function updateProduct(id: string, updates: ProductUpdate): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}
