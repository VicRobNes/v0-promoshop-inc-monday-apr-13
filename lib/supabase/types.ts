export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          hero_image_url: string | null
          website_url: string | null
          is_featured: boolean
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          hero_image_url?: string | null
          website_url?: string | null
          is_featured?: boolean
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          hero_image_url?: string | null
          website_url?: string | null
          is_featured?: boolean
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          brand_id: string | null
          name: string
          slug: string | null
          description: string | null
          sku: string | null
          price_range: string | null
          category: string | null
          tags: string[] | null
          images: string[] | null
          thumbnail_url: string | null
          is_featured: boolean
          is_active: boolean
          min_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id?: string | null
          name: string
          slug?: string | null
          description?: string | null
          sku?: string | null
          price_range?: string | null
          category?: string | null
          tags?: string[] | null
          images?: string[] | null
          thumbnail_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string | null
          name?: string
          slug?: string | null
          description?: string | null
          sku?: string | null
          price_range?: string | null
          category?: string | null
          tags?: string[] | null
          images?: string[] | null
          thumbnail_url?: string | null
          is_featured?: boolean
          is_active?: boolean
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      quote_requests: {
        Row: {
          id: string
          name: string | null
          email: string | null
          company: string | null
          phone: string | null
          country: string
          message: string | null
          items: Json | null
          status: string
          internal_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          company?: string | null
          phone?: string | null
          country?: string
          message?: string | null
          items?: Json | null
          status?: string
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          company?: string | null
          phone?: string | null
          country?: string
          message?: string | null
          items?: Json | null
          status?: string
          internal_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          subject: string | null
          message: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          subject?: string | null
          message?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          subject?: string | null
          message?: string | null
          status?: string
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json | null
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
      }
      hero_slides: {
        Row: {
          id: string
          title: string | null
          subtitle: string | null
          cta_primary_text: string | null
          cta_primary_url: string | null
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          background_image_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          subtitle?: string | null
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          background_image_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          subtitle?: string | null
          cta_primary_text?: string | null
          cta_primary_url?: string | null
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          background_image_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
  }
}

// Convenience types
export type Brand = Database['public']['Tables']['brands']['Row']
export type BrandInsert = Database['public']['Tables']['brands']['Insert']
export type BrandUpdate = Database['public']['Tables']['brands']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type QuoteRequest = Database['public']['Tables']['quote_requests']['Row']
export type QuoteRequestInsert = Database['public']['Tables']['quote_requests']['Insert']

export type ContactMessage = Database['public']['Tables']['contact_messages']['Row']
export type ContactMessageInsert = Database['public']['Tables']['contact_messages']['Insert']

export type SiteSetting = Database['public']['Tables']['site_settings']['Row']
export type HeroSlide = Database['public']['Tables']['hero_slides']['Row']
export type AdminUser = Database['public']['Tables']['admin_users']['Row']

// Product with brand relation
export type ProductWithBrand = Product & {
  brands: Brand | null
}
