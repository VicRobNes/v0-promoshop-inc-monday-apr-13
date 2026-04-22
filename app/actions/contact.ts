"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitContactForm(formData: {
  name: string
  email: string
  company?: string
  message: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("contact_messages").insert({
    name: formData.name,
    email: formData.email,
    phone: null,
    subject: formData.company ? `Message from ${formData.company}` : "Contact Form",
    message: formData.message,
    status: "unread",
  })

  if (error) {
    console.error("Error submitting contact form:", error)
    return { success: false, error: "Failed to submit message" }
  }

  return { success: true }
}

export async function submitQuoteRequest(formData: {
  name: string
  email: string
  company?: string
  phone?: string
  country?: string
  message?: string
  items?: Array<{
    productId: string
    productName: string
    quantity: number
    brandName?: string
  }>
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("quote_requests").insert({
    name: formData.name,
    email: formData.email,
    company: formData.company,
    phone: formData.phone,
    country: formData.country || "CA",
    message: formData.message,
    items: formData.items as unknown as JSON,
    status: "new",
  })

  if (error) {
    console.error("Error submitting quote request:", error)
    return { success: false, error: "Failed to submit quote request" }
  }

  return { success: true }
}
