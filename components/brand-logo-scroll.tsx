"use client"

import { BRANDS } from "@/lib/brands"
import { SiteImage } from "@/components/site-image"
import { brandLogoId } from "@/lib/image-registry"
import { useImageSrc } from "@/hooks/use-image-src"

export function BrandLogoScroll() {
  const brands = BRANDS

  // Tile — no borders, no background. Logo floats directly on the sky-blue
  // (#bde7ff) banner per client feedback (Apr 16). When a brand hasn't had
  // a logo uploaded yet we fall back to a neutral wordmark sized + weighted
  // to sit harmoniously next to real logos — so a half-populated scroll
  // still reads as a cohesive row rather than a broken state.
  const Tile = ({ brand, tileKey }: { brand: (typeof brands)[0]; tileKey: string }) => {
    const id = brandLogoId(brand.slug)
    const src = useImageSrc(id, brand.logoUrl ?? "")
    return (
      <div
        key={tileKey}
        className="flex-shrink-0 mx-10 flex items-center justify-center"
      >
        <div className="h-16 flex items-center justify-center px-3">
          {src ? (
            <SiteImage
              imageId={id}
              defaultSrc={brand.logoUrl ?? ""}
              alt={brand.name}
              width={180}
              height={72}
              className="max-h-14 w-auto object-contain"
              unoptimized
            />
          ) : (
            <span className="font-bebas text-3xl tracking-[0.12em] uppercase text-[#1a1f2a] whitespace-nowrap">
              {brand.name}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="py-10 bg-[#bde7ff] overflow-hidden">
      <div className="relative">
        {/* Soft fade at the edges so the scroll doesn't feel hard-cut. */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#bde7ff] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#bde7ff] to-transparent z-10" />

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
