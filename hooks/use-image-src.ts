"use client"

import { useEffect, useState } from "react"
import {
  IMAGE_OVERRIDES_EVENT,
  getAllOverrides,
} from "@/lib/image-overrides"

// Returns the override URL for `id` if one exists, otherwise `fallback`.
// Reactively updates when overrides change (same tab via the custom event,
// cross-tab via the native `storage` event).
export function useImageSrc(id: string, fallback: string): string {
  const [src, setSrc] = useState<string>(fallback)

  useEffect(() => {
    const sync = () => {
      const all = getAllOverrides()
      setSrc(all[id] || fallback)
    }
    sync()
    window.addEventListener(IMAGE_OVERRIDES_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(IMAGE_OVERRIDES_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [id, fallback])

  return src
}
