"use client"

import { useState } from "react"
import { BRANDS } from "@/lib/brands"
import { SiteImage } from "@/components/site-image"
import { brandLogoId } from "@/lib/image-registry"
import { useImageSrc } from "@/hooks/use-image-src"

// Wikipedia/CDN logo URLs for brands with confirmed public images.
// These are used as fallbacks when no custom logo has been uploaded.
// Brands without URLs here will show a styled text fallback.
const BRAND_LOGO_OVERRIDES: Record<string, string> = {
  victorinox: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Victorinox-logo.svg/400px-Victorinox-logo.svg.png",
  lululemon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lululemon_Athletica_logo.svg/400px-Lululemon_Athletica_logo.svg.png",
  patagonia: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Patagonia_logo.svg/400px-Patagonia_logo.svg.png",
  "helly-hansen": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Helly_Hansen_logo.svg/400px-Helly_Hansen_logo.svg.png",
  yeti: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/YETI_Logo.svg/400px-YETI_Logo.svg.png",
}

export function BrandLogoScroll() {
  const brands = BRANDS

  // Tile — no borders, no background. Logo floats directly on the light grey
  // (#ededed) banner per client feedback. When a brand hasn't had a logo
  // uploaded yet we fall back to Wikipedia/CDN logos or a neutral wordmark
  // styled to sit harmoniously next to real logos.
  const Tile = ({ brand, tileKey }: { brand: (typeof brands)[0]; tileKey: string }) => {
    const id = brandLogoId(brand.slug)
    const customSrc = useImageSrc(id, brand.logoUrl ?? "")
    // Prefer custom uploaded logo, then Wikipedia override, then text fallback
    const overrideSrc = BRAND_LOGO_OVERRIDES[brand.slug]
    const [imgError, setImgError] = useState(false)

    // Use custom uploaded logo if available
    const hasCustomLogo = !!customSrc

    // Text fallback component
    const TextFallback = () => (
      <span className="font-sans text-xl font-bold tracking-widest uppercase text-[#1a1f2a] whitespace-nowrap">
        {brand.name}
      </span>
    )

    return (
      <div
        key={tileKey}
        className="flex-shrink-0 mx-10 flex items-center justify-center"
      >
        <div className="h-16 flex items-center justify-center px-3">
          {hasCustomLogo ? (
            // Use SiteImage for custom uploaded logos (internal URLs)
            <SiteImage
              imageId={id}
              defaultSrc={customSrc}
              alt={brand.name}
              width={180}
              height={72}
              className="max-h-14 w-auto object-contain"
              unoptimized
            />
          ) : overrideSrc && !imgError ? (
            // Use regular <img> for external Wikipedia URLs to bypass Next.js optimization
            <img
              src={overrideSrc}
              alt={brand.name}
              className="h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all"
              onError={() => setImgError(true)}
            />
          ) : (
            <TextFallback />
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="py-10 bg-[#ededed] overflow-hidden">
      <div className="relative">
        {/* Soft fade at the edges so the scroll doesn't feel hard-cut. */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#ededed] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#ededed] to-transparent z-10" />

        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {brands.map((brand, index) => (
            <Tile key={`brand-1-${index}`} brand={brand} tileKey={`brand-1-${index}`} />
          ))}
          {/* Duplicate for seamless loop */}
          {brands.map((brand, index) => (
            <Tile key={`brand-2-${index}`} brand={brand} tileKey={`brand-2-${index}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
