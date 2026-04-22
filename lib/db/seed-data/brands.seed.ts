export interface Brand {
  id: string
  name: string
  slug: string
  description: string
  categories: string[]
  featured?: boolean
  featuredOrder?: number
  /** GitHub user-attachment URL for the brand logo image. Empty string = text fallback. */
  logoUrl?: string
}

export const BRANDS: Brand[] = [
  {
    id: "rhone",
    name: "Rhone",
    slug: "rhone",
    description: "Premium performance apparel for driven professionals. Technical fabrics engineered for work and workout.",
    categories: ["Tops", "Activewear"],
    featured: true,
    featuredOrder: 1,
    logoUrl: "",
  },
  {
    id: "travismathew",
    name: "TravisMathew",
    slug: "travismathew",
    description: "California-inspired performance lifestyle brand. Golf and casual wear built for comfort and style.",
    categories: ["Tops", "Golf", "Casual"],
    featured: true,
    featuredOrder: 2,
    logoUrl: "",
  },
  {
    id: "victorinox",
    name: "Victorinox",
    slug: "victorinox",
    description: "Swiss precision and craftsmanship. Iconic knives, tools, and accessories built to last a lifetime.",
    categories: ["Accessories", "Outdoor"],
    featured: true,
    featuredOrder: 3,
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Victorinox-logo.svg/400px-Victorinox-logo.svg.png",
  },
  {
    id: "stanley",
    name: "Stanley",
    slug: "stanley",
    description: "Legendary drinkware with over 100 years of heritage. Rugged durability and timeless design.",
    categories: ["Drinkware"],
    featured: true,
    featuredOrder: 4,
    logoUrl: "",
  },
  {
    id: "titleist",
    name: "Titleist",
    slug: "titleist",
    description: "The #1 ball in golf. Premium golf equipment trusted by professionals worldwide.",
    categories: ["Golf", "Accessories"],
    featured: true,
    featuredOrder: 5,
    logoUrl: "",
  },
  {
    id: "lululemon",
    name: "lululemon",
    slug: "lululemon",
    description: "Premium athletic and lifestyle apparel. Technical fabrics engineered for performance and comfort.",
    categories: ["Tops", "Activewear", "Accessories"],
    featured: true,
    featuredOrder: 6,
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Lululemon_Athletica_logo.svg/400px-Lululemon_Athletica_logo.svg.png",
  },
  {
    id: "johnnie-o",
    name: "Johnnie-O",
    slug: "johnnie-o",
    description: "West Coast lifestyle brand blending California cool with East Coast prep. Comfortable, versatile performance wear.",
    categories: ["Tops", "Casual", "Golf"],
    featured: false,
    featuredOrder: 7,
    logoUrl: "",
  },
  {
    id: "stio",
    name: "Stio",
    slug: "stio",
    description: "Mountain-inspired technical apparel. Performance outdoor gear rooted in Jackson Hole.",
    categories: ["Jackets", "Tops", "Outdoor"],
    featured: false,
    featuredOrder: 8,
    logoUrl: "",
  },
  {
    id: "patagonia",
    name: "Patagonia",
    slug: "patagonia",
    description: "Outdoor apparel and gear built for adventure. Known for quality, durability, and environmental responsibility.",
    categories: ["Jackets", "Tops", "Vests", "Bags"],
    featured: false,
    featuredOrder: 9,
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Patagonia_logo.svg/400px-Patagonia_logo.svg.png",
  },
  {
    id: "helly-hansen",
    name: "Helly Hansen",
    slug: "helly-hansen",
    description: "Norwegian heritage brand for sailing and outdoor adventures. Professional-grade protection with clean marine design.",
    categories: ["Jackets", "Outerwear", "Marine"],
    featured: false,
    featuredOrder: 10,
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Helly_Hansen_logo.svg/400px-Helly_Hansen_logo.svg.png",
  },
  {
    id: "peter-millar",
    name: "Peter Millar",
    slug: "peter-millar",
    description: "Luxury golf and lifestyle apparel. Refined performance wear with timeless elegance and exceptional quality.",
    categories: ["Tops", "Polos", "Golf"],
    featured: false,
    featuredOrder: 11,
    logoUrl: "",
  },
  {
    id: "yeti",
    name: "YETI",
    slug: "yeti",
    description: "Premium coolers, drinkware, and gear designed for the wild. Built to withstand the elements.",
    categories: ["Drinkware", "Coolers", "Bags"],
    featured: false,
    featuredOrder: 12,
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/YETI_Logo.svg/400px-YETI_Logo.svg.png",
  },
]

// Helpers (getBrandBySlug / getFeaturedBrands) live in lib/brands.ts.
// This file is pure seed data — keep it free of logic so the seed script
// and fallback layer can import it with zero side effects.
