"use client"

import { useState } from "react"
import { BRANDS } from "@/lib/brands"

// Wikipedia Commons Special:Redirect URLs that automatically resolve to the correct files
// Only 4 brands have working Wikipedia images: Patagonia, Victorinox, Helly Hansen, Titleist
const BRAND_LOGO_URLS: Record<string, string> = {
  patagonia: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Patagonia_(Unternehmen)_logo.svg&width=320",
  victorinox: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Victorinox_Logo.svg&width=320",
  "helly-hansen": "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Helly_Hansen_logo_12.png&width=320",
  titleist: "https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/Titleist_logo.svg&width=320",
  // stanley, lululemon, rhone, travismathew, peter-millar, stio, johnnie-o use text/SVG fallback
}

// Custom SVG wordmark for lululemon (lowercase italic per brand guidelines)
function LululemonLogo() {
  return (
    <svg viewBox="0 0 120 24" className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity">
      <text
        x="0"
        y="18"
        fontFamily="Georgia, serif"
        fontSize="18"
        fontStyle="italic"
        fontWeight="400"
        fill="#1a1a1a"
        letterSpacing="1"
      >
        lululemon
      </text>
    </svg>
  )
}

// Individual tile component with error state handling
function BrandTile({ brand, tileKey }: { brand: { slug: string; name: string }; tileKey: string }) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = BRAND_LOGO_URLS[brand.slug]

  // Special case: lululemon uses custom SVG wordmark
  if (brand.slug === "lululemon") {
    return (
      <div key={tileKey} className="flex-shrink-0 mx-10 flex items-center justify-center">
        <div className="h-16 flex items-center justify-center px-3">
          <LululemonLogo />
        </div>
      </div>
    )
  }

  return (
    <div
      key={tileKey}
      className="flex-shrink-0 mx-10 flex items-center justify-center"
    >
      <div className="h-16 flex items-center justify-center px-3">
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt={brand.name}
            className="max-h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-sans text-lg font-bold tracking-widest uppercase text-gray-900 opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">
            {brand.name}
          </span>
        )}
      </div>
    </div>
  )
}

export function BrandLogoScroll() {
  const brands = BRANDS

  return (
    <section className="py-10 bg-[#ededed] overflow-hidden">
      <div className="relative">
        {/* Soft fade at the edges so the scroll doesn't feel hard-cut. */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#ededed] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#ededed] to-transparent z-10" />

        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {brands.map((brand, index) => (
            <BrandTile key={`brand-1-${index}`} brand={brand} tileKey={`brand-1-${index}`} />
          ))}
          {/* Duplicate for seamless loop */}
          {brands.map((brand, index) => (
            <BrandTile key={`brand-2-${index}`} brand={brand} tileKey={`brand-2-${index}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
