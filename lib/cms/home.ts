import { BRANDS } from "@/lib/brands"

export interface HomeSlide {
  src: string
  alt: string
}

export interface BrandLogoEntry {
  name: string
  logo: string
}

// Home page content. Edited via the upcoming admin dashboard.
//
// Image binaries Abigail dropped into VicRobNes/mainmemory are now committed
// into this repo's public/images/mainmemory/ folder. The previous
// raw.githubusercontent.com URLs were 404ing because mainmemory is a private
// repo, so serving them locally is the reliable fix.
const MAINMEMORY_LOCAL = "/images/mainmemory"

export const HOME_CONTENT = {
  hero: {
    // "Promoshop logo (2).png" from Abigail's Photos for PromoShop thread.
    logo: `${MAINMEMORY_LOCAL}/promoshop-logo.png`,
    logoAlt: "PromoShop Studio",
    body: [
      "PREMIUM MERCH FOR PREMIUM BRANDS",
    ],
  },
  // The four home-page slideshow images Abigail re-sent on Apr 13. Ordering
  // is a best guess (1.png..4.png) and can be re-ordered from here once
  // Abigail confirms in the Apr 15 review call.
  slideshow: [
    { src: `${MAINMEMORY_LOCAL}/1.png`, alt: "PromoShop slideshow image 1" },
    { src: `${MAINMEMORY_LOCAL}/2.png`, alt: "PromoShop slideshow image 2" },
    { src: `${MAINMEMORY_LOCAL}/3.png`, alt: "PromoShop slideshow image 3" },
    { src: `${MAINMEMORY_LOCAL}/4.png`, alt: "PromoShop slideshow image 4" },
  ] as HomeSlide[],
  // Brand logos for the scrolling reel — sourced from BRANDS (single source
  // of truth). Add/update logoUrl in lib/brands.ts to change reel images.
  get brandLogos(): BrandLogoEntry[] {
    return BRANDS.map((b) => ({ name: b.name, logo: b.logoUrl ?? "" }))
  },
}
