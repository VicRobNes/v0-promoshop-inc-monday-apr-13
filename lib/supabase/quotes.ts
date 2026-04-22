import { createClient } from './server'
import type { QuoteRequest, QuoteRequestInsert } from './types'

/**
 * Create a new quote request (public)
 */
export async function createQuoteRequest(quote: QuoteRequestInsert): Promise<QuoteRequest | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_requests')
    .insert(quote)
    .select()
    .single()

  if (error) {
    console.error('Error creating quote request:', error)
    return null
  }

  return data
}

// ============================================
// ADMIN FUNCTIONS (require authentication)
// ============================================

/**
 * Get all quote requests for admin
 */
export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quote requests:', error)
    return []
  }

  return data || []
}

/**
 * Get quote requests by status
 */
export async function getQuoteRequestsByStatus(status: string): Promise<QuoteRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quote requests by status:', error)
    return []
  }

  return data || []
}

/**
 * Get a single quote request by ID
 */
export async function getQuoteRequestById(id: string): Promise<QuoteRequest | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching quote request:', error)
    return null
  }

  return data
}

/**
 * Update quote request status
 */
export async function updateQuoteRequestStatus(
  id: string,
  status: string,
  internalNotes?: string
): Promise<QuoteRequest | null> {
  const supabase = await createClient()
  const updates: { status: string; internal_notes?: string } = { status }
  if (internalNotes !== undefined) {
    updates.internal_notes = internalNotes
  }

  const { data, error } = await supabase
    .from('quote_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating quote request:', error)
    return null
  }

  return data
}

/**
 * Get count of new quote requests
 */
export async function getNewQuoteRequestCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('quote_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  if (error) {
    console.error('Error counting new quote requests:', error)
    return 0
  }

  return count || 0
}
