"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BRANDS } from "@/lib/brands"
import { BrandLogo } from "@/components/brand-logo"

export default function BrandsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return BRANDS
    const term = searchTerm.toLowerCase()
    return BRANDS.filter(brand => 
      brand.name.toLowerCase().includes(term) ||
      brand.description.toLowerCase().includes(term) ||
      brand.categories.some(cat => cat.toLowerCase().includes(term))
    )
  }, [searchTerm])

  const featuredBrands = useMemo(() => {
    return filteredBrands.filter(b => b.featured)
  }, [filteredBrands])

  const otherBrands = useMemo(() => {
    return filteredBrands.filter(b => !b.featured)
  }, [filteredBrands])

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <Header />

      {/* Hero Section */}
      <section className="py-12 lg:py-16 px-6 lg:px-8 bg-[#f9f9f9]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs font-bold tracking-wider text-[#ef473f] uppercase mb-4">
              Our Partners
            </p>
            {/* Heading renamed per Abigail's Apr 15 list: "PREMIUM BRANDS WE
                WORK WITH" → "MEET OUR BRANDS" all-caps. */}
            <h1 className="font-montserrat font-bold text-3xl lg:text-5xl text-[#1a1a1a] leading-tight mb-4 uppercase tracking-wide">
              Meet Our Brands
            </h1>
            <p className="text-base text-[#666] leading-relaxed font-visby mb-8">
              We partner with the world&apos;s best brands to bring you quality promotional products 
              that represent your company with pride.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-[#e5e5e5] text-[#1a1a1a] pl-12 pr-4 py-3.5 rounded-lg text-sm font-visby tracking-wide outline-none placeholder:text-[#999] focus:border-[#ef473f] transition-colors shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      {featuredBrands.length > 0 && (
        <section className="py-12 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-montserrat font-bold text-lg uppercase tracking-wider text-[#999] mb-8">Featured Brands</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    className="group bg-white border border-[#e5e5e5] rounded-lg p-8 hover:border-[#ef473f] hover:shadow-md transition-all duration-300"
                  >
                    <div className="w-full h-20 bg-[#f5f5f5] rounded flex items-center justify-center mb-6 group-hover:bg-[#fef2f2] transition-colors overflow-hidden px-4">
                      <BrandLogo
                        brand={brand}
                        fallbackClassName="font-montserrat font-bold text-xl tracking-wider text-[#373a36]/60 group-hover:text-[#ef473f] transition-colors uppercase"
                      />
                    </div>

                    <h3 className="font-montserrat font-bold text-lg text-[#1a1a1a] mb-2 group-hover:text-[#ef473f] transition-colors">
                      {brand.name}
                    </h3>
                    
                    <p className="text-xs font-bold tracking-wider uppercase text-[#ef473f] mb-2">
                      {brand.categories[0]}
                    </p>
                    
                    <p className="text-sm text-[#666] leading-relaxed mb-4 font-visby">
                      {brand.description}
                    </p>

                    <div className="flex items-center gap-2 text-[#ef473f] text-sm font-semibold uppercase tracking-wider">
                      View Products
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* No Results */}
      {filteredBrands.length === 0 && (
        <section className="py-16 px-6 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xl font-montserrat font-bold text-[#1a1a1a] mb-2">No Brands Found</p>
            <p className="text-[#666] font-visby">Try a different search term.</p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-montserrat font-bold text-2xl lg:text-3xl text-[#1a1a1a] mb-4">
            Looking for a Specific Brand?
          </h2>
          <p className="text-[#666] mb-8 max-w-xl mx-auto font-visby">
            We work with hundreds of brands. If you don&apos;t see what you&apos;re looking for, 
            reach out and we&apos;ll source it for you.
          </p>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 bg-[#ef473f] text-white px-10 py-4 font-bold uppercase tracking-wider text-sm rounded hover:opacity-90 transition-opacity"
          >
            Contact Us
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
