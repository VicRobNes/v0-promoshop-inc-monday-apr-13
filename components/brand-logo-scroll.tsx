"use client"

import { useState } from "react"
import { BRANDS } from "@/lib/brands"

// Publicly accessible brand logo image URLs from Wikipedia/CDN
const BRAND_LOGO_URLS: Record<string, string> = {
  rhone: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Rhone_Apparel_logo.svg/320px-Rhone_Apparel_logo.svg.png",
  travismathew: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/TravisMathew_wordmark.svg/320px-TravisMathew_wordmark.svg.png",
  victorinox: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Victorinox_Logo.svg/320px-Victorinox_Logo.svg.png",
  stanley: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Stanley_PMI_logo.svg/320px-Stanley_PMI_logo.svg.png",
  titleist: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Titleist_logo.svg/320px-Titleist_logo.svg.png",
  lululemon: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Lululemon_Athletica_logo.svg/320px-Lululemon_Athletica_logo.svg.png",
  "johnnie-o": "https://cdn.johnnio.com/images/logo.png",
  stio: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Stio_logo.svg/320px-Stio_logo.svg.png",
  patagonia: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Patagonia_Logo.svg/320px-Patagonia_Logo.svg.png",
  "helly-hansen": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Helly_Hansen_logo.svg/320px-Helly_Hansen_logo.svg.png",
  "peter-millar": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Peter_Millar_logo.svg/320px-Peter_Millar_logo.svg.png",
  yeti: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/YETI_Logo.svg/320px-YETI_Logo.svg.png",
}

// Individual tile component with error state handling
function BrandTile({ brand, tileKey }: { brand: { slug: string; name: string }; tileKey: string }) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = BRAND_LOGO_URLS[brand.slug]

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
