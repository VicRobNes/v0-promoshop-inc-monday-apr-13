"use client"

import Image, { type ImageProps } from "next/image"
import { useImageSrc } from "@/hooks/use-image-src"

type SiteImageProps = Omit<ImageProps, "src"> & {
  imageId: string
  defaultSrc: string
  // Override-provided sources can be arbitrary hosted URLs or data URLs,
  // which the next/image loader won't accept without remotePatterns. When
  // `true` (default), we skip Next's optimizer for override-served URLs.
  unoptimizedWhenOverridden?: boolean
}

export function SiteImage({
  imageId,
  defaultSrc,
  unoptimized,
  unoptimizedWhenOverridden = true,
  ...rest
}: SiteImageProps) {
  const src = useImageSrc(imageId, defaultSrc)
  const isOverride = src !== defaultSrc
  const effectiveUnoptimized =
    unoptimized || (isOverride && unoptimizedWhenOverridden)

  if (!src) return null

  return <Image src={src} unoptimized={effectiveUnoptimized} {...rest} />
}
