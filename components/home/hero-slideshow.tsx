"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HomeSlide } from "@/lib/cms/home"
import { useImageSrc } from "@/hooks/use-image-src"

interface HeroSlideshowProps {
  slides: HomeSlide[]
  intervalMs?: number
}

function Slide({
  slide,
  active,
  slideIndex,
}: {
  slide: HomeSlide
  active: boolean
  slideIndex: number
}) {
  // Only render the image when the admin has set a custom override —
  // defaults stay blank to preserve the intentional "no background image"
  // hero design. The Admin panel still lists these slots so they can be
  // turned back on at any time.
  const src = useImageSrc(`home.slideshow.${slideIndex}`, "")
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        active ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!active}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={slide.alt} className="w-full h-full object-cover" />
      ) : null}
    </div>
  )
}

export function HeroSlideshow({ slides, intervalMs = 5000 }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length < 2) return
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [paused, slides.length, intervalMs])

  if (slides.length === 0) return null

  const go = (next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length)
  }

  return (
    <div
      className="relative h-72 lg:h-full lg:min-h-[500px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <Slide
          key={`${i}-${slide.src}`}
          slide={slide}
          active={i === index}
          slideIndex={i + 1}
        />
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#373a36] flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-[#373a36] flex items-center justify-center shadow-md transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "bg-[#ea4a3f] w-6" : "bg-white/70 hover:bg-white w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
