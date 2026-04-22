import { createClient } from "@/lib/supabase/client"

export async function uploadImage(
  file: File,
  bucket: string,
  path?: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient()

  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Upload error:', error)
    return { url: null, error: error.message }
  }

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}

export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
