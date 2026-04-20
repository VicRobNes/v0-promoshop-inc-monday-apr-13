"use client"

import type { Brand } from "@/lib/brands"
import { SiteImage } from "@/components/site-image"
import { brandLogoId } from "@/lib/image-registry"
import { useImageSrc } from "@/hooks/use-image-src"

interface BrandLogoProps {
  brand: Brand
  width?: number
  height?: number
  className?: string
  fallbackClassName?: string
}

export function BrandLogo({
  brand,
  width = 160,
  height = 64,
  className = "max-h-14 w-auto object-contain",
  fallbackClassName = "font-montserrat font-bold text-xl tracking-wider text-[#373a36]/60 uppercase",
}: BrandLogoProps) {
  const id = brandLogoId(brand.slug)
  const src = useImageSrc(id, brand.logoUrl ?? "")

  if (src) {
    return (
      <SiteImage
        imageId={id}
        defaultSrc={brand.logoUrl ?? ""}
        alt={`${brand.name} logo`}
        width={width}
        height={height}
        className={className}
        unoptimized
      />
    )
  }
  return <span className={fallbackClassName}>{brand.name}</span>
}
