import { createClient } from './server'
import type { SiteSetting, HeroSlide, Json } from './types'

/**
 * Get all site settings
 */
export async function getSiteSettings(): Promise<Record<string, Json>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')

  if (error) {
    console.error('Error fetching site settings:', error)
    return {}
  }

  // Convert to key-value object
  const settings: Record<string, Json> = {}
  data?.forEach((setting: SiteSetting) => {
    settings[setting.key] = setting.value
  })

  return settings
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key: string): Promise<Json | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    console.error('Error fetching setting:', error)
    return null
  }

  return data?.value ?? null
}

/**
 * Get all active hero slides
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching hero slides:', error)
    return []
  }

  return data || []
}

// ============================================
// ADMIN FUNCTIONS (require authentication)
// ============================================

/**
 * Update a site setting
 */
export async function updateSetting(
  key: string,
  value: Json,
  updatedBy?: string
): Promise<SiteSetting | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      key,
      value,
      updated_by: updatedBy,
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating setting:', error)
    return null
  }

  return data
}

/**
 * Get all hero slides for admin (including inactive)
 */
export async function getAdminHeroSlides(): Promise<HeroSlide[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching admin hero slides:', error)
    return []
  }

  return data || []
}

/**
 * Create a new hero slide
 */
export async function createHeroSlide(slide: Partial<HeroSlide>): Promise<HeroSlide | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_slides')
    .insert(slide)
    .select()
    .single()

  if (error) {
    console.error('Error creating hero slide:', error)
    return null
  }

  return data
}

/**
 * Update a hero slide
 */
export async function updateHeroSlide(
  id: string,
  updates: Partial<HeroSlide>
): Promise<HeroSlide | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hero_slides')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating hero slide:', error)
    return null
  }

  return data
}

/**
 * Delete a hero slide
 */
export async function deleteHeroSlide(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('hero_slides')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting hero slide:', error)
    return false
  }

  return true
}
