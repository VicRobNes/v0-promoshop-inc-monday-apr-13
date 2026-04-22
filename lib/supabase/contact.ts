import { createClient } from './server'
import type { ContactMessage, ContactMessageInsert } from './types'

/**
 * Create a new contact message (public)
 */
export async function createContactMessage(message: ContactMessageInsert): Promise<ContactMessage | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .insert(message)
    .select()
    .single()

  if (error) {
    console.error('Error creating contact message:', error)
    return null
  }

  return data
}

// ============================================
// ADMIN FUNCTIONS (require authentication)
// ============================================

/**
 * Get all contact messages for admin
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contact messages:', error)
    return []
  }

  return data || []
}

/**
 * Get contact messages by status
 */
export async function getContactMessagesByStatus(status: string): Promise<ContactMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contact messages by status:', error)
    return []
  }

  return data || []
}

/**
 * Update contact message status (mark as read/unread)
 */
export async function updateContactMessageStatus(
  id: string,
  status: string
): Promise<ContactMessage | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating contact message:', error)
    return null
  }

  return data
}

/**
 * Get count of unread contact messages
 */
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'unread')

  if (error) {
    console.error('Error counting unread messages:', error)
    return 0
  }

  return count || 0
}

/**
 * Delete a contact message
 */
export async function deleteContactMessage(id: string): Promise<boolean> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting contact message:', error)
    return false
  }

  return true
}
