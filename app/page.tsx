import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BrandLogoScroll } from "@/components/brand-logo-scroll"
import { ContactSection } from "@/components/contact-section"
import { HeroSlideshow } from "@/components/home/hero-slideshow"
import { HOME_CONTENT } from "@/lib/cms/home"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />

      {/* Hero Section with Logo + Slideshow */}
      <section className="relative bg-[#0d0d0d] overflow-hidden">
        {/* Large red accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ef473f]" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
            {/* Text + Logo Side */}
            <div className="py-16 lg:py-24 lg:pr-12">
              {HOME_CONTENT.hero.body.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-5xl lg:text-6xl xl:text-7xl font-black text-[#e7e7e7] mb-6 last:mb-10 max-w-lg"
                  style={{
                    lineHeight: "0.9em",
                    letterSpacing: "0.126em",
                  }}
                >
                  {paragraph}
                </p>
              ))}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/brands"
                  className="shimmer-cta inline-flex items-center gap-2 bg-[#ef473f] text-white px-8 py-3.5 font-bold uppercase tracking-wider text-sm rounded-full hover:bg-[#d93e36] transition-colors"
                >
                  Browse Our Brands
                  <ArrowRight className="w-4 h-4 relative z-10" />
                </Link>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 border-2 border-[#ccc] text-[#ccc] px-8 py-3.5 font-bold uppercase tracking-wider text-sm rounded-full hover:bg-white hover:text-[#111] transition-colors"
                >
                  View All Products
                </Link>
              </div>
            </div>
            {/* Slideshow Side */}
            <HeroSlideshow slides={HOME_CONTENT.slideshow} />
          </div>
        </div>
      </section>

      {/* Brand Logo Scroll */}
      <BrandLogoScroll />

      {/* "Meet Our Team" removed from the home page per client feedback
          (Apr 16): keep it on the About page only so visitors land directly on
          the brand narrative, not the roster. */}

      {/* Contact Section */}
      <ContactSection />

      <Footer />
    </div>
  )
}
