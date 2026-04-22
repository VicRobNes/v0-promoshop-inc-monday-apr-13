"use client"

import { BRANDS } from "@/lib/brands"

// Inline SVG wordmarks for each brand — no external resources needed.
// These render instantly and are not subject to hotlinking restrictions.
const BRAND_SVG_LOGOS: Record<string, React.ReactNode> = {
  rhone: (
    <svg viewBox="0 0 120 32" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="24" fontFamily="Georgia, serif" fontWeight="700" fontSize="26" letterSpacing="3" textAnchor="start">RHONE</text>
    </svg>
  ),
  travismathew: (
    <svg viewBox="0 0 220 32" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="24" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" letterSpacing="2" textAnchor="start">TravisMathew</text>
    </svg>
  ),
  victorinox: (
    <svg viewBox="0 0 200 36" className="h-8 w-auto" fill="currentColor">
      <text x="0" y="26" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" letterSpacing="1" textAnchor="start">VICTORINOX</text>
    </svg>
  ),
  stanley: (
    <svg viewBox="0 0 150 36" className="h-8 w-auto" fill="currentColor">
      <text x="0" y="28" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="28" letterSpacing="2" textAnchor="start">STANLEY</text>
    </svg>
  ),
  titleist: (
    <svg viewBox="0 0 160 34" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="25" fontFamily="Times New Roman, serif" fontWeight="700" fontSize="24" letterSpacing="1" textAnchor="start">Titleist</text>
    </svg>
  ),
  lululemon: (
    <svg viewBox="0 0 190 34" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="25" fontFamily="Arial, sans-serif" fontWeight="300" fontSize="22" letterSpacing="3" textAnchor="start">lululemon</text>
    </svg>
  ),
  "johnnie-o": (
    <svg viewBox="0 0 170 34" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="25" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="22" textAnchor="start">johnnie-O</text>
    </svg>
  ),
  stio: (
    <svg viewBox="0 0 80 36" className="h-8 w-auto" fill="currentColor">
      <text x="0" y="28" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="30" letterSpacing="4" textAnchor="start">STIO</text>
    </svg>
  ),
  patagonia: (
    <svg viewBox="0 0 220 40" className="h-9 w-auto" fill="currentColor">
      <text x="0" y="30" fontFamily="Georgia, Times New Roman, serif" fontWeight="900" fontSize="30" letterSpacing="1" textAnchor="start">patagonia</text>
    </svg>
  ),
  "helly-hansen": (
    <svg viewBox="0 0 220 34" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="25" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" letterSpacing="2" textAnchor="start">HELLY HANSEN</text>
    </svg>
  ),
  "peter-millar": (
    <svg viewBox="0 0 200 34" className="h-7 w-auto" fill="currentColor">
      <text x="0" y="25" fontFamily="Georgia, serif" fontWeight="400" fontSize="22" letterSpacing="2" textAnchor="start">PETER MILLAR</text>
    </svg>
  ),
  yeti: (
    <svg viewBox="0 0 100 36" className="h-8 w-auto" fill="currentColor">
      <text x="0" y="28" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="30" letterSpacing="3" textAnchor="start">YETI</text>
    </svg>
  ),
}

export function BrandLogoScroll() {
  const brands = BRANDS

  // Tile — renders inline SVG wordmark or text fallback on the light grey
  // (#ededed) banner. No external resources, instant rendering.
  const Tile = ({ brand, tileKey }: { brand: (typeof brands)[0]; tileKey: string }) => {
    const svgLogo = BRAND_SVG_LOGOS[brand.slug]

    return (
      <div
        key={tileKey}
        className="flex-shrink-0 mx-10 flex items-center justify-center"
      >
        <div className="h-16 flex items-center justify-center px-3">
          {svgLogo ? (
            <div className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity text-gray-900">
              {svgLogo}
            </div>
          ) : (
            <span className="font-sans text-lg font-bold tracking-widest uppercase text-gray-900 opacity-60 hover:opacity-100 transition-opacity whitespace-nowrap">
              {brand.name}
            </span>
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
